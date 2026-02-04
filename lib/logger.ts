type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  userId?: string
  endpoint?: string
  duration?: number
  statusCode?: number
  meta?: Record<string, unknown>
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry)
}

export const logger = {
  info(message: string, meta?: Partial<Omit<LogEntry, "timestamp" | "level" | "message">>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      ...meta,
    }
    console.log(formatLog(entry))
  },

  warn(message: string, meta?: Partial<Omit<LogEntry, "timestamp" | "level" | "message">>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      ...meta,
    }
    console.warn(formatLog(entry))
  },

  error(message: string, meta?: Partial<Omit<LogEntry, "timestamp" | "level" | "message">>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      ...meta,
    }
    console.error(formatLog(entry))
  },

  debug(message: string, meta?: Partial<Omit<LogEntry, "timestamp" | "level" | "message">>) {
    if (process.env.NODE_ENV === "development") {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "debug",
        message,
        ...meta,
      }
      console.log(formatLog(entry))
    }
  },
}
