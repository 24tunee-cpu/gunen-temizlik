/**
 * @fileoverview Logger Sistemi - TURBOPACK SAFE VERSION
 * @description All console output DISABLED to prevent infinite error loops
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  source: string;
  correlationId?: string;
  duration?: number;
  environment?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const IS_BROWSER = typeof window !== 'undefined';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

let globalCorrelationId: string | undefined;

export type RemoteLogHandler = (entry: LogEntry) => void | Promise<void>;

export interface PerformanceTimer {
  end: (message?: string) => void;
}

export class Logger {
  private minLevel: LogLevel = IS_PRODUCTION ? 'info' : 'debug';
  private enableRemote: boolean = false;
  private source: string;
  private correlationId?: string;
  private remoteHandler?: RemoteLogHandler;

  constructor(source: string = 'app', options?: {
    correlationId?: string;
    remoteHandler?: RemoteLogHandler;
    minLevel?: LogLevel;
  }) {
    this.source = source;
    this.correlationId = options?.correlationId;
    this.remoteHandler = options?.remoteHandler;
    if (options?.minLevel) {
      this.minLevel = options.minLevel;
    }
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  getCorrelationId(): string | undefined {
    return this.correlationId;
  }

  setRemoteHandler(handler: RemoteLogHandler): void {
    this.remoteHandler = handler;
    this.enableRemote = true;
  }

  child(subSource: string): Logger {
    return new Logger(`${this.source}/${subSource}`, {
      correlationId: this.correlationId,
      remoteHandler: this.remoteHandler,
      minLevel: this.minLevel,
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private getCorrelationIdInternal(): string | undefined {
    return this.correlationId || globalCorrelationId;
  }

  private async log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      error,
      source: this.source,
      correlationId: this.getCorrelationIdInternal(),
      duration,
      environment: process.env.NODE_ENV,
    };

    // Remote logging only - NO console output
    if (this.enableRemote && this.remoteHandler) {
      try {
        await this.remoteHandler(entry);
      } catch {
        // Silently fail to avoid loops
      }
    }
  }

  // ============================================
  // PUBLIC LOG METHODS - All console output disabled
  // ============================================

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  fatal(message: string, context?: LogContext, error?: Error): void {
    this.log('fatal', message, context, error);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  startTimer(label: string): PerformanceTimer {
    const startTime = performance.now();
    return {
      end: (message?: string) => {
        const duration = Math.round(performance.now() - startTime);
        this.log('debug', message || `${label} completed`, { label, duration }, undefined, duration);
      },
    };
  }

  withCorrelationId(correlationId: string): Logger {
    return new Logger(this.source, {
      correlationId,
      remoteHandler: this.remoteHandler,
      minLevel: this.minLevel,
    });
  }

  group(label: string): void {
    // Disabled to prevent Turbopack issues
  }

  groupEnd(): void {
    // Disabled to prevent Turbopack issues
  }

  table(data: unknown[]): void {
    // Disabled to prevent Turbopack issues
  }

  time(label: string): void {
    // Disabled to prevent Turbopack issues
  }

  timeEnd(label: string): void {
    // Disabled to prevent Turbopack issues
  }

  devOnly(fn: (logger: Logger) => void): void {
    if (!IS_PRODUCTION) {
      fn(this);
    }
  }
}

// ============================================
// GLOBAL UTILITIES
// ============================================

export function setGlobalCorrelationId(id: string): void {
  globalCorrelationId = id;
}

export function clearGlobalCorrelationId(): void {
  globalCorrelationId = undefined;
}

// ============================================
// EXPORTS
// ============================================

const logger = new Logger('gunen-temizlik');

export const createLogger = (source: string, options?: {
  correlationId?: string;
  remoteHandler?: RemoteLogHandler;
  minLevel?: LogLevel;
}) => new Logger(source, options);

export { logger };
export default logger;
