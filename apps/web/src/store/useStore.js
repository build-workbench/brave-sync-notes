import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyAddNote,
  applyAddNotebook,
  applyRemoveNote,
  applyRemoveNotebook,
  applySetActiveNoteId,
  applySetActiveNotebookId,
  applySetNote,
  applyUpdateNote,
  applyUpdateNotebook,
} from './domain/notebook-domain';
import { generateUniqueId } from '../utils/shared';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // UI State
      darkMode: false,
      lang: 'zh',
      showPreview: false,
      showSidebar: true,
      showHistory: false,
      showQRCode: false,
      editorMode: 'markdown', // 'markdown', 'code'

      // Connection State
      view: 'landing', // 'landing', 'app'
      status: 'disconnected', // 'disconnected', 'connected', 'syncing'
      mnemonic: '',
      deviceName: '',
      members: [],

      // Storage State
      storageInitialized: false,
      storageType: null, // 'indexeddb' | 'localstorage'

      // Offline State
      isOnline: true,
      offlineQueueSize: 0,

      // Multi-note State
      notes: [], // Array of { id, title, content, version, timestamp, deviceId, notebookId }
      activeNoteId: null,
      notebooks: [], // Array of { id, name, createdAt, updatedAt }
      activeNotebookId: null,

      // Content (current note - for backward compatibility)
      note: '',
      noteVersion: 0,
      noteTimestamp: 0,
      noteDeviceId: 'local',
      currentFileType: 'markdown',

      // History
      history: [],
      maxHistoryItems: 50,

      // Settings
      autoSave: true,
      syncDebounceMs: 300,
      fontSize: 14,
      tabSize: 2,
      lineNumbers: true,
      wordWrap: true,

      // Actions
      setDarkMode: (darkMode) => set({ darkMode }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((state) => ({ lang: state.lang === 'en' ? 'zh' : 'en' })),
      setShowPreview: (showPreview) => set({ showPreview }),
      setShowSidebar: (showSidebar) => set({ showSidebar }),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      setShowHistory: (showHistory) => set({ showHistory }),
      setShowQRCode: (showQRCode) => set({ showQRCode }),
      setEditorMode: (editorMode) => set({ editorMode }),

      setView: (view) => set({ view }),
      setStatus: (status) => set({ status }),
      setMnemonic: (mnemonic) => set({ mnemonic }),
      setDeviceName: (deviceName) => set({ deviceName }),
      setMembers: (members) => set({ members }),

      setNote: (note, meta) => set((state) => applySetNote(state, note, meta)),
      setCurrentFileType: (currentFileType) => set({ currentFileType }),

      // History Management
      addToHistory: (entry) => set((state) => {
        // Skip if content is too short
        if (!entry.content || entry.content.length < 10) {
          return {};
        }

        const isDuplicate = state.history.some((h) => h.content === entry.content);

        if (isDuplicate) {
          return {};
        }

        const newHistory = [
          {
            id: generateUniqueId('hist_'),
            content: entry.content,
            timestamp: new Date().toISOString(),
            deviceName: entry.deviceName || state.deviceName,
            preview: entry.content.substring(0, 100),
          },
          ...state.history,
        ].slice(0, state.maxHistoryItems);
        return { history: newHistory };
      }),

      clearHistory: () => set({ history: [] }),

      deleteHistoryItem: (id) => set((state) => ({
        history: state.history.filter((item) => item.id !== id),
      })),

      restoreFromHistory: (id) => {
        const state = get();
        const item = state.history.find((h) => h.id === id);
        if (item) {
          set({
            note: item.content,
            noteVersion: state.noteVersion,
            noteTimestamp: Date.now(),
            noteDeviceId: state.deviceName || state.noteDeviceId || 'local',
          });
        }
      },

      // Settings
      setFontSize: (fontSize) => set({ fontSize }),
      setTabSize: (tabSize) => set({ tabSize }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setSyncDebounceMs: (syncDebounceMs) => set({ syncDebounceMs }),
      setAutoSave: (autoSave) => set({ autoSave }),

      // Storage Actions
      setStorageInitialized: (initialized, type) => set({
        storageInitialized: initialized,
        storageType: type
      }),

      // Offline Actions
      setIsOnline: (isOnline) => set({ isOnline }),
      setOfflineQueueSize: (size) => set({ offlineQueueSize: size }),

      // Multi-note Actions
      setNotes: (notes) => set({ notes }),

      addNote: (note) => set((state) => applyAddNote(state, note)),

      updateNote: (noteId, updates) => set((state) => applyUpdateNote(state, noteId, updates)),

      removeNote: (noteId) => set((state) => applyRemoveNote(state, noteId)),

      setActiveNoteId: (noteId) => set((state) => applySetActiveNoteId(state, noteId)),

      // Notebook Actions
      setNotebooks: (notebooks) => set({ notebooks }),

      addNotebook: (notebook) => set((state) => applyAddNotebook(state, notebook)),

      updateNotebook: (notebookId, updates) => set((state) => applyUpdateNotebook(state, notebookId, updates)),

      removeNotebook: (notebookId) => set((state) => applyRemoveNotebook(state, notebookId)),

      setActiveNotebookId: (notebookId) => set((state) => applySetActiveNotebookId(state, notebookId)),

      // Reset
      resetConnection: () => set({
        view: 'landing',
        status: 'disconnected',
        mnemonic: '',
        members: [],
        note: '',
        noteVersion: 0,
        noteTimestamp: 0,
        noteDeviceId: 'local',
        offlineQueueSize: 0,
      }),
    }),
    {
      name: 'note-sync-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        lang: state.lang,
        deviceName: state.deviceName,
        mnemonic: state.mnemonic,
        activeNotebookId: state.activeNotebookId,
        activeNoteId: state.activeNoteId,
        history: state.history,
        fontSize: state.fontSize,
        tabSize: state.tabSize,
        lineNumbers: state.lineNumbers,
        wordWrap: state.wordWrap,
        syncDebounceMs: state.syncDebounceMs,
        editorMode: state.editorMode,
        autoSave: state.autoSave,
      }),
    }
  )
);
