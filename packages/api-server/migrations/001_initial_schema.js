/**
 * Initial Database Schema Migration
 */

exports.up = async function(knex) {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // sites table
  await knex.schema.createTable('sites', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('domain', 255).notNullable().unique();
    table.text('description');
    table.string('status', 20).defaultTo('active');
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('domain');
    table.index('status');
  });

  // api_keys table
  await knex.schema.createTable('api_keys', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE');
    table.string('key_id', 50).notNullable().unique();
    table.text('public_key').notNullable();
    table.text('private_key').notNullable();
    table.string('key_type', 10).defaultTo('live');
    table.string('status', 20).defaultTo('active');
    table.timestamp('expires_at');
    table.timestamp('last_used_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('site_id');
    table.index('key_id');
  });

  // users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE');
    table.string('email', 255).notNullable();
    table.string('name', 100);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('last_seen_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['site_id', 'email']);
    table.index(['site_id', 'email']);
  });

  // tickets table
  await knex.schema.createTable('tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('site_id').notNullable().references('id').inTable('sites');
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('ticket_no', 20).notNullable().unique();
    table.string('title', 200).notNullable();
    table.text('content');
    table.string('category', 50);
    table.string('status', 20).defaultTo('pending');
    table.string('priority', 10).defaultTo('medium');
    table.uuid('assigned_to');
    table.text('resolution');
    table.timestamp('resolved_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('site_id');
    table.index('user_id');
    table.index('status');
    table.index('created_at');
  });

  // knowledge table
  await knex.schema.createTable('knowledge', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('site_id').references('id').inTable('sites').onDelete('CASCADE');
    table.text('question').notNullable();
    table.text('answer').notNullable();
    table.specificType('keywords', 'text[]').defaultTo('{}');
    table.string('category', 50);
    table.integer('hit_count').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // ticket_history table
  await knex.schema.createTable('ticket_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ticket_id').notNullable().references('id').inTable('tickets').onDelete('CASCADE');
    table.string('action', 50).notNullable();
    table.jsonb('old_value');
    table.jsonb('new_value');
    table.text('comment');
    table.uuid('created_by');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('ticket_id');
    table.index('created_at');
  });

  // Ticket number auto-generation function
  await knex.raw(`
    CREATE OR REPLACE FUNCTION generate_ticket_no()
    RETURNS TRIGGER AS $$
    DECLARE
        today_count INT;
        today_str VARCHAR(8);
    BEGIN
        today_str := TO_CHAR(NOW(), 'YYYYMMDD');
        SELECT COUNT(*) + 1 INTO today_count
        FROM tickets
        WHERE ticket_no LIKE 'SR-' || today_str || '-%';

        NEW.ticket_no := 'SR-' || today_str || '-' || LPAD(today_count::TEXT, 4, '0');
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_ticket_no
        BEFORE INSERT ON tickets
        FOR EACH ROW
        WHEN (NEW.ticket_no IS NULL)
        EXECUTE FUNCTION generate_ticket_no();
  `);

  // Full-text search index for knowledge
  await knex.raw(`
    CREATE INDEX idx_knowledge_search ON knowledge
    USING GIN (to_tsvector('simple', question || ' ' || answer || ' ' || array_to_string(keywords, ' ')));
  `);

  await knex.raw(`
    CREATE INDEX idx_knowledge_keywords ON knowledge USING GIN (keywords);
  `);
};

exports.down = async function(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_ticket_no ON tickets');
  await knex.raw('DROP FUNCTION IF EXISTS generate_ticket_no');

  await knex.schema.dropTableIfExists('ticket_history');
  await knex.schema.dropTableIfExists('knowledge');
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('api_keys');
  await knex.schema.dropTableIfExists('sites');
};
