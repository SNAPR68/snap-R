const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const isDev = process.env.NODE_ENV === 'development';

function shouldLog(level: string): boolean {
  return (LEVELS[level] ?? 1) >= (LEVELS[LOG_LEVEL] ?? 1);
}

function formatLog(level: string, message: string, ...args: unknown[]) {
  if (isDev) {
    return `[${level.toUpperCase()}] ${message} ${args.map(a => JSON.stringify(a)).join(' ')}`;
  }
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    data: args.length === 1 ? args[0] : args.length > 0 ? args : undefined,
  });
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (shouldLog('debug')) console.log(formatLog('debug', message, ...args));
  },
  info: (message: string, ...args: unknown[]) => {
    if (shouldLog('info')) console.log(formatLog('info', message, ...args));
  },
  warn: (message: string, ...args: unknown[]) => {
    if (shouldLog('warn')) console.warn(formatLog('warn', message, ...args));
  },
  error: (message: string, ...args: unknown[]) => {
    if (shouldLog('error')) console.error(formatLog('error', message, ...args));
  },
};
