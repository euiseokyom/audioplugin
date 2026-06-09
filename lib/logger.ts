type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg: message,
  };
  if (context && Object.keys(context).length > 0) {
    payload.context = context;
  }
  return JSON.stringify(payload);
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatMessage("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(formatMessage("warn", message, context));
  },
  error(message: string, context?: LogContext) {
    console.error(formatMessage("error", message, context));
  },
};
