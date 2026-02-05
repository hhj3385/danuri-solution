/**
 * DANURI ITSM - Users Service
 * User management with Knex adapter
 */

import { KnexService, KnexAdapterParams } from '@feathersjs/knex';
import type { Application, User, HookContext } from '../../declarations';
import {
  authenticate,
  requireRole,
  restrictToSite,
  setAuditFields,
  securePassword,
  logRuntime,
  handleError,
} from '../../hooks';

// Users service options
interface UsersParams extends KnexAdapterParams<User> {
  _internal?: boolean; // Flag for internal calls that skip auth
}

// Users service class
class UsersService extends KnexService<User, string, UsersParams> {
  // Override to exclude password_hash from results
  async _find(params?: UsersParams) {
    const result = await super._find(params);

    const removePassword = (user: User) => {
      const { password_hash, ...safeUser } = user as any;
      return safeUser;
    };

    if (Array.isArray(result)) {
      return result.map(removePassword);
    }

    if (result.data) {
      result.data = result.data.map(removePassword);
    }

    return result;
  }

  async _get(id: string, params?: UsersParams) {
    const user = await super._get(id, params);
    const { password_hash, ...safeUser } = user as any;
    return safeUser;
  }
}

// Configure users service
export default function (app: Application): void {
  const knex = app.get('knexClient');

  if (!knex) {
    throw new Error('Knex client not initialized');
  }

  // Create service instance
  const service = new UsersService({
    Model: knex,
    name: 'tb_users',
    id: 'user_id',
    paginate: app.get('paginate'),
  });

  // Register service
  app.use('users', service);

  // Get registered service for hooks
  const usersService = app.service('users');

  // Configure hooks
  usersService.hooks({
    around: {
      all: [logRuntime, handleError],
    },
    before: {
      all: [],
      find: [
        authenticate('jwt'),
        restrictToSite,
      ],
      get: [
        authenticate('jwt'),
        restrictToSite,
      ],
      create: [
        // Allow unauthenticated signup or require admin
        async (context: HookContext, next) => {
          const allowPublicSignup = false; // Set to true to allow self-registration

          if (context.params.provider && !allowPublicSignup) {
            // External request requires authentication
            await authenticate('jwt')(context, async () => {});
            await requireRole('TENANT_ADMIN', 'SUPER_ADMIN')(context, async () => {});
          }
          await next();
        },
        securePassword,
        setAuditFields,
        // Normalize email to lowercase
        async (context: HookContext, next) => {
          if (context.data?.email) {
            context.data.email = context.data.email.toLowerCase();
          }
          await next();
        },
      ],
      patch: [
        authenticate('jwt'),
        // Skip auth for internal calls (login tracking)
        async (context: HookContext, next) => {
          if (!context.params._internal) {
            await requireRole('TENANT_ADMIN', 'SUPER_ADMIN')(context, async () => {});
          }
          await next();
        },
        securePassword,
        setAuditFields,
      ],
      update: [
        authenticate('jwt'),
        requireRole('TENANT_ADMIN', 'SUPER_ADMIN'),
        securePassword,
        setAuditFields,
      ],
      remove: [
        authenticate('jwt'),
        requireRole('SUPER_ADMIN'),
      ],
    },
    after: {
      all: [],
      create: [
        // Remove sensitive fields from response
        async (context: HookContext, next) => {
          await next();
          if (context.result) {
            delete context.result.password_hash;
          }
        },
      ],
    },
  });
}

export { UsersService, UsersParams };
