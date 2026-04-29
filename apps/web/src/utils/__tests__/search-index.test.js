/**
 * Tests for SearchIndex
 */
import { describe, it, expect, beforeEach } from 'vitest';
import SearchIndex from '../search-index';

describe('SearchIndex', () => {
  let index;

  beforeEach(() => {
    index = new SearchIndex();
  });

  it('indexes a note', () => {
    index.indexNote('note-1', 'Encryption', 'How to encrypt data safely', 'notebook-1');
    expect(index.noteMetadata.size).toBe(1);
  });

  it('searches for single token', () => {
    index.indexNote('note-1', 'Encryption', 'How to encrypt data', 'notebook-1');
    index.indexNote('note-2', 'Passwords', 'Secure passwords', 'notebook-1');

    const results = index.search('encrypt');
    expect(results).toHaveLength(1);
    expect(results[0].noteId).toBe('note-1');
  });

  it('searches for multiple tokens (AND query)', () => {
    index.indexNote('note-1', 'Encryption', 'How to encrypt data safely', 'notebook-1');
    index.indexNote('note-2', 'Security', 'Password encryption tips', 'notebook-1');

    const results = index.search('encrypt data');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].noteId).toBe('note-1');
  });

  it('searches case-insensitively', () => {
    index.indexNote('note-1', 'Encryption', 'How to encrypt data', 'notebook-1');

    const results = index.search('ENCRYPT');
    expect(results).toHaveLength(1);
  });

  it('returns snippet of content', () => {
    const longContent = 'Lorem ipsum dolor sit amet '.repeat(10);
    index.indexNote('note-1', 'Title', longContent, 'notebook-1');

    const results = index.search('lorem');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].snippet.length).toBeGreaterThan(0);
  });

  it('limits results', () => {
    for (let i = 0; i < 20; i++) {
      index.indexNote(`note-${i}`, `Title ${i}`, 'test content', 'notebook-1');
    }

    const results = index.search('content', 5);
    expect(results.length).toBe(5);
  });

  it('removes note from index', () => {
    index.indexNote('note-1', 'Title', 'test content', 'notebook-1');
    index.removeNote('note-1');

    const results = index.search('test');
    expect(results).toHaveLength(0);
  });

  it('handles empty query', () => {
    index.indexNote('note-1', 'Title', 'content', 'notebook-1');
    expect(index.search('')).toHaveLength(0);
    expect(index.search(null)).toHaveLength(0);
  });

  it('clears entire index', () => {
    index.indexNote('note-1', 'Title', 'content', 'notebook-1');
    index.clear();

    expect(index.noteMetadata.size).toBe(0);
    expect(index.index.size).toBe(0);
  });

  it('returns stats', () => {
    index.indexNote('note-1', 'Title', 'content words', 'notebook-1');
    const stats = index.getStats();

    expect(stats.noteCount).toBe(1);
    expect(stats.tokenCount).toBeGreaterThan(0);
  });

  it('finds notes by title or content', () => {
    index.indexNote('note-1', 'Important Meeting', 'Discussed Q1 plans', 'notebook-1');
    index.indexNote('note-2', 'Daily Log', 'Meeting notes', 'notebook-1');

    // Search for "meeting" should find both
    const results = index.search('meeting');
    expect(results.length).toBe(2);
  });
});
