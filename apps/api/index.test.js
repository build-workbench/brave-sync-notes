const request = require('supertest');

jest.mock('./src/persistence/PersistenceManager', () => {
    return jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(undefined),
        isHealthy: jest.fn().mockResolvedValue(true),
        getCurrentAdapter: jest.fn().mockReturnValue('mock'),
        getStats: jest.fn().mockResolvedValue({ adapter: 'mock' }),
        getRoom: jest.fn().mockResolvedValue(null),
        saveRoom: jest.fn().mockResolvedValue(undefined),
        close: jest.fn().mockResolvedValue(undefined),
    }));
});

describe('server sync flow', () => {
    let app;
    let server;
    let stores;
    let startServer;
    let gracefulShutdown;
    let handleSocketConnection;
    let registerShutdownHandlers;

    const roomId = 'valid-room-12345';

    beforeEach(() => {
        jest.resetModules();
        process.env.PORT = '3102';
        ({ app, server, stores, startServer, gracefulShutdown, handleSocketConnection, registerShutdownHandlers } = require('./index'));
        stores.chainStore.clear();
        stores.socketMeta.clear();
    });

    afterEach(async () => {
        if (server.listening) {
            await gracefulShutdown('TEST');
        }
        delete process.env.PORT;
    });

    test('exposes health endpoint after startup', async () => {
        await startServer();

        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.persistence.adapter).toBe('mock');
    });

    test('join-chain rejects invalid room id', async () => {
        const emit = jest.fn();
        const join = jest.fn();
        const leave = jest.fn();
        const socket = {
            id: 'socket-1',
            on: jest.fn((event, handler) => {
                socket.handlers[event] = handler;
            }),
            emit,
            join,
            leave,
            handlers: {},
            to: jest.fn(),
        };

        handleSocketConnection(socket);

        await socket.handlers['join-chain']({ roomId: 'short', deviceName: 'Device A' });

        expect(emit).toHaveBeenCalledWith('error', { message: 'Invalid room ID' });
        expect(join).not.toHaveBeenCalled();
    });

    test('push-update rejects non-members and accepts valid members', async () => {
        const emit = jest.fn();
        const join = jest.fn();
        const leave = jest.fn();
        const socket = {
            id: 'socket-2',
            on: jest.fn((event, handler) => {
                socket.handlers[event] = handler;
            }),
            emit,
            join,
            leave,
            handlers: {},
            to: jest.fn(() => ({ emit: jest.fn() })),
        };

        handleSocketConnection(socket);

        await socket.handlers['push-update']({
            roomId,
            encryptedData: 'encrypted',
            timestamp: 1,
        });

        expect(emit).toHaveBeenCalledWith('error', { message: 'Not a member of this room' });

        emit.mockClear();
        await socket.handlers['join-chain']({ roomId, deviceName: 'Device B' });
        await socket.handlers['push-update']({
            roomId,
            encryptedData: 'encrypted',
            timestamp: 2,
        });

        expect(stores.chainStore.get(roomId)).toMatchObject({
            encryptedData: 'encrypted',
            timestamp: 2,
            deviceName: 'Device B',
        });
        expect(emit).toHaveBeenCalledWith('update-ack', { timestamp: 2, success: true });
    });

    test('new joiner recovers full large content after single push', async () => {
        const emitA = jest.fn();
        const emitB = jest.fn();
        const makeSocket = (id, emit) => {
            const s = {
                id,
                on: jest.fn((event, handler) => { s.handlers[event] = handler; }),
                emit,
                join: jest.fn(),
                leave: jest.fn(),
                handlers: {},
                to: jest.fn(() => ({ emit: jest.fn() })),
            };
            return s;
        };

        // Device A pushes a large note as a single encrypted payload
        const socketA = makeSocket('socket-A', emitA);
        handleSocketConnection(socketA);
        await socketA.handlers['join-chain']({ roomId, deviceName: 'Device A' });

        const largeEncrypted = 'enc:' + 'x'.repeat(100 * 1024); // > 50KB, previously chunked
        await socketA.handlers['push-update']({
            roomId,
            encryptedData: largeEncrypted,
            timestamp: 2,
        });

        // Device B joins afterwards and must recover the full content
        const socketB = makeSocket('socket-B', emitB);
        handleSocketConnection(socketB);
        await socketB.handlers['join-chain']({ roomId, deviceName: 'Device B' });

        expect(emitB).toHaveBeenCalledWith('sync-update', expect.objectContaining({
            encryptedData: largeEncrypted,
        }));
    });

    test('request-sync returns existing room data', async () => {
        const emit = jest.fn();
        const socket = {
            id: 'socket-3',
            on: jest.fn((event, handler) => {
                socket.handlers[event] = handler;
            }),
            emit,
            join: jest.fn(),
            leave: jest.fn(),
            handlers: {},
            to: jest.fn(() => ({ emit: jest.fn() })),
        };

        stores.chainStore.set(roomId, {
            encryptedData: 'persisted',
            timestamp: 5,
            deviceName: 'Seed Device',
            version: 99,
        });

        handleSocketConnection(socket);

        await socket.handlers['join-chain']({ roomId, deviceName: 'Device C' });
        await socket.handlers['request-sync']({ roomId });

        expect(emit).toHaveBeenCalledWith('sync-update', expect.objectContaining({
            encryptedData: 'persisted',
            deviceName: 'Seed Device',
            version: 99,
        }));
    });

    test('request-sync rejects non-members without touching storage', async () => {
        const emit = jest.fn();
        const socket = {
            id: 'socket-no-member',
            on: jest.fn((event, handler) => {
                socket.handlers[event] = handler;
            }),
            emit,
            join: jest.fn(),
            leave: jest.fn(),
            handlers: {},
            to: jest.fn(() => ({ emit: jest.fn() })),
        };

        stores.chainStore.set(roomId, { encryptedData: 'secret', timestamp: 1, deviceName: 'X' });
        handleSocketConnection(socket);

        await socket.handlers['request-sync']({ roomId });

        expect(emit).toHaveBeenCalledWith('error', { message: 'Not a member of this room' });
        expect(emit).not.toHaveBeenCalledWith('sync-update', expect.anything());
    });

    test('request-sync is rate limited per socket', async () => {
        const emit = jest.fn();
        const socket = {
            id: 'socket-rate',
            on: jest.fn((event, handler) => {
                socket.handlers[event] = handler;
            }),
            emit,
            join: jest.fn(),
            leave: jest.fn(),
            handlers: {},
            to: jest.fn(() => ({ emit: jest.fn() })),
        };

        handleSocketConnection(socket);
        await socket.handlers['join-chain']({ roomId, deviceName: 'Device D' });

        // 预算 60/分钟:发满 60 次后再来一次应被拒
        for (let i = 0; i < 61; i++) {
            await socket.handlers['request-sync']({ roomId });
        }

        expect(emit).toHaveBeenCalledWith('error', { message: 'Rate limit exceeded' });
    });

    test('push-update is rate limited after 30 updates per minute', async () => {
        const emit = jest.fn();
        const socket = {
            id: 'socket-push-rate',
            on: jest.fn((event, handler) => {
                socket.handlers[event] = handler;
            }),
            emit,
            join: jest.fn(),
            leave: jest.fn(),
            handlers: {},
            to: jest.fn(() => ({ emit: jest.fn() })),
        };

        handleSocketConnection(socket);
        await socket.handlers['join-chain']({ roomId, deviceName: 'Device E' });

        for (let i = 0; i < 31; i++) {
            await socket.handlers['push-update']({ roomId, encryptedData: `e-${i}`, timestamp: i });
        }

        // 前 30 次成功落库,第 31 次被限流
        expect(emit).toHaveBeenCalledWith('error', { message: 'Rate limit exceeded' });
        expect(stores.chainStore.get(roomId)).toMatchObject({ encryptedData: 'e-29' });
    });

    test('registerShutdownHandlers wires SIGINT and SIGTERM', () => {
        const onSpy = jest.spyOn(process, 'on').mockImplementation(() => process);

        registerShutdownHandlers();

        expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
        expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

        onSpy.mockRestore();
    });
});
