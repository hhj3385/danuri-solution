import { Knex } from 'knex';

const DEFAULT_SITE_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000002';

export async function up(knex: Knex): Promise<void> {
  // Insert default site
  await knex('tb_sites').insert({
    site_id: DEFAULT_SITE_ID,
    site_code: 'DEFAULT',
    site_name: '기본 사이트',
    site_domain: 'localhost',
    is_active: true,
    settings: JSON.stringify({
      timezone: 'Asia/Seoul',
      language: 'ko',
      ticketPrefix: 'SR',
    }),
  });

  // Insert system common codes
  const commonCodes = [
    // Ticket Status
    { code_group: 'TICKET_STATUS', code_value: 'RECEIVED', code_name: '접수', code_name_en: 'Received', sort_order: 1 },
    { code_group: 'TICKET_STATUS', code_value: 'PROCESSING', code_name: '처리중', code_name_en: 'Processing', sort_order: 2 },
    { code_group: 'TICKET_STATUS', code_value: 'ON_HOLD', code_name: '보류', code_name_en: 'On Hold', sort_order: 3 },
    { code_group: 'TICKET_STATUS', code_value: 'COMPLETED', code_name: '완료', code_name_en: 'Completed', sort_order: 4 },
    { code_group: 'TICKET_STATUS', code_value: 'CANCELLED', code_name: '취소', code_name_en: 'Cancelled', sort_order: 5 },
    // Ticket Priority
    { code_group: 'TICKET_PRIORITY', code_value: 'LOW', code_name: '낮음', code_name_en: 'Low', sort_order: 1 },
    { code_group: 'TICKET_PRIORITY', code_value: 'MEDIUM', code_name: '보통', code_name_en: 'Medium', sort_order: 2 },
    { code_group: 'TICKET_PRIORITY', code_value: 'HIGH', code_name: '높음', code_name_en: 'High', sort_order: 3 },
    { code_group: 'TICKET_PRIORITY', code_value: 'URGENT', code_name: '긴급', code_name_en: 'Urgent', sort_order: 4 },
    // Ticket Type
    { code_group: 'TICKET_TYPE', code_value: 'SR', code_name: '서비스요청', code_name_en: 'Service Request', sort_order: 1 },
    { code_group: 'TICKET_TYPE', code_value: 'INCIDENT', code_name: '장애', code_name_en: 'Incident', sort_order: 2 },
    { code_group: 'TICKET_TYPE', code_value: 'PROBLEM', code_name: '문제', code_name_en: 'Problem', sort_order: 3 },
    { code_group: 'TICKET_TYPE', code_value: 'CHANGE', code_name: '변경', code_name_en: 'Change', sort_order: 4 },
    { code_group: 'TICKET_TYPE', code_value: 'TASK', code_name: '작업', code_name_en: 'Task', sort_order: 5 },
    // User Role
    { code_group: 'USER_ROLE', code_value: 'USER', code_name: '일반사용자', code_name_en: 'User', sort_order: 1 },
    { code_group: 'USER_ROLE', code_value: 'AGENT', code_name: '담당자', code_name_en: 'Agent', sort_order: 2 },
    { code_group: 'USER_ROLE', code_value: 'TENANT_ADMIN', code_name: '테넌트관리자', code_name_en: 'Tenant Admin', sort_order: 3 },
    { code_group: 'USER_ROLE', code_value: 'SUPER_ADMIN', code_name: '시스템관리자', code_name_en: 'Super Admin', sort_order: 4 },
    // Account Status
    { code_group: 'ACCOUNT_STATUS', code_value: 'ACTIVE', code_name: '활성', code_name_en: 'Active', sort_order: 1 },
    { code_group: 'ACCOUNT_STATUS', code_value: 'INACTIVE', code_name: '비활성', code_name_en: 'Inactive', sort_order: 2 },
    { code_group: 'ACCOUNT_STATUS', code_value: 'LOCKED', code_name: '잠금', code_name_en: 'Locked', sort_order: 3 },
    { code_group: 'ACCOUNT_STATUS', code_value: 'PENDING', code_name: '대기', code_name_en: 'Pending', sort_order: 4 },
    // Notification Types
    { code_group: 'NOTI_TYPE', code_value: 'TICKET_ASSIGNED', code_name: '티켓배정', code_name_en: 'Ticket Assigned', sort_order: 1 },
    { code_group: 'NOTI_TYPE', code_value: 'TICKET_UPDATED', code_name: '티켓수정', code_name_en: 'Ticket Updated', sort_order: 2 },
    { code_group: 'NOTI_TYPE', code_value: 'TICKET_COMMENTED', code_name: '댓글등록', code_name_en: 'Ticket Commented', sort_order: 3 },
    { code_group: 'NOTI_TYPE', code_value: 'TICKET_RESOLVED', code_name: '티켓완료', code_name_en: 'Ticket Resolved', sort_order: 4 },
    { code_group: 'NOTI_TYPE', code_value: 'MENTION', code_name: '멘션', code_name_en: 'Mention', sort_order: 5 },
    { code_group: 'NOTI_TYPE', code_value: 'SYSTEM', code_name: '시스템', code_name_en: 'System', sort_order: 6 },
  ];

  await knex('tb_common_codes').insert(
    commonCodes.map((code) => ({
      site_id: null, // Global codes
      ...code,
      is_active: true,
      extra_data: JSON.stringify({}),
    }))
  );

  // Insert super admin user
  // Password: admin123! (bcrypt hash)
  // WARNING: Change this password immediately in production!
  await knex('tb_users').insert({
    user_id: ADMIN_USER_ID,
    site_id: DEFAULT_SITE_ID,
    email: 'admin@danuri.go.kr',
    password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MqrK7uGfCVvqBmS5Yh5t5u5w5w5w5w5', // admin123!
    user_name: '시스템관리자',
    role_level: 'SUPER_ADMIN',
    account_status: 'ACTIVE',
    preferences: JSON.stringify({
      language: 'ko',
      timezone: 'Asia/Seoul',
      notifications: {
        email: true,
        push: true,
      },
    }),
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex('tb_users').where('user_id', ADMIN_USER_ID).del();
  await knex('tb_common_codes').whereNull('site_id').del();
  await knex('tb_sites').where('site_id', DEFAULT_SITE_ID).del();
}
