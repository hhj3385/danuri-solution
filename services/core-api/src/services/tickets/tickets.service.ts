/**
 * DANURI ITSM - Tickets Service
 * Service Request / Incident / Problem / Change management
 */

import { KnexService, KnexAdapterParams } from '@feathersjs/knex';
import { BadRequest } from '@feathersjs/errors';
import type { Application, Ticket, TicketHistory, HookContext } from '../../declarations';
import {
  authenticate,
  restrictToSite,
  setAuditFields,
  logRuntime,
  handleError,
} from '../../hooks';
import logger from '../../logger';

interface TicketsParams extends KnexAdapterParams<Ticket> {}

// Status transition rules
const STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['PROCESSING', 'CANCELLED'],
  COMPLETED: ['PROCESSING'], // Reopen
  CANCELLED: [], // Terminal state
};

// Tickets service class
class TicketsService extends KnexService<Ticket, string, TicketsParams> {}

// Generate ticket number
async function generateTicketNo(app: Application, siteId: string): Promise<string> {
  const knex = app.get('knexClient');
  const result = await knex.raw(
    'SELECT fn_generate_ticket_no(?::uuid) as ticket_no',
    [siteId]
  );
  return result.rows[0].ticket_no;
}

// Create ticket history record
async function createTicketHistory(
  app: Application,
  ticketId: string,
  actionType: TicketHistory['action_type'],
  changes: Record<string, unknown>,
  context: HookContext
): Promise<void> {
  const knex = app.get('knexClient');
  const { user } = context.params;

  await knex('tb_ticket_history').insert({
    ticket_id: ticketId,
    action_type: actionType,
    changes: JSON.stringify(changes),
    actor_id: user?.user_id,
    actor_name: user?.user_name,
    actor_ip: context.params.ip || context.params.headers?.['x-forwarded-for'],
  });
}

// Configure tickets service
export default function (app: Application): void {
  const knex = app.get('knexClient');

  if (!knex) {
    throw new Error('Knex client not initialized');
  }

  const service = new TicketsService({
    Model: knex,
    name: 'tb_tickets',
    id: 'ticket_id',
    paginate: app.get('paginate'),
  });

  app.use('tickets', service);

  const ticketsService = app.service('tickets');

  ticketsService.hooks({
    around: {
      all: [logRuntime, handleError],
    },
    before: {
      all: [authenticate('jwt')],
      find: [restrictToSite],
      get: [restrictToSite],
      create: [
        restrictToSite,
        setAuditFields,
        // Generate ticket number and set defaults
        async (context: HookContext, next) => {
          const { user } = context.params;
          const data = context.data;

          // Generate ticket number
          data.ticket_no = await generateTicketNo(app, user!.site_id);

          // Set requester if not provided
          if (!data.requester_id) {
            data.requester_id = user!.user_id;
          }

          // Set defaults
          data.status = 'RECEIVED';
          data.ticket_type = data.ticket_type || 'SR';
          data.priority = data.priority || 'MEDIUM';
          data.custom_fields = data.custom_fields || {};

          await next();
        },
      ],
      patch: [
        restrictToSite,
        setAuditFields,
        // Validate status transitions
        async (context: HookContext, next) => {
          const { data, id } = context;

          if (data.status && id) {
            const currentTicket = await ticketsService._get(id, context.params);
            const currentStatus = currentTicket.status;
            const newStatus = data.status;

            // Check if transition is allowed
            const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
            if (!allowedTransitions.includes(newStatus)) {
              throw new BadRequest(
                `상태를 '${currentStatus}'에서 '${newStatus}'로 변경할 수 없습니다. ` +
                `허용된 상태: ${allowedTransitions.join(', ') || '없음'}`
              );
            }

            // Require assignee when moving to PROCESSING
            if (newStatus === 'PROCESSING' && !currentTicket.assignee_id && !data.assignee_id) {
              throw new BadRequest('처리중 상태로 변경하려면 담당자를 지정해야 합니다.');
            }

            // Require resolution when completing
            if (newStatus === 'COMPLETED' && !currentTicket.resolution && !data.resolution) {
              throw new BadRequest('완료 처리하려면 해결 내용을 입력해야 합니다.');
            }

            // Set resolved_at timestamp
            if (newStatus === 'COMPLETED') {
              data.resolved_at = new Date();
            }
          }

          await next();
        },
      ],
      update: [
        restrictToSite,
        setAuditFields,
      ],
      remove: [
        // Soft delete or restrict
        async (context: HookContext, next) => {
          throw new BadRequest('티켓은 삭제할 수 없습니다. 취소 상태로 변경해 주세요.');
        },
      ],
    },
    after: {
      create: [
        // Create initial history record
        async (context: HookContext, next) => {
          await next();
          const ticket = context.result;

          await createTicketHistory(app, ticket.ticket_id, 'CREATED', {
            title: ticket.title,
            ticket_type: ticket.ticket_type,
            priority: ticket.priority,
          }, context);

          logger.info('Ticket created', {
            ticketId: ticket.ticket_id,
            ticketNo: ticket.ticket_no,
            userId: context.params.user?.user_id,
          });
        },
      ],
      patch: [
        // Create history record for changes
        async (context: HookContext, next) => {
          await next();
          const ticket = context.result;
          const data = context.data;

          // Determine action type based on changes
          let actionType: TicketHistory['action_type'] = 'UPDATED';
          const changes: Record<string, unknown> = {};

          if (data.status) {
            actionType = data.status === 'COMPLETED' ? 'RESOLVED' : 'STATUS_CHANGED';
            changes.status = { old: context.params._previousStatus, new: data.status };
          }

          if (data.assignee_id) {
            actionType = 'ASSIGNED';
            changes.assignee_id = data.assignee_id;
          }

          // Record non-status/assignee changes
          const trackedFields = ['title', 'description', 'priority', 'due_date', 'resolution'];
          for (const field of trackedFields) {
            if (data[field] !== undefined) {
              changes[field] = data[field];
            }
          }

          if (Object.keys(changes).length > 0) {
            await createTicketHistory(app, ticket.ticket_id, actionType, changes, context);
          }

          logger.info('Ticket updated', {
            ticketId: ticket.ticket_id,
            actionType,
            userId: context.params.user?.user_id,
          });
        },
      ],
    },
  });
}

export { TicketsService, TicketsParams };
