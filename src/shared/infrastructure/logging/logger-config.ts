import pino = require('pino');
import type { LogLevel } from './types';

export interface LoggerConfig {
  level: LogLevel;
  pretty: boolean;
  environment: string;
}

const VALID_LOG_LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'];

function getDefaultLogLevel(environment: string): LogLevel {
  if (environment === 'production') {
    return 'info';
  }
  if (environment === 'test') {
    return 'silent'; // Sem logs em testes
  }
  return 'debug';
}

function validateLogLevel(level: string | undefined): LogLevel {
  if (!level) {
    return getDefaultLogLevel(process.env.NODE_ENV || 'development');
  }

  const normalizedLevel = level.toLowerCase() as LogLevel;
  if (VALID_LOG_LEVELS.includes(normalizedLevel)) {
    return normalizedLevel;
  }

  const defaultLevel = getDefaultLogLevel(process.env.NODE_ENV || 'development');
  console.warn(
    `Invalid LOG_LEVEL "${level}". Valid levels are: ${VALID_LOG_LEVELS.join(', ')}. Using default: ${defaultLevel}`
  );
  return defaultLevel;
}

function shouldUsePrettyPrint(environment: string): boolean {
  return environment !== 'production' && environment !== 'test';
}

export function createLoggerConfig(): LoggerConfig {
  const environment = process.env.NODE_ENV || 'development';
  const logLevel = validateLogLevel(process.env.LOG_LEVEL);
  const pretty = shouldUsePrettyPrint(environment);

  return {
    level: logLevel,
    pretty,
    environment,
  };
}

export function createPinoLogger(config: LoggerConfig) {
  const options: pino.LoggerOptions = {
    level: config.level,
    ...(config.pretty && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
  };

  return pino(options);
}
