import { describe, it, expect, vi } from 'vitest';
import {
  applyAddNotebook,
  applySetNote,
  applyUpdateNote,
  applyRemoveNotebook,
} from '../notebook-domain';

describe('notebook-domain helpers', () => {
  it('applySetNote updates active note content and metadata', () => {
    const now = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const state = {
      notes: [
        {
          id: 'note-1',
          content: 'before',
          version: 2,
          timestamp: 100,
          updatedAt: 100,
          deviceId: 'desktop',
        },
      ],
      activeNoteId: 'note-1',
      noteVersion: 2,
      noteDeviceId: 'desktop',
      deviceName: 'desktop',
    };

    const next = applySetNote(state, 'after', {
      version: 3,
      timestamp: 200,
      deviceId: 'mobile',
    });

    expect(next.note).toBe('after');
    expect(next.noteVersion).toBe(3);
    expect(next.noteTimestamp).toBe(200);
    expect(next.noteDeviceId).toBe('mobile');
    expect(next.notes[0].content).toBe('after');
    expect(next.notes[0].version).toBe(3);

    vi.restoreAllMocks();
  });

  it('applyUpdateNote bumps version when update payload omits version', () => {
    const state = {
      notes: [
        {
          id: 'note-1',
          content: 'before',
          version: 7,
          timestamp: 100,
          updatedAt: 100,
          deviceId: 'desktop',
        },
      ],
      activeNoteId: 'note-1',
      deviceName: 'desktop',
    };

    const next = applyUpdateNote(state, 'note-1', { content: 'after' });

    expect(next.notes[0].content).toBe('after');
    expect(next.notes[0].version).toBe(8);
    expect(next.note).toBe('after');
    expect(next.noteVersion).toBe(8);
  });

  it('applyAddNotebook activates notebook and resets note context', () => {
    const state = {
      notebooks: [],
      activeNotebookId: null,
      deviceName: 'desktop',
      mnemonic: '',
    };

    const next = applyAddNotebook(state, {
      id: 'nb-1',
      name: 'work',
      mnemonic: 'test test test test test test test test test test test ball',
      roomId: 'room-1',
      encryptionKey: 'k',
    });

    expect(next.notebooks).toHaveLength(1);
    expect(next.activeNotebookId).toBe('nb-1');
    expect(next.activeNoteId).toBe(null);
    expect(next.note).toBe('');
    expect(next.mnemonic).toContain('test test');
  });

  it('applyRemoveNotebook removes related notes and keeps next notebook selected', () => {
    const state = {
      notebooks: [
        { id: 'nb-1', mnemonic: 'm1' },
        { id: 'nb-2', mnemonic: 'm2' },
      ],
      notes: [
        { id: 'n1', notebookId: 'nb-1', content: 'a', version: 1, timestamp: 1, deviceId: 'd' },
        { id: 'n2', notebookId: 'nb-2', content: 'b', version: 3, timestamp: 3, deviceId: 'd' },
      ],
      activeNotebookId: 'nb-1',
      activeNoteId: 'n1',
    };

    const next = applyRemoveNotebook(state, 'nb-1');

    expect(next.notebooks).toHaveLength(1);
    expect(next.notes).toHaveLength(1);
    expect(next.activeNotebookId).toBe('nb-2');
    expect(next.activeNoteId).toBe('n2');
    expect(next.note).toBe('b');
    expect(next.mnemonic).toBe('m2');
  });
});
