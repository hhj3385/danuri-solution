/**
 * DANURI ITSM - Global Error Handler Hook
 * Transforms database errors to user-friendly messages
 */

import type { HookContext } from '../declarations';
import type { NextFunction } from '@feathersjs/feathers';
import { GeneralError, BadRequest, NotFound, Conflict } from '@feathersjs/errors';
import logger from '../logger';

// PostgreSQL error codes
const PG_ERROR_CODES: Record<string, { message: string; ErrorClass: any }> = {
  '23505': { message: '이미 존재하는 데이터입니다.', ErrorClass: Conflict },
  '23503': { message: '참조하는 데이터가 존재하지 않습니다.', ErrorClass: BadRequest },
  '23502': { message: '필수 입력값이 누락되었습니다.', ErrorClass: BadRequest },
  '23514': { message: '입력값이 허용 범위를 벗어났습니다.', ErrorClass: BadRequest },
  '22P02': { message: '잘못된 입력 형식입니다.', ErrorClass: BadRequest },
  '42P01': { message: '요청한 리소스를 찾을 수 없습니다.', ErrorClass: NotFound },
  '42703': { message: '잘못된 필드명입니다.', ErrorClass: BadRequest },
  '08006': { message: '데이터베이스 연결 오류가 발생했습니다.', ErrorClass: GeneralError },
  '57014': { message: '요청 시간이 초과되었습니다.', ErrorClass: GeneralError },
};

// Extract constraint name from error for specific messaging
const getConstraintMessage = (constraint: string): string | null => {
  const constraintMessages: Record<string, string> = {
    'tb_users_site_id_email_key': '이미 등록된 이메일입니다.',
    'tb_tickets_site_id_ticket_no_key': '이미 존재하는 티켓번호입니다.',
    'tb_sites_site_code_key': '이미 존재하는 사이트 코드입니다.',
    'tb_common_codes_site_id_code_group_code_value_key': '이미 존재하는 코드입니다.',
  };
  return constraintMessages[constraint] || null;
};

export const handleError = async (context: HookContext, next: NextFunction): Promise<HookContext> => {
  try {
    await next();
    return context;
  } catch (error: any) {
    // Log original error
    logger.error('Service error', {
      path: context.path,
      method: context.method,
      code: error.code,
      message: error.message,
      constraint: error.constraint,
      detail: error.detail,
    });

    // Already a Feathers error, re-throw
    if (error.className) {
      throw error;
    }

    // PostgreSQL error handling
    if (error.code && PG_ERROR_CODES[error.code]) {
      const { message, ErrorClass } = PG_ERROR_CODES[error.code];

      // Check for specific constraint violations
      if (error.constraint) {
        const constraintMsg = getConstraintMessage(error.constraint);
        if (constraintMsg) {
          throw new ErrorClass(constraintMsg);
        }
      }

      throw new ErrorClass(message);
    }

    // Knex-specific errors
    if (error.message?.includes('ECONNREFUSED')) {
      throw new GeneralError('데이터베이스 서버에 연결할 수 없습니다.');
    }

    if (error.message?.includes('timeout')) {
      throw new GeneralError('요청 처리 시간이 초과되었습니다.');
    }

    // Generic error - hide internal details in production
    const isDev = process.env.NODE_ENV !== 'production';
    throw new GeneralError(
      isDev ? error.message : '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    );
  }
};

export default handleError;
