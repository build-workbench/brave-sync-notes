import { beforeEach, describe, expect, it } from 'vitest';
import { createNotebook } from '../utils/notebooks';
import { validateMnemonic } from '../utils/crypto';
import { useAppStore } from './useStore';

const resetStore = () => {
  useAppStore.setState({
    mnemonic: '',
    deviceName: 'Desktop',
    notes: [],
    activeNoteId: null,
    notebooks: [],
    activeNotebookId: null,
    note: '',
    noteVersion: 0,
    noteTimestamp: 0,
    noteDeviceId: 'local',
    view: 'landing',
    status: 'disconnected',
    storageInitialized: false,
  });
};

describe('useAppStore notebook behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it('switches notebooks by selecting a note within the selected notebook and updating mnemonic', () => {
    const work = createNotebook({
      id: 'nb-work',
      name: 'Work',
      mnemonic: 'test test test test test test test test test test test ball',
    });
    const personal = createNotebook({
      id: 'nb-personal',
      name: 'Personal',
      mnemonic: 'test test test test test test test test test test test borrow',
    });

    useAppStore.setState({
      notebooks: [work, personal],
      notes: [
        {
          id: 'work-note',
          notebookId: work.id,
          title: 'Work note',
          content: 'work content',
          version: 2,
          timestamp: 111,
          updatedAt: 111,
          deviceId: 'desktop',
        },
        {
          id: 'personal-note',
          notebookId: personal.id,
          title: 'Personal note',
          content: 'personal content',
          version: 4,
          timestamp: 222,
          updatedAt: 222,
          deviceId: 'desktop',
        },
      ],
    });

    useAppStore.getState().setActiveNotebookId(personal.id);

    const state = useAppStore.getState();
    expect(state.activeNotebookId).toBe(personal.id);
    expect(state.activeNoteId).toBe('personal-note');
    expect(state.note).toBe('personal content');
    expect(state.mnemonic).toBe(personal.mnemonic);
  });

  it('updates the active note record when editor content changes', () => {
    const work = createNotebook({
      id: 'nb-work',
      mnemonic: 'test test test test test test test test test test test ball',
    });

    useAppStore.setState({
      notebooks: [work],
      activeNotebookId: work.id,
      activeNoteId: 'note-1',
      notes: [
        {
          id: 'note-1',
          notebookId: work.id,
          title: 'Note',
          content: 'before',
          version: 2,
          timestamp: 100,
          updatedAt: 100,
          deviceId: 'desktop',
        },
      ],
    });

    useAppStore.getState().setNote('after', {
      version: 3,
      timestamp: 200,
      deviceId: 'desktop',
    });

    const state = useAppStore.getState();
    expect(state.note).toBe('after');
    expect(state.notes[0].content).toBe('after');
    expect(state.notes[0].version).toBe(3);
  });

  it('activates a newly created notebook and adopts its sync metadata', () => {
    const notebook = createNotebook({
      id: 'nb-new',
      mnemonic: 'test test test test test test test test test test test ball',
    });

    useAppStore.getState().addNotebook(notebook);

    const state = useAppStore.getState();
    expect(state.activeNotebookId).toBe(notebook.id);
    expect(state.activeNoteId).toBe(null);
    expect(state.note).toBe('');
    expect(state.mnemonic).toBe(notebook.mnemonic);
  });

  it('generates sync metadata when a notebook is created from name only', () => {
    useAppStore.getState().addNotebook({ name: 'Generated' });

    const state = useAppStore.getState();
    expect(state.notebooks).toHaveLength(1);
    expect(validateMnemonic(state.notebooks[0].mnemonic)).toBe(true);
    expect(state.notebooks[0].roomId).toBeTruthy();
    expect(state.notebooks[0].encryptionKey).toBeTruthy();
  });

  it('clears active note and mnemonic when the last notebook is removed', () => {
    const notebook = createNotebook({
      id: 'nb-work',
      mnemonic: 'test test test test test test test test test test test ball',
    });

    useAppStore.setState({
      notebooks: [notebook],
      activeNotebookId: notebook.id,
      activeNoteId: 'note-1',
      mnemonic: notebook.mnemonic,
      note: 'content',
      notes: [
        {
          id: 'note-1',
          notebookId: notebook.id,
          title: 'Note',
          content: 'content',
          version: 1,
          timestamp: 100,
          updatedAt: 100,
          deviceId: 'desktop',
        },
      ],
    });

    useAppStore.getState().removeNotebook(notebook.id);

    const state = useAppStore.getState();
    expect(state.notebooks).toEqual([]);
    expect(state.notes).toEqual([]);
    expect(state.activeNotebookId).toBe(null);
    expect(state.activeNoteId).toBe(null);
    expect(state.note).toBe('');
    expect(state.mnemonic).toBe('');
  });

  it('persists active notebook and note selection metadata', () => {
    const partialize = useAppStore.persist.getOptions().partialize;
    const persisted = partialize({
      ...useAppStore.getState(),
      activeNotebookId: 'nb-work',
      activeNoteId: 'note-1',
      mnemonic: 'test test test test test test test test test test test ball',
    });

    expect(persisted.activeNotebookId).toBe('nb-work');
    expect(persisted.activeNoteId).toBe('note-1');
    expect(persisted.mnemonic).toBe('test test test test test test test test test test test ball');
  });

  it('keeps note deletion scoped to the active notebook', () => {
    const work = createNotebook({
      id: 'nb-work',
      mnemonic: 'test test test test test test test test test test test ball',
    });
    const personal = createNotebook({
      id: 'nb-personal',
      mnemonic: 'test test test test test test test test test test test borrow',
    });

    useAppStore.setState({
      notebooks: [work, personal],
      activeNotebookId: work.id,
      activeNoteId: 'work-note-1',
      mnemonic: work.mnemonic,
      notes: [
        {
          id: 'work-note-1',
          notebookId: work.id,
          title: 'Work 1',
          content: 'work 1',
          version: 1,
          timestamp: 100,
          updatedAt: 100,
          deviceId: 'desktop',
        },
        {
          id: 'work-note-2',
          notebookId: work.id,
          title: 'Work 2',
          content: 'work 2',
          version: 1,
          timestamp: 200,
          updatedAt: 200,
          deviceId: 'desktop',
        },
        {
          id: 'personal-note-1',
          notebookId: personal.id,
          title: 'Personal 1',
          content: 'personal 1',
          version: 1,
          timestamp: 300,
          updatedAt: 300,
          deviceId: 'desktop',
        },
      ],
      note: 'work 1',
    });

    useAppStore.getState().removeNote('work-note-1');

    const state = useAppStore.getState();
    expect(state.activeNotebookId).toBe(work.id);
    expect(state.activeNoteId).toBe('work-note-2');
    expect(state.note).toBe('work 2');
  });
});
