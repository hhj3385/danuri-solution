/**
 * DANURI ITSM - Authentication Service
 * JWT + Local (email/password) authentication
 */

import {
  AuthenticationService,
  AuthenticationBaseStrategy,
  JWTStrategy,
} from '@feathersjs/authentication';
import { LocalStrategy } from '@feathersjs/authentication-local';
import { NotAuthenticated, BadRequest } from '@feathersjs/errors';
import type { Application, User } from '../declarations';
import logger from '../logger';

// Custom local strategy with account status check
class DanuriLocalStrategy extends LocalStrategy {
  async authenticate(authentication: Record<string, any>, params: any) {
    const { email, password } = authentication;

    if (!email || !password) {
      throw new BadRequest('이메일과 비밀번호를 입력해 주세요.');
    }

    // Get user service
    const userService = this.app?.service('users') as any;
    if (!userService) {
      throw new NotAuthenticated('사용자 서비스를 찾을 수 없습니다.');
    }

    // Find user by email
    const result = await userService.find({
      query: {
        email: email.toLowerCase(),
        $limit: 1,
      },
      paginate: false,
    });

    const user = result[0] as User | undefined;

    if (!user) {
      // Increment fail counter is handled via hooks in a real implementation
      throw new NotAuthenticated('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // Check account status
    if (user.account_status !== 'ACTIVE') {
      const statusMessages: Record<string, string> = {
        INACTIVE: '비활성화된 계정입니다. 관리자에게 문의하세요.',
        LOCKED: '계정이 잠겨 있습니다. 관리자에게 문의하세요.',
        PENDING: '계정 승인 대기 중입니다.',
      };
      throw new NotAuthenticated(statusMessages[user.account_status] || '로그인할 수 없는 계정입니다.');
    }

    // Verify password using parent class method
    try {
      const result = await super.authenticate({ email, password }, params);

      // Update last login time
      await userService.patch(user.user_id, {
        last_login_at: new Date(),
        login_fail_count: 0,
      }, { _internal: true });

      logger.info('User logged in', { email: user.email, userId: user.user_id });

      return result;
    } catch (error) {
      // Increment login fail count
      const newFailCount = (user.login_fail_count || 0) + 1;
      const updateData: Partial<User> = { login_fail_count: newFailCount };

      // Lock account after 5 failed attempts
      if (newFailCount >= 5) {
        updateData.account_status = 'LOCKED';
        logger.warn('Account locked due to failed login attempts', { email: user.email });
      }

      await userService.patch(user.user_id, updateData, { _internal: true });

      throw new NotAuthenticated('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  }

  async getEntityQuery(query: Record<string, any>) {
    // Query by email (case-insensitive)
    return {
      ...query,
      email: query.email?.toLowerCase(),
    };
  }
}

// Custom JWT strategy
class DanuriJWTStrategy extends JWTStrategy {
  async authenticate(authentication: Record<string, any>, params: any) {
    const result = await super.authenticate(authentication, params);

    // Verify user still exists and is active
    if (result.user) {
      const user = result.user as User;
      if (user.account_status !== 'ACTIVE') {
        throw new NotAuthenticated('계정이 비활성화되었습니다.');
      }
    }

    return result;
  }
}

// Configure authentication
export default function (app: Application): void {
  const authentication = new AuthenticationService(app);

  // Register strategies
  authentication.register('jwt', new DanuriJWTStrategy());
  authentication.register('local', new DanuriLocalStrategy());

  // Configure service path
  app.use('authentication', authentication);

  // Get authentication service for hooks
  const authService = app.service('authentication');

  // Add after create hook to log authentication
  authService.hooks({
    after: {
      create: [
        async (context) => {
          const { user } = context.result;
          if (user) {
            logger.info('Authentication successful', {
              userId: user.user_id,
              email: user.email,
              method: context.data?.strategy || 'unknown',
            });
          }
          return context;
        },
      ],
      remove: [
        async (context) => {
          logger.info('User logged out', {
            userId: context.params.user?.user_id,
          });
          return context;
        },
      ],
    },
    error: {
      all: [
        async (context) => {
          logger.warn('Authentication failed', {
            error: context.error?.message,
            strategy: context.data?.strategy,
          });
          return context;
        },
      ],
    },
  });
}
