import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// 清理 React 组件
afterEach(() => {
    cleanup();
});

// Mock IndexedDB
const indexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
};

global.indexedDB = indexedDB;

// Mock localStorage
const localStorageMock = (() => {
    let store = {};

    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        get length() {
            return Object.keys(store).length;
        },
        key: (index) => {
            const keys = Object.keys(store);
            return keys[index] || null;
        },
    };
})();

global.localStorage = localStorageMock;

// Mock navigator.storage
global.navigator.storage = {
    estimate: vi.fn().mockResolvedValue({
        usage: 1024 * 1024, // 1MB
        quota: 100 * 1024 * 1024, // 100MB
    }),
};
