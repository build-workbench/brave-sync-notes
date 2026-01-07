import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // UI State
      darkMode: true,
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

      setNote: (note, meta) => set((state) => ({
        note,
        noteVersion: meta?.version ?? state.noteVersion,
        noteTimestamp: meta?.timestamp ?? Date.now(),
        noteDeviceId: meta?.deviceId ?? (state.deviceName || state.noteDeviceId || 'local'),
      })),
      setCurrentFileType: (currentFileType) => set({ currentFileType }),

      // History Management
      addToHistory: (entry) => set((state) => {
        // Skip if content is too short
        if (!entry.content || entry.content.length < 10) {
          return {};
        }

        // Check for duplicate content (compare first 100 chars and length)
        const contentPreview = entry.content.substring(0, 100);
        const contentLength = entry.content.length;
        const isDuplicate = state.history.some(
          (h) => h.preview === contentPreview && h.content.length === contentLength
        );

        if (isDuplicate) {
          return {};
        }

        const newHistory = [
          {
            id: Date.now(),
            content: entry.content,
            timestamp: new Date().toISOString(),
            deviceName: entry.deviceName || state.deviceName,
            preview: contentPreview,
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

      addNote: (note) => set((state) => {
        const newNote = {
          id: note.id || `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: note.title || '未命名笔记',
          content: note.content || '',
          version: note.version || 1,
          timestamp: note.timestamp || Date.now(),
          deviceId: note.deviceId || state.deviceName || 'local',
          notebookId: note.notebookId || state.activeNotebookId,
          createdAt: note.createdAt || Date.now(),
          updatedAt: note.updatedAt || Date.now(),
        };
        return {
          notes: [...state.notes, newNote],
          activeNoteId: newNote.id,
          note: newNote.content,
          noteVersion: newNote.version,
          noteTimestamp: newNote.timestamp,
          noteDeviceId: newNote.deviceId,
        };
      }),

      updateNote: (noteId, updates) => set((state) => {
        const notes = state.notes.map((n) => {
          if (n.id === noteId) {
            return {
              ...n,
              ...updates,
              version: (updates.version !== undefined) ? updates.version : n.version + 1,
              updatedAt: Date.now(),
            };
          }
          return n;
        });

        // 如果更新的是当前活动笔记，同步更新 note 字段
        const updatedNote = notes.find((n) => n.id === noteId);
        if (noteId === state.activeNoteId && updatedNote) {
          return {
            notes,
            note: updatedNote.content,
            noteVersion: updatedNote.version,
            noteTimestamp: updatedNote.timestamp || Date.now(),
            noteDeviceId: updatedNote.deviceId || state.deviceName || 'local',
          };
        }

        return { notes };
      }),

      removeNote: (noteId) => set((state) => {
        const notes = state.notes.filter((n) => n.id !== noteId);

        // 如果删除的是当前活动笔记，切换到第一个笔记
        if (noteId === state.activeNoteId) {
          const nextNote = notes[0];
          return {
            notes,
            activeNoteId: nextNote?.id || null,
            note: nextNote?.content || '',
            noteVersion: nextNote?.version || 0,
            noteTimestamp: nextNote?.timestamp || 0,
            noteDeviceId: nextNote?.deviceId || 'local',
          };
        }

        return { notes };
      }),

      setActiveNoteId: (noteId) => set((state) => {
        const note = state.notes.find((n) => n.id === noteId);
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
      }),

      // Notebook Actions
      setNotebooks: (notebooks) => set({ notebooks }),

      addNotebook: (notebook) => set((state) => {
        const newNotebook = {
          id: notebook.id || `nb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: notebook.name || '未命名笔记本',
          createdAt: notebook.createdAt || Date.now(),
          updatedAt: notebook.updatedAt || Date.now(),
        };
        return {
          notebooks: [...state.notebooks, newNotebook],
          activeNotebookId: newNotebook.id,
        };
      }),

      updateNotebook: (notebookId, updates) => set((state) => ({
        notebooks: state.notebooks.map((nb) =>
          nb.id === notebookId
            ? { ...nb, ...updates, updatedAt: Date.now() }
            : nb
        ),
      })),

      removeNotebook: (notebookId) => set((state) => {
        const notebooks = state.notebooks.filter((nb) => nb.id !== notebookId);
        const notes = state.notes.filter((n) => n.notebookId !== notebookId);

        // 如果删除的是当前活动笔记本，切换到第一个
        if (notebookId === state.activeNotebookId) {
          const nextNotebook = notebooks[0];
          const nextNote = notes.find((n) => n.notebookId === nextNotebook?.id);
          return {
            notebooks,
            notes,
            activeNotebookId: nextNotebook?.id || null,
            activeNoteId: nextNote?.id || null,
            note: nextNote?.content || '',
          };
        }

        return { notebooks, notes };
      }),

      setActiveNotebookId: (notebookId) => set((state) => {
        // 切换笔记本时，选择该笔记本的第一个笔记
        const notebookNotes = state.notes.filter((n) => n.notebookId === notebookId);
        const firstNote = notebookNotes[0];

        return {
          activeNotebookId: notebookId,
          activeNoteId: firstNote?.id || null,
          note: firstNote?.content || '',
          noteVersion: firstNote?.version || 0,
          noteTimestamp: firstNote?.timestamp || 0,
          noteDeviceId: firstNote?.deviceId || 'local',
        };
      }),

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
        history: state.history,
        fontSize: state.fontSize,
        tabSize: state.tabSize,
        lineNumbers: state.lineNumbers,
        wordWrap: state.wordWrap,
        syncDebounceMs: state.syncDebounceMs,
        editorMode: state.editorMode,
      }),
    }
  )
);
