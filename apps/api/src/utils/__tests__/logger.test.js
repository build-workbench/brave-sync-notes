const { Logger, createLogger } = require('../logger');

describe('Logger', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
    };
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
  });

  describe('constructor', () => {
    it('should create logger with default options', () => {
      const logger = new Logger();
      expect(logger.level).toBeDefined();
      expect(logger.serviceName).toBe('NoteSync');
    });

    it('should create logger with custom options', () => {
      const logger = new Logger({ serviceName: 'Test', level: 'debug' });
      expect(logger.serviceName).toBe('Test');
      expect(logger.level).toBe('debug');
    });
  });

  describe('log levels', () => {
    it('should log error messages', () => {
      const logger = new Logger({ level: 'error', colorize: false });
      logger.error('Test error');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      const logger = new Logger({ level: 'warn', colorize: false });
      logger.warn('Test warning');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const logger = new Logger({ level: 'info', colorize: false });
      logger.info('Test info');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log debug messages when level is debug', () => {
      const logger = new Logger({ level: 'debug', colorize: false });
      logger.debug('Test debug');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should not log debug messages when level is info', () => {
      const logger = new Logger({ level: 'info', colorize: false });
      logger.debug('Test debug');
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('metadata', () => {
    it('should include metadata in log message', () => {
      const logger = new Logger({ level: 'info', colorize: false });
      logger.info('Test message', { key: 'value' });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('"key":"value"')
      );
    });
  });

  describe('convenience methods', () => {
    it('should log socket events', () => {
      const logger = new Logger({ level: 'debug', colorize: false });
      logger.socket('connect', 'socket123');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log room actions', () => {
      const logger = new Logger({ level: 'info', colorize: false });
      logger.room('join', 'room123456789');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('room1234...')
      );
    });
  });
});

describe('createLogger', () => {
  it('should create a new logger instance', () => {
    const logger = createLogger({ serviceName: 'Custom' });
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.serviceName).toBe('Custom');
  });
});
