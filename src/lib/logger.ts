export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
    if (entry.context) {
      return `${base} ${JSON.stringify(entry.context)}`
    }
    return base
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    const formatted = this.formatEntry(entry)

    switch (level) {
      case 'error':
        console.error(formatted)
        if (error && this.isDevelopment) {
          console.error(error.stack)
        }
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'debug':
        if (this.isDevelopment) {
          console.log(formatted)
        }
        break
      default:
        console.log(formatted)
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error)
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }

  auth(event: string, userId?: string, context?: Record<string, unknown>) {
    this.info(`Auth: ${event}`, { userId, ...context })
  }

  inventory(event: string, partId?: string, storeId?: string, context?: Record<string, unknown>) {
    this.info(`Inventory: ${event}`, { partId, storeId, ...context })
  }

  admin(event: string, adminId?: string, context?: Record<string, unknown>) {
    this.info(`Admin: ${event}`, { adminId, ...context })
  }

  search(query: string, resultsCount: number, duration: number) {
    this.debug('Search completed', { query, resultsCount, duration })
  }
}

export const logger = new Logger()