export interface LogContext {
    userId?: string
    requestId?: string
    apiKeyId?: string
    [key: string]: unknown
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

