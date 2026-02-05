import type { Knex } from 'knex';
import { config } from '@feathersjs/configuration';

const appConfig = config()();

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: appConfig.postgres?.connection || {
      host: 'localhost',
      port: 5432,
      user: 'danuri',
      password: '',
      database: 'danuri_itsm',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 5,
      max: 20,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
      extension: 'ts',
    },
  },
};

export default knexConfig;
