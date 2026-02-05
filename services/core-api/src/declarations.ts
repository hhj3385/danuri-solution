/**
 * DANURI ITSM Core API - Type Declarations
 * Feathers.js v5 TypeScript definitions
 */

import { Application as ExpressFeathers } from '@feathersjs/express';
import { HookContext as FeathersHookContext, NextFunction } from '@feathersjs/feathers';
import { AuthenticationService } from '@feathersjs/authentication';

// Database entity types
export interface Site {
  site_id: string;
  site_code: string;
  site_name: string;
  site_domain?: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  user_id: string;
  site_id: string;
  email: string;
  password_hash?: string;
  password?: string; // For input only, never stored
  user_name: string;
  phone?: string;
  department?: string;
  position?: string;
  role_level: 'USER' | 'AGENT' | 'TENANT_ADMIN' | 'SUPER_ADMIN';
  account_status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'PENDING';
  last_login_at?: Date;
  login_fail_count: number;
  preferences: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Ticket {
  ticket_id: string;
  site_id: string;
  ticket_no: string;
  ticket_type: 'SR' | 'INCIDENT' | 'PROBLEM' | 'CHANGE' | 'TASK';
  title: string;
  description?: string;
  status: 'RECEIVED' | 'PROCESSING' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category_code?: string;
  subcategory_code?: string;
  requester_id: string;
  assignee_id?: string;
  assignee_group?: string;
  due_date?: Date;
  resolved_at?: Date;
  resolution?: string;
  satisfaction_score?: number;
  satisfaction_comment?: string;
  tags?: string[];
  custom_fields: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  updated_by?: string;
}

export interface TicketHistory {
  history_id: string;
  ticket_id: string;
  action_type: 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'UPDATED' |
               'COMMENTED' | 'FILE_ATTACHED' | 'FILE_DELETED' |
               'RESOLVED' | 'REOPENED' | 'ESCALATED';
  changes: Record<string, unknown>;
  memo?: string;
  actor_id?: string;
  actor_name?: string;
  actor_ip?: string;
  created_at: Date;
}

export interface FileUpload {
  file_id: string;
  site_id: string;
  target_type: 'TICKET' | 'COMMENT' | 'KNOWLEDGE' | 'USER_PROFILE';
  target_id: string;
  original_name: string;
  stored_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  checksum?: string;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at: Date;
  created_by?: string;
}

export interface Notification {
  noti_id: string;
  site_id: string;
  user_id: string;
  noti_type: 'TICKET_ASSIGNED' | 'TICKET_UPDATED' | 'TICKET_COMMENTED' |
             'TICKET_RESOLVED' | 'MENTION' | 'SYSTEM' | 'REMINDER';
  title: string;
  message: string;
  link_url?: string;
  reference_type?: string;
  reference_id?: string;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

// Service types map
export interface ServiceTypes {
  authentication: AuthenticationService;
  users: any;
  tickets: any;
  'ticket-history': any;
  notifications: any;
  uploads: any;
}

// Application configuration
export interface Configuration {
  host: string;
  port: number;
  public: string;
  origins: string[];
  paginate: {
    default: number;
    max: number;
  };
  authentication: {
    entity: string;
    service: string;
    secret: string;
    authStrategies: string[];
    jwtOptions: {
      header: { typ: string };
      audience: string;
      issuer: string;
      algorithm: string;
      expiresIn: string;
    };
    local: {
      usernameField: string;
      passwordField: string;
    };
  };
  postgres: {
    client: string;
    connection: string | Record<string, unknown>;
    pool: { min: number; max: number };
  };
}

// Application type
export type Application = ExpressFeathers<ServiceTypes, Configuration>;

// Hook context with typed params
export interface HookContext<S = any> extends FeathersHookContext<Application, S> {
  params: {
    authenticated?: boolean;
    user?: User;
    query?: Record<string, unknown>;
    provider?: string;
    connection?: unknown;
    headers?: Record<string, string>;
    ip?: string;
    [key: string]: unknown;
  };
}

// Hook function type
export type Hook<S = any> = (context: HookContext<S>, next: NextFunction) => Promise<HookContext<S>>;
