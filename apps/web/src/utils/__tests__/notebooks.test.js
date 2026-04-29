import { describe, expect, it } from 'vitest';
import { deriveKeys, validateMnemonic } from '../crypto';
import { createNotebook, restoreNotebookState } from '../notebooks';

describe('notebooks utilities', () => {
  it('creates notebook sync metadata for newly created notebooks', () => {
    const notebook = createNotebook({ name: 'Work' });

    expect(notebook.name).toBe('Work');
    expect(validateMnemonic(notebook.mnemonic)).toBe(true);

    const derived = deriveKeys(notebook.mnemonic);
    expect(notebook.roomId).toBe(derived.roomId);
    expect(notebook.encryptionKey).toBe(derived.encryptionKey);
  });

  it('restores notebooks and the active note from storage', async () => {
    const notebook = createNotebook({
      id: 'nb-work',
      name: 'Work',
      mnemonic: 'test test test test test test test test test test test ball',
    });
    const notes = [
      {
        id: 'note-1',
        notebookId: notebook.id,
        title: 'First',
        content: 'hello',
        version: 2,
        updatedAt: 100,
        timestamp: 100,
        deviceId: 'device-1',
      },
    ];
    const storage = {
      listNotebooks: async () => [notebook],
      listNotes: async () => notes,
      saveNotebook: async () => undefined,
      saveNote: async () => undefined,
    };

    const restored = await restoreNotebookState(storage, {
      activeNotebookId: notebook.id,
      activeNoteId: 'note-1',
      deviceName: 'Desktop',
    });

    expect(restored.notebooks).toEqual([notebook]);
    expect(restored.notes).toEqual(notes);
    expect(restored.activeNotebookId).toBe(notebook.id);
    expect(restored.activeNoteId).toBe('note-1');
    expect(restored.note).toBe('hello');
    expect(restored.mnemonic).toBe(notebook.mnemonic);
  });

  it('migrates legacy single-chain state into a default notebook', async () => {
    const savedNotebooks = [];
    const savedNotes = [];
    const storage = {
      listNotebooks: async () => [],
      listNotes: async () => [],
      saveNotebook: async (notebook) => {
        savedNotebooks.push(notebook);
      },
      saveNote: async (notebookId, note) => {
        savedNotes.push({ notebookId, note });
      },
    };

    const restored = await restoreNotebookState(storage, {
      mnemonic: 'test test test test test test test test test test test ball',
      note: '# legacy note',
      noteVersion: 3,
      noteTimestamp: 123,
      noteDeviceId: 'legacy-device',
      deviceName: 'Desktop',
      lang: 'zh',
    });

    expect(savedNotebooks).toHaveLength(1);
    expect(savedNotes).toHaveLength(1);
    expect(restored.notebooks[0].mnemonic).toBe('test test test test test test test test test test test ball');
    expect(restored.activeNotebookId).toBe(restored.notebooks[0].id);
    expect(restored.activeNoteId).toBe(restored.notes[0].id);
    expect(restored.note).toBe('# legacy note');
    expect(restored.migrated).toBe(true);
  });
});
