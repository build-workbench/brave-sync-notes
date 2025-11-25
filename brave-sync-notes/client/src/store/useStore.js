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
      
      // Content
      note: '',
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
      
      setNote: (note) => set({ note }),
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
          set({ note: item.content });
        }
      },
      
      // Settings
      setFontSize: (fontSize) => set({ fontSize }),
      setTabSize: (tabSize) => set({ tabSize }),
      setLineNumbers: (lineNumbers) => set({ lineNumbers }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setSyncDebounceMs: (syncDebounceMs) => set({ syncDebounceMs }),
      
      // Reset
      resetConnection: () => set({
        view: 'landing',
        status: 'disconnected',
        mnemonic: '',
        members: [],
        note: '',
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
