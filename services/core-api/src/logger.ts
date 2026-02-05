/**
 * DANURI ITSM Core API - Logger
 * Winston-based structured logging
 */

import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    // Filter out sensitive data
    const sanitized = { ...metadata };
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.password_hash) sanitized.password_hash = '[REDACTED]';
    if (sanitized.accessToken) sanitized.accessToken = '[REDACTED]';

    msg += ` ${JSON.stringify(sanitized)}`;
  }

  return msg;
});

// Create logger instance
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    logFormat
  ),
  defaultMeta: { service: 'danuri-core-api' },
  transports: [
    // Console transport
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        logFormat
      ),
    }),
    // File transport for errors
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
  ],
});

export default logger;
