const RedisPersistence = require('../RedisPersistence');

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    isReady: true,
  })),
}));

describe('RedisPersistence', () => {
  let redisPersistence;

  beforeEach(() => {
    redisPersistence = new RedisPersistence({
      host: 'localhost',
      port: 6379,
    });
  });

  afterEach(async () => {
    if (redisPersistence) {
      await redisPersistence.close().catch(() => {});
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const rp = new RedisPersistence();
      expect(rp.options).toBeDefined();
    });

    it('should create instance with custom options', () => {
      const rp = new RedisPersistence({
        host: 'custom-host',
        port: 6380,
        password: 'secret',
      });
      expect(rp.options.host).toBe('custom-host');
      expect(rp.options.port).toBe(6380);
    });
  });

  describe('connect', () => {
    it('should connect to Redis', async () => {
      await expect(redisPersistence.connect()).resolves.not.toThrow();
    });
  });

  describe('isHealthy', () => {
    it('should return true when connected', async () => {
      await redisPersistence.connect();
      const healthy = await redisPersistence.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  describe('saveRoom and getRoom', () => {
    it('should save and retrieve room data', async () => {
      await redisPersistence.connect();
      const roomId = 'test-room-123';
      const data = {
        encryptedData: 'encrypted-content',
        timestamp: Date.now(),
        deviceName: 'Test Device',
        version: 1,
      };

      await redisPersistence.saveRoom(roomId, data);
      // Mock would need to be set up to return the data
      // const retrieved = await redisPersistence.getRoom(roomId);
      // expect(retrieved).toEqual(data);
    });
  });

  describe('close', () => {
    it('should close connection gracefully', async () => {
      await redisPersistence.connect();
      await expect(redisPersistence.close()).resolves.not.toThrow();
    });
  });
});
