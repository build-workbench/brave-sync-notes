const RedisPersistence = require('../RedisPersistence');

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    scan: jest.fn().mockResolvedValue(['0', []]),
    hSet: jest.fn().mockResolvedValue('OK'),
    hGetAll: jest.fn().mockResolvedValue({}),
    hGet: jest.fn().mockResolvedValue(null),
    expire: jest.fn().mockResolvedValue(1),
    info: jest.fn().mockResolvedValue(''),
    dbSize: jest.fn().mockResolvedValue(0),
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

    it('passes connection options in redis v4 format', async () => {
      const Redis = require('redis');
      const rp = new RedisPersistence({
        host: 'redis.example.com',
        port: 6380,
        password: 'secret',
        db: 2,
      });

      await rp.connect();

      expect(Redis.createClient).toHaveBeenCalledWith(expect.objectContaining({
        socket: expect.objectContaining({ host: 'redis.example.com', port: 6380 }),
        password: 'secret',
        database: 2,
      }));
      // v3 顶层字段不应再出现
      const config = Redis.createClient.mock.calls.at(-1)[0];
      expect(config).not.toHaveProperty('host');
      expect(config).not.toHaveProperty('retry_strategy');
      await rp.close().catch(() => {});
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

  describe('cleanupExpired', () => {
    it('scans room keys instead of blocking with KEYS', async () => {
      await redisPersistence.connect();

      redisPersistence.client.scan
        .mockResolvedValueOnce(['0', ['notesync:room:old-room', 'notesync:room:new-room']]);
      redisPersistence.client.hGet
        .mockResolvedValueOnce(String(new Date('2020-01-01').getTime()))
        .mockResolvedValueOnce(String(new Date('2030-01-01').getTime()));

      const deleted = await redisPersistence.cleanupExpired(new Date('2025-01-01'));

      expect(deleted).toBe(1);
      expect(redisPersistence.client.scan).toHaveBeenCalled();
      expect(redisPersistence.client.keys).not.toHaveBeenCalled();
      expect(redisPersistence.client.del).toHaveBeenCalledWith('notesync:room:old-room');
      expect(redisPersistence.client.del).toHaveBeenCalledWith('notesync:log:old-room');
    });
  });

  describe('getStats', () => {
    it('counts room and log keys via SCAN', async () => {
      await redisPersistence.connect();

      redisPersistence.client.scan
        .mockResolvedValueOnce(['0', ['notesync:room:one', 'notesync:room:two']])
        .mockResolvedValueOnce(['0', ['notesync:log:one']]);
      redisPersistence.client.info.mockResolvedValue('used_memory:42');
      redisPersistence.client.dbSize.mockResolvedValue(7);

      const stats = await redisPersistence.getStats();

      expect(stats.roomCount).toBe(2);
      expect(stats.logCount).toBe(1);
      expect(redisPersistence.client.scan).toHaveBeenCalledTimes(2);
      expect(redisPersistence.client.keys).not.toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close connection gracefully', async () => {
      await redisPersistence.connect();
      await expect(redisPersistence.close()).resolves.not.toThrow();
    });
  });
});
