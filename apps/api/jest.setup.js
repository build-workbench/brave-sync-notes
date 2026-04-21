// Jest 测试环境设置

// 设置测试超时
jest.setTimeout(30000);

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.SQLITE_DB_PATH = ':memory:'; // 使用内存数据库进行测试

// 全局测试工具
global.testUtils = {
    // 生成测试用的房间ID
    generateRoomId: () => `test-room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

    // 生成测试用的设备ID
    generateDeviceId: () => `test-device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

    // 生成测试用的操作ID
    generateOperationId: () => `test-op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

    // 等待指定时间
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};