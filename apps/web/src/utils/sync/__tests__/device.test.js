import { describe, it, expect, beforeEach } from 'vitest';
import { getDeviceId, DEVICE_ID_KEY } from '../device';

describe('getDeviceId', () => {
  beforeEach(() => {
    localStorage.removeItem(DEVICE_ID_KEY);
  });

  it('generates an id matching the allowed envelope format', () => {
    const id = getDeviceId();
    expect(id).toMatch(/^[a-zA-Z0-9_-]{8,64}$/);
  });

  it('is stable across calls (persisted in localStorage)', () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(second).toBe(first);
    expect(localStorage.getItem(DEVICE_ID_KEY)).toBe(first);
  });

  it('returns the stored id when one already exists', () => {
    localStorage.setItem(DEVICE_ID_KEY, 'existing-device-id-123');
    expect(getDeviceId()).toBe('existing-device-id-123');
  });

  it('regenerates when stored value violates the format', () => {
    localStorage.setItem(DEVICE_ID_KEY, 'bad id with spaces!');
    const id = getDeviceId();
    expect(id).not.toBe('bad id with spaces!');
    expect(id).toMatch(/^[a-zA-Z0-9_-]{8,64}$/);
  });
});
