import { generateUniqueId } from '../../utils/shared';
import { createNotebook as buildNotebook } from '../../utils/notebooks';

const LOCAL_DEVICE_ID = 'local';

export const selectNotebookNote = (notes, notebookId) => {
  return notes
    .filter((note) => note.notebookId === notebookId)
    .sort((a, b) => (b.updatedAt || b.timestamp || 0) - (a.updatedAt || a.timestamp || 0))[0];
};

export const applySetNote = (state, note, meta) => {
  const timestamp = meta?.timestamp ?? Date.now();
  const version = meta?.version ?? state.noteVersion;
  const deviceId = meta?.deviceId ?? (state.deviceName || state.noteDeviceId || LOCAL_DEVICE_ID);

  return {
    notes: state.notes.map((entry) => (
      entry.id === state.activeNoteId
        ? {
            ...entry,
            content: note,
            version,
            timestamp,
            updatedAt: timestamp,
            deviceId,
          }
        : entry
    )),
    note,
    noteVersion: version,
    noteTimestamp: timestamp,
    noteDeviceId: deviceId,
  };
};

export const applyAddNote = (state, note) => {
  const now = Date.now();
  const newNote = {
    id: note.id || generateUniqueId('note_'),
    title: note.title || '未命名笔记',
    content: note.content || '',
    version: note.version || 1,
    timestamp: note.timestamp || now,
    deviceId: note.deviceId || state.deviceName || LOCAL_DEVICE_ID,
    notebookId: note.notebookId || state.activeNotebookId,
    createdAt: note.createdAt || now,
    updatedAt: note.updatedAt || now,
  };

  return {
    notes: [...state.notes, newNote],
    activeNoteId: newNote.id,
    note: newNote.content,
    noteVersion: newNote.version,
    noteTimestamp: newNote.timestamp,
    noteDeviceId: newNote.deviceId,
  };
};

export const applyUpdateNote = (state, noteId, updates) => {
  const now = Date.now();
  const notes = state.notes.map((note) => {
    if (note.id !== noteId) {
      return note;
    }

    return {
      ...note,
      ...updates,
      version: (updates.version !== undefined) ? updates.version : note.version + 1,
      updatedAt: now,
    };
  });

  const updatedNote = notes.find((note) => note.id === noteId);
  if (noteId === state.activeNoteId && updatedNote) {
    return {
      notes,
      note: updatedNote.content,
      noteVersion: updatedNote.version,
      noteTimestamp: updatedNote.timestamp || now,
      noteDeviceId: updatedNote.deviceId || state.deviceName || LOCAL_DEVICE_ID,
    };
  }

  return { notes };
};

export const applyRemoveNote = (state, noteId) => {
  const notes = state.notes.filter((note) => note.id !== noteId);
  if (noteId === state.activeNoteId) {
    const nextNote = notes[0];
    return {
      notes,
      activeNoteId: nextNote?.id || null,
      note: nextNote?.content || '',
      noteVersion: nextNote?.version || 0,
      noteTimestamp: nextNote?.timestamp || 0,
      noteDeviceId: nextNote?.deviceId || LOCAL_DEVICE_ID,
    };
  }

  return { notes };
};

export const applySetActiveNoteId = (state, noteId) => {
  const note = state.notes.find((entry) => entry.id === noteId);
  if (note) {
    return {
      activeNoteId: noteId,
      note: note.content,
      noteVersion: note.version,
      noteTimestamp: note.timestamp,
      noteDeviceId: note.deviceId,
    };
  }

  return { activeNoteId: noteId };
};

export const applyAddNotebook = (state, notebook) => {
  const newNotebook = buildNotebook(notebook);
  return {
    notebooks: [...state.notebooks, newNotebook],
    activeNotebookId: newNotebook.id,
    activeNoteId: null,
    mnemonic: newNotebook.mnemonic || state.mnemonic,
    note: '',
    noteVersion: 0,
    noteTimestamp: 0,
    noteDeviceId: state.deviceName || LOCAL_DEVICE_ID,
  };
};

export const applyUpdateNotebook = (state, notebookId, updates) => ({
  notebooks: state.notebooks.map((entry) =>
    entry.id === notebookId
      ? { ...entry, ...updates, updatedAt: Date.now() }
      : entry
  ),
});

export const applyRemoveNotebook = (state, notebookId) => {
  const notebooks = state.notebooks.filter((entry) => entry.id !== notebookId);
  const notes = state.notes.filter((note) => note.notebookId !== notebookId);

  if (notebookId === state.activeNotebookId) {
    const nextNotebook = notebooks[0];
    const nextNote = selectNotebookNote(notes, nextNotebook?.id);
    return {
      notebooks,
      notes,
      activeNotebookId: nextNotebook?.id || null,
      activeNoteId: nextNote?.id || null,
      mnemonic: nextNotebook?.mnemonic || '',
      note: nextNote?.content || '',
      noteVersion: nextNote?.version || 0,
      noteTimestamp: nextNote?.timestamp || 0,
      noteDeviceId: nextNote?.deviceId || LOCAL_DEVICE_ID,
    };
  }

  return { notebooks, notes };
};

export const applySetActiveNotebookId = (state, notebookId) => {
  const notebook = state.notebooks.find((entry) => entry.id === notebookId);
  const firstNote = selectNotebookNote(state.notes, notebookId);

  return {
    activeNotebookId: notebookId,
    activeNoteId: firstNote?.id || null,
    mnemonic: notebook?.mnemonic || state.mnemonic,
    note: firstNote?.content || '',
    noteVersion: firstNote?.version || 0,
    noteTimestamp: firstNote?.timestamp || 0,
    noteDeviceId: firstNote?.deviceId || LOCAL_DEVICE_ID,
  };
};
