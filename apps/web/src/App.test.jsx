import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { useAppStore } from './store/useStore';
import { createNotebook } from './utils/notebooks';

const joinChain = vi.fn();
const requestSync = vi.fn();
const initialize = vi.fn().mockResolvedValue(true);
const saveNote = vi.fn();

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
    content: 'restored note',
    version: 2,
    timestamp: 123,
    updatedAt: 123,
    deviceId: 'desktop',
  },
];

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock('./hooks/useSocket', () => ({
  useSocket: () => ({
    joinChain,
    pushUpdate: vi.fn(),
    disconnect: vi.fn(),
    getSocketId: vi.fn(() => 'socket-1'),
    getCurrentRoomId: vi.fn(() => null),
    requestSync,
    conflictCount: 0,
    pendingConflicts: [],
    resolveConflict: vi.fn(),
    clearConflicts: vi.fn(),
    queueSize: 0,
    isOffline: vi.fn(() => false),
  }),
}));

vi.mock('./hooks/useStorage', () => ({
  useStorage: () => ({
    isInitialized: true,
    storageType: 'IndexedDB',
    error: null,
    isLoading: false,
    initialize,
    saveNote,
    listNotebooks: vi.fn(async () => [notebook]),
    getAllNotes: vi.fn(async () => notes),
    saveNotebook: vi.fn(),
  }),
}));

vi.mock('./components/Landing/Landing', () => ({
  default: () => <div data-testid="landing">landing</div>,
}));

vi.mock('./components/Header/Header', () => ({
  default: () => <div data-testid="header">header</div>,
}));

vi.mock('./components/Sidebar/Sidebar', () => ({
  default: () => <div data-testid="sidebar">sidebar</div>,
}));

vi.mock('./components/NoteList/NoteList', () => ({
  default: () => <div data-testid="note-list">note list</div>,
}));

vi.mock('./components/Editor/CodeEditor', () => ({
  default: ({ value }) => <div data-testid="editor">{value}</div>,
}));

vi.mock('./components/Editor/MarkdownPreview', () => ({
  default: ({ content }) => <div data-testid="preview">{content}</div>,
}));

vi.mock('./components/Loading/LoadingSpinner', () => ({
  LoadingOverlay: () => <div>loading</div>,
  EditorSkeleton: () => <div>editor-skeleton</div>,
}));

vi.mock('./components/Conflict', () => ({
  ConflictDialog: () => null,
  ConflictIndicator: () => null,
}));

vi.mock('./components/OfflineIndicator/OfflineIndicator', () => ({
  default: () => null,
}));

const resetStore = () => {
  useAppStore.setState({
    darkMode: true,
    lang: 'en',
    view: 'landing',
    status: 'disconnected',
    note: '',
    noteVersion: 0,
    noteTimestamp: 0,
    noteDeviceId: 'local',
    mnemonic: '',
    deviceName: 'Desktop',
    members: [],
    history: [],
    storageInitialized: false,
    storageType: null,
    isOnline: true,
    offlineQueueSize: 0,
    notes: [],
    activeNoteId: null,
    notebooks: [],
    activeNotebookId: null,
    showSidebar: true,
    showHistory: false,
    showQRCode: false,
  });
};

describe('App notebook restore flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('restores stored notebooks into the app view and joins the active notebook sync chain', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('note-list')).not.toBeNull();
    });

    expect(useAppStore.getState().activeNotebookId).toBe(notebook.id);
    expect(useAppStore.getState().note).toBe('restored note');
    expect(joinChain).toHaveBeenCalledWith(notebook.mnemonic, 'Desktop');
  });
});
