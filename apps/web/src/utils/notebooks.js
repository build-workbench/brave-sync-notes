import { deriveKeys, generateSyncChain } from './crypto';
import { generateUniqueId } from './shared';

const DEFAULT_NOTEBOOK_NAME = {
  en: 'Default Notebook',
  zh: '默认笔记本',
};

const DEFAULT_NOTE_TITLE = {
  en: 'Main Note',
  zh: '主笔记',
};

export const createNotebook = (notebook = {}) => {
  const mnemonic = notebook.mnemonic || generateSyncChain();
  const derived = deriveKeys(mnemonic);
  const now = Date.now();

  return {
    id: notebook.id || generateUniqueId('nb_'),
    name: notebook.name || 'Untitled Notebook',
    mnemonic,
    roomId: notebook.roomId || derived.roomId,
    encryptionKey: notebook.encryptionKey || derived.encryptionKey,
    noteCount: notebook.noteCount || 0,
    createdAt: notebook.createdAt || now,
    updatedAt: notebook.updatedAt || now,
  };
};

const createNote = (note = {}) => {
  const now = Date.now();

  return {
    id: note.id || generateUniqueId('note_'),
    notebookId: note.notebookId,
    title: note.title || 'Untitled Note',
    content: note.content || '',
    version: note.version || 1,
    timestamp: note.timestamp || now,
    deviceId: note.deviceId || 'local',
    createdAt: note.createdAt || now,
    updatedAt: note.updatedAt || now,
    tags: note.tags || [],
  };
};

const getActiveNote = (notes, activeNoteId) => {
  if (!notes.length) {
    return null;
  }

  return notes.find((note) => note.id === activeNoteId) || notes[0];
};

export const restoreNotebookState = async (storage, legacyState = {}) => {
  const notebooks = await storage.listNotebooks();

  if (notebooks.length > 0) {
    const notesByNotebook = await Promise.all(
      notebooks.map(async (notebook) => storage.listNotes(notebook.id))
    );
    const notes = notesByNotebook.flat();
    const activeNotebook = notebooks.find((notebook) => notebook.id === legacyState.activeNotebookId) || notebooks[0];
    const notebookNotes = notes.filter((note) => note.notebookId === activeNotebook?.id);
    const activeNote = getActiveNote(notebookNotes, legacyState.activeNoteId);

    return {
      notebooks,
      notes,
      activeNotebookId: activeNotebook?.id || null,
      activeNoteId: activeNote?.id || null,
      mnemonic: activeNotebook?.mnemonic || '',
      note: activeNote?.content || '',
      noteVersion: activeNote?.version || 0,
      noteTimestamp: activeNote?.timestamp || activeNote?.updatedAt || 0,
      noteDeviceId: activeNote?.deviceId || legacyState.deviceName || 'local',
      migrated: false,
    };
  }

  if (!legacyState.mnemonic) {
    return {
      notebooks: [],
      notes: [],
      activeNotebookId: null,
      activeNoteId: null,
      mnemonic: '',
      note: '',
      noteVersion: 0,
      noteTimestamp: 0,
      noteDeviceId: legacyState.deviceName || 'local',
      migrated: false,
    };
  }

  const notebook = createNotebook({
    name: DEFAULT_NOTEBOOK_NAME[legacyState.lang] || DEFAULT_NOTEBOOK_NAME.en,
    mnemonic: legacyState.mnemonic,
  });
  const note = createNote({
    notebookId: notebook.id,
    title: DEFAULT_NOTE_TITLE[legacyState.lang] || DEFAULT_NOTE_TITLE.en,
    content: legacyState.note || '',
    version: legacyState.noteVersion || 1,
    timestamp: legacyState.noteTimestamp || Date.now(),
    updatedAt: legacyState.noteTimestamp || Date.now(),
    deviceId: legacyState.noteDeviceId || legacyState.deviceName || 'local',
  });

  await storage.saveNotebook(notebook);
  await storage.saveNote(notebook.id, note);

  return {
    notebooks: [notebook],
    notes: [note],
    activeNotebookId: notebook.id,
    activeNoteId: note.id,
    mnemonic: notebook.mnemonic,
    note: note.content,
    noteVersion: note.version,
    noteTimestamp: note.timestamp,
    noteDeviceId: note.deviceId,
    migrated: true,
  };
};
