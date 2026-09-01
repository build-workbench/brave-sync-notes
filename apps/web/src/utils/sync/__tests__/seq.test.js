import { describe, it, expect, beforeEach } from 'vitest';
import { nextSeq, SEQ_KEY_PREFIX } from '../seq';

describe('nextSeq', () => {
  const roomId = 'room-seq-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('starts from a millisecond-scale baseline when no counter is stored', () => {
    const seq = nextSeq(roomId);
    expect(Number.isInteger(seq)).toBe(true);
    expect(seq).toBeGreaterThan(1_700_000_000_000);
  });

  it('increments strictly monotonically across calls', () => {
    const a = nextSeq(roomId);
    const b = nextSeq(roomId);
    const c = nextSeq(roomId);
    expect(b).toBe(a + 1);
    expect(c).toBe(a + 2);
  });

  it('keeps independent counters per room', () => {
    const r1a = nextSeq('room-a');
    const r2a = nextSeq('room-b');
    expect(r2a).not.toBe(r1a);
    expect(localStorage.getItem(SEQ_KEY_PREFIX + 'room-a')).toBe(String(r1a));
    expect(localStorage.getItem(SEQ_KEY_PREFIX + 'room-b')).toBe(String(r2a));
  });

  it('continues from a stored value after reload simulation', () => {
    const first = nextSeq(roomId);
    // 模拟模块重新加载:直接读存储继续
    const stored = Number(localStorage.getItem(SEQ_KEY_PREFIX + roomId));
    expect(stored).toBe(first);

    const again = nextSeq(roomId);
    expect(again).toBe(first + 1);
  });

  it('recovers with a fresh baseline when stored value is corrupted', () => {
    localStorage.setItem(SEQ_KEY_PREFIX + roomId, 'not-a-number');
    const seq = nextSeq(roomId);
    expect(seq).toBeGreaterThan(1_700_000_000_000);
  });
});
