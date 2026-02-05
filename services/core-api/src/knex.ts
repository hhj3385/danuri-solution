/**
 * DANURI ITSM Core API - Knex Database Connection
 * PostgreSQL connection pool management
 */

import knex, { Knex } from 'knex';
import type { Application } from './declarations';
import logger from './logger';

// Declare module augmentation for app.get('knexClient')
declare module './declarations' {
  interface Configuration {
    knexClient?: Knex;
  }
}

export default function (app: Application): void {
  const config = app.get('postgres');

  if (!config) {
    throw new Error('PostgreSQL configuration not found');
  }

  const db = knex({
    client: config.client || 'pg',
    connection: config.connection,
    pool: config.pool || { min: 2, max: 10 },
    // Enable snake_case to camelCase conversion (optional)
    // postProcessResponse: (result) => { ... },
    // wrapIdentifier: (value, origImpl) => { ... },
  });

  // Test connection
  db.raw('SELECT 1')
    .then(() => {
      logger.info('PostgreSQL connection established');
    })
    .catch((err: Error) => {
      logger.error('PostgreSQL connection failed', { error: err.message });
      process.exit(1);
    });

  // Store knex instance on app
  app.set('knexClient', db);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing database connection');
    db.destroy();
  });
}
