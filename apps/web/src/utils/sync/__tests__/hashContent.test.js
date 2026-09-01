import { describe, it, expect } from 'vitest';
import { hashContent } from '../constants';

describe('hashContent', () => {
  it('is consistent for the same content', () => {
    expect(hashContent('hello world')).toBe(hashContent('hello world'));
  });

  it('differs when only content beyond the first 1000 chars changes', () => {
    const prefix = 'A'.repeat(1000);
    const a = `${prefix}${'x'.repeat(50)}`;
    const b = `${prefix}${'y'.repeat(50)}`;

    expect(hashContent(a)).not.toBe(hashContent(b));
  });

  it('differs when only trailing content changes at equal length', () => {
    const base = 'B'.repeat(2000);
    const other = `${base.slice(0, -1)}C`;

    expect(hashContent(base)).not.toBe(hashContent(other));
    expect(base.length).toBe(other.length);
  });

  it('differs for different lengths of empty-ish content', () => {
    expect(hashContent('')).not.toBe(hashContent('a'));
  });

  it('handles unicode and multiline content consistently', () => {
    const content = '特殊字符 🎉 \n\t\r'.repeat(300);
    expect(hashContent(content)).toBe(hashContent(content));
    expect(hashContent(`${content}!`)).not.toBe(hashContent(content));
  });
});
