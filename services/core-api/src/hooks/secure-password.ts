/**
 * DANURI ITSM - Secure Password Hook
 * Hashes passwords using bcrypt before storage
 */

import type { HookContext } from '../declarations';
import type { NextFunction } from '@feathersjs/feathers';
import { BadRequest } from '@feathersjs/errors';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

// Password complexity requirements
const PASSWORD_RULES = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

const validatePassword = (password: string): void => {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`비밀번호는 최소 ${PASSWORD_RULES.minLength}자 이상이어야 합니다.`);
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다.');
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다.');
  }

  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다.');
  }

  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다.');
  }

  if (errors.length > 0) {
    throw new BadRequest('비밀번호가 보안 요구사항을 충족하지 않습니다.', {
      errors,
    });
  }
};

export const securePassword = async (context: HookContext, next: NextFunction): Promise<HookContext> => {
  const { data, method } = context;

  // Only process create and patch with password
  if (!['create', 'patch', 'update'].includes(method)) {
    return next();
  }

  // Handle single or batch data
  const items = Array.isArray(data) ? data : [data];

  for (const item of items) {
    if (item.password) {
      // Validate password on create, or on update if provided
      if (method === 'create' || item.password !== undefined) {
        validatePassword(item.password);
      }

      // Hash the password
      item.password_hash = await bcrypt.hash(item.password, SALT_ROUNDS);

      // Remove plain text password
      delete item.password;
    }
  }

  // Update context data
  context.data = Array.isArray(data) ? items : items[0];

  await next();

  // Remove password_hash from response
  const removePasswordHash = (record: any) => {
    if (record && typeof record === 'object') {
      delete record.password_hash;
      delete record.password;
    }
    return record;
  };

  if (context.result) {
    if (Array.isArray(context.result)) {
      context.result = context.result.map(removePasswordHash);
    } else if (context.result.data && Array.isArray(context.result.data)) {
      context.result.data = context.result.data.map(removePasswordHash);
    } else {
      removePasswordHash(context.result);
    }
  }

  return context;
};

// Utility function to verify password
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export default securePassword;
