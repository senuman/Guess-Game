/**
 * Logger utility for consistent logging across the system
 */

import winston from 'winston';
import path from 'path';

export class Logger {
  private logger: winston.Logger;
  
  constructor(context: string) {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `${timestamp} [${context}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
      defaultMeta: { context },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File transport for errors
        new winston.transports.File({
          filename: path.join('logs', 'error.log'),
          level: 'error'
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: path.join('logs', 'combined.log')
        })
      ]
    });
  }
  
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }
  
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }
  
  error(message: string, error?: Error | any, meta?: any): void {
    if (error instanceof Error) {
      this.logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      this.logger.error(message, { error, ...meta });
    }
  }
  
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
  
  verbose(message: string, meta?: any): void {
    this.logger.verbose(message, meta);
  }
}