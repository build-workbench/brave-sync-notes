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

    const roomId = 'valid-room-12345';

    beforeEach(() => {
        jest.resetModules();
        process.env.PORT = '3102';
        ({ app, server, stores, startServer, gracefulShutdown, handleSocketConnection } = require('./index'));
        stores.chainStore.clear();
        stores.socketMeta.clear();
        stores.chunkStore.clear();
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

        await socket.handlers['request-sync']({ roomId });

        expect(emit).toHaveBeenCalledWith('sync-update', expect.objectContaining({
            encryptedData: 'persisted',
            deviceName: 'Seed Device',
            version: 99,
        }));
    });
});
