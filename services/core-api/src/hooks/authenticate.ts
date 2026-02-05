/**
 * DANURI ITSM - Authentication Hooks
 * JWT authentication and authorization utilities
 */

import type { HookContext } from '../declarations';
import type { NextFunction } from '@feathersjs/feathers';
import { Forbidden, NotAuthenticated } from '@feathersjs/errors';
import { authenticate as feathersAuthenticate } from '@feathersjs/authentication';

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = ['USER', 'AGENT', 'TENANT_ADMIN', 'SUPER_ADMIN'] as const;
type RoleLevel = typeof ROLE_HIERARCHY[number];

/**
 * Standard Feathers authentication hook
 */
export const authenticate = (...strategies: string[]) => {
  return feathersAuthenticate(...strategies);
};

/**
 * Require minimum role level
 */
export const requireRole = (...allowedRoles: RoleLevel[]) => {
  return async (context: HookContext, next: NextFunction): Promise<HookContext> => {
    const { user } = context.params;

    if (!user) {
      throw new NotAuthenticated('인증이 필요합니다.');
    }

    const userRoleIndex = ROLE_HIERARCHY.indexOf(user.role_level as RoleLevel);
    const hasPermission = allowedRoles.some(role => {
      const requiredIndex = ROLE_HIERARCHY.indexOf(role);
      return userRoleIndex >= requiredIndex;
    });

    if (!hasPermission) {
      throw new Forbidden('이 작업을 수행할 권한이 없습니다.');
    }

    await next();
    return context;
  };
};

/**
 * Restrict to owner or admin
 */
export const restrictToOwnerOrAdmin = (ownerField: string = 'user_id') => {
  return async (context: HookContext, next: NextFunction): Promise<HookContext> => {
    const { user } = context.params;
    const { method, id } = context;

    if (!user) {
      throw new NotAuthenticated('인증이 필요합니다.');
    }

    // Admins can access everything
    if (['TENANT_ADMIN', 'SUPER_ADMIN'].includes(user.role_level)) {
      await next();
      return context;
    }

    // For get/patch/remove, check ownership
    if (['get', 'patch', 'update', 'remove'].includes(method) && id) {
      const service = context.service as any;
      const record = await service._get(id);

      if (record[ownerField] !== user.user_id) {
        throw new Forbidden('자신의 데이터만 접근할 수 있습니다.');
      }
    }

    // For find, add owner filter
    if (method === 'find') {
      context.params.query = {
        ...context.params.query,
        [ownerField]: user.user_id,
      };
    }

    await next();
    return context;
  };
};

/**
 * Restrict to same site (multi-tenant isolation)
 */
export const restrictToSite = async (context: HookContext, next: NextFunction): Promise<HookContext> => {
  const { user } = context.params;
  const { method, data } = context;

  if (!user) {
    throw new NotAuthenticated('인증이 필요합니다.');
  }

  // Super admin can access all sites
  if (user.role_level === 'SUPER_ADMIN') {
    await next();
    return context;
  }

  // Add site filter for queries
  if (['find', 'get'].includes(method)) {
    context.params.query = {
      ...context.params.query,
      site_id: user.site_id,
    };
  }

  // Ensure site_id is set on create/update
  if (['create', 'patch', 'update'].includes(method) && data) {
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
      if (item.site_id && item.site_id !== user.site_id) {
        throw new Forbidden('다른 사이트의 데이터를 생성/수정할 수 없습니다.');
      }
      item.site_id = user.site_id;
    }
    context.data = Array.isArray(data) ? items : items[0];
  }

  await next();
  return context;
};

/**
 * Set created_by and updated_by fields
 */
export const setAuditFields = async (context: HookContext, next: NextFunction): Promise<HookContext> => {
  const { user } = context.params;
  const { method, data } = context;

  if (user && data) {
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      if (method === 'create') {
        item.created_by = user.user_id;
        item.updated_by = user.user_id;
      } else if (['patch', 'update'].includes(method)) {
        item.updated_by = user.user_id;
      }
    }

    context.data = Array.isArray(data) ? items : items[0];
  }

  await next();
  return context;
};

export default { authenticate, requireRole, restrictToOwnerOrAdmin, restrictToSite, setAuditFields };
