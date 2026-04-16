/**
 * Logger utility for the server
 * Provides structured logging with different levels and formatting
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LOG_COLORS = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
    this.serviceName = options.serviceName || 'NoteSync';
    this.includeTimestamp = options.includeTimestamp !== false;
    this.colorize = options.colorize !== false && process.stdout.isTTY;
  }

  _formatMessage(level, message, meta = {}) {
    const parts = [];

    // Timestamp
    if (this.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    // Service name
    parts.push(`[${this.serviceName}]`);

    // Log level
    const levelUpper = level.toUpperCase().padEnd(5);
    if (this.colorize) {
      parts.push(`${LOG_COLORS[level]}${levelUpper}${LOG_COLORS.reset}`);
    } else {
      parts.push(levelUpper);
    }

    // Main message
    parts.push(message);

    // Metadata
    if (Object.keys(meta).length > 0) {
      parts.push(JSON.stringify(meta));
    }

    return parts.join(' ');
  }

  _shouldLog(level) {
    const currentLevel = LOG_LEVELS[this.level] || LOG_LEVELS.info;
    const messageLevel = LOG_LEVELS[level] || LOG_LEVELS.info;
    return messageLevel <= currentLevel;
  }

  error(message, meta = {}) {
    if (this._shouldLog('error')) {
      console.error(this._formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this._shouldLog('info')) {
      console.log(this._formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this._shouldLog('debug')) {
      console.log(this._formatMessage('debug', message, meta));
    }
  }

  // Convenience methods for common patterns
  socket(event, socketId, data = {}) {
    this.debug(`Socket ${event}`, { socketId, ...data });
  }

  room(action, roomId, data = {}) {
    this.info(`Room ${action}`, { roomId: roomId.substring(0, 8) + '...', ...data });
  }

  request(method, path, status, duration) {
    this.info(`HTTP ${method} ${path}`, { status, duration: `${duration}ms` });
  }

  errorWithStack(message, error) {
    this.error(message, { error: error.message, stack: error.stack });
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the class and the singleton
module.exports = {
  Logger,
  logger,
  createLogger: (options) => new Logger(options),
};
