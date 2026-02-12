import pino from 'pino';

export interface LoggerConfig {
  level: string;
  pretty: boolean;
  environment: string;
}

export function createLoggerConfig(): LoggerConfig {
  return {
    level: 'debug',
    pretty: true,
    environment: process.env.NODE_ENV || 'development',
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
