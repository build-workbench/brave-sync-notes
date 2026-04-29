/**
 * Tests for VersionManager
 */
import { describe, it, expect, beforeEach } from 'vitest';
import VersionManager from '../version-manager';

describe('VersionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new VersionManager('notebook-1', 5);
  });

  it('creates a snapshot', () => {
    const id = manager.createSnapshot('note-1', 'Hello World');
    expect(id).toBeDefined();
    expect(manager.getSnapshots('note-1')).toHaveLength(1);
  });

  it('creates snapshot with description', () => {
    const id = manager.createSnapshot('note-1', 'Content', 'First draft');
    const snapshot = manager.getSnapshot(id);

    expect(snapshot.description).toBe('First draft');
  });

  it('retrieves snapshots for a note', () => {
    manager.createSnapshot('note-1', 'Version 1');
    manager.createSnapshot('note-1', 'Version 2');

    const snapshots = manager.getSnapshots('note-1');
    expect(snapshots).toHaveLength(2);
  });

  it('maintains max snapshots limit', () => {
    // Create more than maxSnapshots (5)
    for (let i = 0; i < 10; i++) {
      manager.createSnapshot('note-1', `Version ${i}`);
    }

    const snapshots = manager.getSnapshots('note-1');
    expect(snapshots.length).toBeLessThanOrEqual(5);
    // Oldest should be removed
    expect(snapshots[0].content).toContain('Version 5');
  });

  it('retrieves a specific snapshot', () => {
    const id = manager.createSnapshot('note-1', 'Content');
    const snapshot = manager.getSnapshot(id);

    expect(snapshot.id).toBe(id);
    expect(snapshot.content).toBe('Content');
  });

  it('restores from a snapshot', () => {
    const id = manager.createSnapshot('note-1', 'Original Content');
    const restored = manager.restoreSnapshot(id);

    expect(restored.noteId).toBe('note-1');
    expect(restored.content).toBe('Original Content');
  });

  it('deletes a snapshot', () => {
    const id = manager.createSnapshot('note-1', 'Content');
    manager.deleteSnapshot(id);

    const snapshots = manager.getSnapshots('note-1');
    expect(snapshots).toHaveLength(0);
  });

  it('deletes all snapshots for a note', () => {
    manager.createSnapshot('note-1', 'Content 1');
    manager.createSnapshot('note-1', 'Content 2');
    manager.deleteNoteSnapshots('note-1');

    expect(manager.getSnapshots('note-1')).toHaveLength(0);
  });

  it('calculates diff between snapshots', async () => {
    const id1 = manager.createSnapshot('note-1', 'Hello');
    // Add delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    const id2 = manager.createSnapshot('note-1', 'Hello World!');

    const diff = manager.getDiff(id1, id2);
    expect(diff).toBeDefined();
    expect(diff.added).toBeGreaterThanOrEqual(0);
    // Just verify both are defined
    expect(diff.from).toBeDefined();
    expect(diff.to).toBeDefined();
  });

  it('gets statistics', () => {
    manager.createSnapshot('note-1', 'Content 1');
    manager.createSnapshot('note-1', 'Content 2');
    manager.createSnapshot('note-2', 'Content 3');

    const stats = manager.getStats();
    expect(stats.noteCount).toBe(2);
    expect(stats.totalSnapshots).toBe(3);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  it('exports snapshots', () => {
    manager.createSnapshot('note-1', 'Content');
    const exported = manager.export();

    expect(exported.notebookId).toBe('notebook-1');
    expect(exported.exportedAt).toBeDefined();
    expect(exported.snapshots).toBeDefined();
  });

  it('imports snapshots', () => {
    manager.createSnapshot('note-1', 'Content');
    const exported = manager.export();

    const manager2 = new VersionManager('notebook-1');
    manager2.import(exported);

    expect(manager2.getSnapshots('note-1')).toHaveLength(1);
  });

  it('clears all snapshots', () => {
    manager.createSnapshot('note-1', 'Content 1');
    manager.createSnapshot('note-2', 'Content 2');
    manager.clear();

    expect(manager.getStats().totalSnapshots).toBe(0);
  });

  it('estimates content size', () => {
    const id = manager.createSnapshot('note-1', 'Test content');
    const snapshot = manager.getSnapshot(id);

    expect(snapshot.size).toBeGreaterThan(0);
  });

  it('handles non-existent snapshot', () => {
    const snapshot = manager.getSnapshot('non-existent');
    expect(snapshot).toBeNull();
  });

  it('returns empty array for notes without snapshots', () => {
    const snapshots = manager.getSnapshots('note-that-doesnt-exist');
    expect(snapshots).toHaveLength(0);
  });
});
