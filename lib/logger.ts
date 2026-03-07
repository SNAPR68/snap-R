const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level: string): boolean {
  return (LEVELS[level] ?? 1) >= (LEVELS[LOG_LEVEL] ?? 1);
}

export const logger = {
  debug: (...args: unknown[]) => { if (shouldLog('debug')) console.log('[DEBUG]', ...args); },
  info: (...args: unknown[]) => { if (shouldLog('info')) console.log('[INFO]', ...args); },
  warn: (...args: unknown[]) => { if (shouldLog('warn')) console.warn('[WARN]', ...args); },
  error: (...args: unknown[]) => { if (shouldLog('error')) console.error('[ERROR]', ...args); },
};
