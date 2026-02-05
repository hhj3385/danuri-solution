/**
 * DANURI ITSM - Log Runtime Hook
 * Measures and logs request execution time
 */

import type { HookContext } from '../declarations';
import type { NextFunction } from '@feathersjs/feathers';
import logger from '../logger';

const LOG_SLOW_THRESHOLD_MS = 1000; // Log warning if request takes longer than 1 second

export const logRuntime = async (context: HookContext, next: NextFunction): Promise<HookContext> => {
  const startTime = Date.now();
  const { path, method, id } = context;

  // Store start time for after hooks
  context.params._startTime = startTime;

  try {
    await next();

    const duration = Date.now() - startTime;
    const logData = {
      path,
      method,
      id: id || null,
      duration: `${duration}ms`,
      user: context.params.user?.email || 'anonymous',
      provider: context.params.provider || 'server',
    };

    if (duration > LOG_SLOW_THRESHOLD_MS) {
      logger.warn('Slow request detected', logData);
    } else {
      logger.debug('Request completed', logData);
    }

    return context;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Request failed', {
      path,
      method,
      id: id || null,
      duration: `${duration}ms`,
      error: error.message,
      code: error.code,
    });
    throw error;
  }
};

export default logRuntime;
