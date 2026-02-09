import pino from 'pino'
import { createLoggerConfig, createPinoLogger } from './logger-config'

export { createLoggerConfig }

export type Logger = pino.Logger

let loggerInstance: Logger | null = null

export function getLogger(): Logger {
  if (!loggerInstance) {
    const config = createLoggerConfig()
    loggerInstance = createPinoLogger(config)
  }
  return loggerInstance
}

export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return getLogger().child(bindings)
}

export function createContextLogger(context: string, metadata?: Record<string, unknown>): Logger {
  return getLogger().child({
    context,
    ...metadata
  })
}

