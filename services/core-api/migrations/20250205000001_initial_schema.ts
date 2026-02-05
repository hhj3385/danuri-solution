import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // ============================================
  // 1. tb_sites (Multi-tenant Root)
  // ============================================
  await knex.schema.createTable('tb_sites', (table) => {
    table.uuid('site_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('site_code', 20).notNullable().unique();
    table.string('site_name', 100).notNullable();
    table.string('site_domain', 255);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');

    table.index('site_code', 'idx_sites_code');
  });

  // ============================================
  // 2. tb_users
  // ============================================
  await knex.schema.createTable('tb_users', (table) => {
    table.uuid('user_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('site_id').notNullable().references('site_id').inTable('tb_sites').onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('user_name', 100).notNullable();
    table.string('phone', 20);
    table.string('department', 100);
    table.string('position', 100);
    table.string('role_level', 20).notNullable().defaultTo('USER');
    table.string('account_status', 20).notNullable().defaultTo('ACTIVE');
    table.timestamp('last_login_at', { useTz: true });
    table.integer('login_fail_count').notNullable().defaultTo(0);
    table.jsonb('preferences').defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');

    table.unique(['site_id', 'email']);
    table.index('site_id', 'idx_users_site');
    table.index('email', 'idx_users_email');
    table.index('role_level', 'idx_users_role');
  });

  // ============================================
  // 3. tb_common_codes
  // ============================================
  await knex.schema.createTable('tb_common_codes', (table) => {
    table.uuid('code_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('site_id').references('site_id').inTable('tb_sites').onDelete('CASCADE');
    table.string('code_group', 50).notNullable();
    table.string('code_value', 50).notNullable();
    table.string('code_name', 100).notNullable();
    table.string('code_name_en', 100);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.uuid('parent_code_id').references('code_id').inTable('tb_common_codes');
    table.jsonb('extra_data').defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['site_id', 'code_group', 'code_value']);
    table.index('code_group', 'idx_codes_group');
  });

  // ============================================
  // 4. tb_tickets
  // ============================================
  await knex.schema.createTable('tb_tickets', (table) => {
    table.uuid('ticket_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('site_id').notNullable().references('site_id').inTable('tb_sites').onDelete('CASCADE');
    table.string('ticket_no', 30).notNullable();
    table.string('ticket_type', 20).notNullable().defaultTo('SR');
    table.string('title', 500).notNullable();
    table.text('description');
    table.string('status', 20).notNullable().defaultTo('RECEIVED');
    table.string('priority', 10).notNullable().defaultTo('MEDIUM');
    table.string('category_code', 50);
    table.string('subcategory_code', 50);
    table.uuid('requester_id').notNullable().references('user_id').inTable('tb_users');
    table.uuid('assignee_id').references('user_id').inTable('tb_users');
    table.string('assignee_group', 100);
    table.timestamp('due_date', { useTz: true });
    table.timestamp('resolved_at', { useTz: true });
    table.text('resolution');
    table.integer('satisfaction_score');
    table.text('satisfaction_comment');
    table.specificType('tags', 'TEXT[]');
    table.jsonb('custom_fields').defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');

    table.unique(['site_id', 'ticket_no']);
    table.index('site_id', 'idx_tickets_site');
    table.index('ticket_no', 'idx_tickets_no');
    table.index('status', 'idx_tickets_status');
    table.index('requester_id', 'idx_tickets_requester');
    table.index('assignee_id', 'idx_tickets_assignee');
  });

  // ============================================
  // 5. tb_ticket_history (JSONB Audit)
  // ============================================
  await knex.schema.createTable('tb_ticket_history', (table) => {
    table.uuid('history_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('ticket_id').notNullable().references('ticket_id').inTable('tb_tickets').onDelete('CASCADE');
    table.string('action_type', 30).notNullable();
    table.jsonb('changes').notNullable().defaultTo('{}');
    table.text('memo');
    table.uuid('actor_id').references('user_id').inTable('tb_users');
    table.string('actor_name', 100);
    table.specificType('actor_ip', 'INET');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('ticket_id', 'idx_history_ticket');
    table.index('action_type', 'idx_history_action');
  });

  // ============================================
  // 6. tb_files
  // ============================================
  await knex.schema.createTable('tb_files', (table) => {
    table.uuid('file_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('site_id').notNullable().references('site_id').inTable('tb_sites').onDelete('CASCADE');
    table.string('target_type', 30).notNullable();
    table.uuid('target_id').notNullable();
    table.string('original_name', 255).notNullable();
    table.string('stored_name', 255).notNullable();
    table.string('file_path', 500).notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('mime_type', 100);
    table.string('checksum', 64);
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.timestamp('deleted_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').references('user_id').inTable('tb_users');

    table.index(['target_type', 'target_id'], 'idx_files_target');
  });

  // ============================================
  // 7. tb_notifications
  // ============================================
  await knex.schema.createTable('tb_notifications', (table) => {
    table.uuid('noti_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('site_id').notNullable().references('site_id').inTable('tb_sites').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('user_id').inTable('tb_users').onDelete('CASCADE');
    table.string('noti_type', 30).notNullable();
    table.string('title', 200).notNullable();
    table.text('message').notNullable();
    table.string('link_url', 500);
    table.string('reference_type', 30);
    table.uuid('reference_id');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id', 'idx_noti_user');
  });

  // ============================================
  // 8. tb_knowledge_base
  // ============================================
  await knex.schema.createTable('tb_knowledge_base', (table) => {
    table.uuid('kb_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('site_id').notNullable().references('site_id').inTable('tb_sites').onDelete('CASCADE');
    table.string('category_code', 50);
    table.string('title', 500).notNullable();
    table.text('content').notNullable();
    table.text('content_html');
    table.specificType('keywords', 'TEXT[]');
    table.integer('view_count').notNullable().defaultTo(0);
    table.boolean('is_published').notNullable().defaultTo(false);
    table.timestamp('published_at', { useTz: true });
    table.uuid('author_id').references('user_id').inTable('tb_users');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by');
    table.uuid('updated_by');

    table.index('site_id', 'idx_kb_site');
    table.index('category_code', 'idx_kb_category');
  });

  // ============================================
  // 9. tb_audit_logs
  // ============================================
  await knex.schema.createTable('tb_audit_logs', (table) => {
    table.uuid('log_id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('site_id').references('site_id').inTable('tb_sites').onDelete('SET NULL');
    table.uuid('user_id').references('user_id').inTable('tb_users').onDelete('SET NULL');
    table.string('user_email', 255);
    table.string('action', 50).notNullable();
    table.string('resource_type', 50).notNullable();
    table.uuid('resource_id');
    table.string('request_method', 10);
    table.string('request_path', 500);
    table.jsonb('request_body');
    table.integer('response_status');
    table.specificType('client_ip', 'INET');
    table.text('user_agent');
    table.integer('duration_ms');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('site_id', 'idx_audit_site');
    table.index('user_id', 'idx_audit_user');
    table.index('action', 'idx_audit_action');
  });

  // ============================================
  // Functions & Triggers
  // ============================================
  await knex.raw(`
    CREATE OR REPLACE FUNCTION fn_update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Apply triggers
  const tablesWithUpdatedAt = [
    'tb_sites', 'tb_users', 'tb_common_codes',
    'tb_tickets', 'tb_knowledge_base'
  ];

  for (const tableName of tablesWithUpdatedAt) {
    await knex.raw(`
      CREATE TRIGGER trg_${tableName.replace('tb_', '')}_updated
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
    `);
  }

  // Ticket number generator function
  await knex.raw(`
    CREATE OR REPLACE FUNCTION fn_generate_ticket_no(p_site_id UUID)
    RETURNS VARCHAR(30) AS $$
    DECLARE
        v_date VARCHAR(8);
        v_seq INTEGER;
        v_ticket_no VARCHAR(30);
    BEGIN
        v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
        SELECT COALESCE(MAX(CAST(SPLIT_PART(ticket_no, '-', 2) AS INTEGER)), 0) + 1
        INTO v_seq
        FROM tb_tickets
        WHERE site_id = p_site_id AND ticket_no LIKE v_date || '-%';
        v_ticket_no := v_date || '-' || LPAD(v_seq::TEXT, 4, '0');
        RETURN v_ticket_no;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers first
  const tablesWithUpdatedAt = [
    'tb_sites', 'tb_users', 'tb_common_codes',
    'tb_tickets', 'tb_knowledge_base'
  ];

  for (const tableName of tablesWithUpdatedAt) {
    await knex.raw(`DROP TRIGGER IF EXISTS trg_${tableName.replace('tb_', '')}_updated ON ${tableName}`);
  }

  // Drop functions
  await knex.raw('DROP FUNCTION IF EXISTS fn_update_timestamp()');
  await knex.raw('DROP FUNCTION IF EXISTS fn_generate_ticket_no(UUID)');

  // Drop tables in reverse order (respect foreign keys)
  await knex.schema.dropTableIfExists('tb_audit_logs');
  await knex.schema.dropTableIfExists('tb_knowledge_base');
  await knex.schema.dropTableIfExists('tb_notifications');
  await knex.schema.dropTableIfExists('tb_files');
  await knex.schema.dropTableIfExists('tb_ticket_history');
  await knex.schema.dropTableIfExists('tb_tickets');
  await knex.schema.dropTableIfExists('tb_common_codes');
  await knex.schema.dropTableIfExists('tb_users');
  await knex.schema.dropTableIfExists('tb_sites');
}
