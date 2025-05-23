export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// В реальном приложении это будет определяться переменной окружения
const CURRENT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

interface LogData {
  message: string;
  [key: string]: any; // Для дополнительных данных
}

const formatLog = (level: keyof typeof LogLevel, data: LogData): string => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    ...data,
  };
  // В production можно выводить в JSON
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(logEntry);
  }
  // В development - более читаемый формат
  const { message, ...rest } = data;
  return `${logEntry.timestamp} [${level}] ${message}${Object.keys(rest).length > 0 ? ' - ' + JSON.stringify(rest) : ''}`;
};

const log = (level: LogLevel, message: string, context?: Record<string, any>) => {
  if (level < CURRENT_LOG_LEVEL) {
    return; // Не логируем сообщения ниже текущего уровня
  }

  const logData: LogData = { message, ...(context && { context }) };

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formatLog('DEBUG', logData));
      break;
    case LogLevel.INFO:
      console.info(formatLog('INFO', logData));
      break;
    case LogLevel.WARN:
      console.warn(formatLog('WARN', logData));
      break;
    case LogLevel.ERROR:
      console.error(formatLog('ERROR', logData));
      break;
    default:
      console.log(formatLog('INFO', logData)); // Фоллбэк на INFO
  }
};

export const logger = {
  debug: (message: string, context?: Record<string, any>) => log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: Record<string, any>) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: Record<string, any>) => log(LogLevel.WARN, message, context),
  error: (message: string, error?: Error | any, context?: Record<string, any>) => {
    let errorInfo: Record<string, any> = {};
    if (error) {
      if (error instanceof Error) {
        errorInfo.errorMessage = error.message;
        errorInfo.errorStack = error.stack;
        if (error.cause) {
          errorInfo.errorCause = String(error.cause);
        }
      } else if (typeof error === 'object' && error !== null) {
        errorInfo = { ...errorInfo, ...error };
      } else {
        errorInfo.errorDetails = String(error);
      }
    }
    log(LogLevel.ERROR, message, { ...errorInfo, ...context });
  },
};

// Пример использования:
// logger.info('User logged in', { userId: '123' });
// try { /* ... */ } catch (e) { logger.error('Operation failed', e, { details: '... ' }); } 