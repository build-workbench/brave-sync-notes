import React, { useEffect, useCallback, useState, useMemo, useRef, Suspense, lazy } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, setAutoSaveCallback } from './store/useStore';
import { useSocket } from './hooks/useSocket';
import { useStorage } from './hooks/useStorage';
import { restoreNotebookState } from './utils/notebooks';
import { useTranslation } from './utils/translations';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { LoadingOverlay, EditorSkeleton } from './components/Loading/LoadingSpinner';
import { ConflictDialog, ConflictIndicator } from './components/Conflict';
import OfflineIndicator from './components/OfflineIndicator/OfflineIndicator';
import NoteList from './components/NoteList/NoteList';
import { Eye, Edit3, Columns, AlertCircle } from 'lucide-react';

// Lazy load heavy components
const Landing = lazy(() => import('./components/Landing/Landing'));
const Header = lazy(() => import('./components/Header/Header'));
const Sidebar = lazy(() => import('./components/Sidebar/Sidebar'));
const CodeEditor = lazy(() => import('./components/Editor/CodeEditor'));
const MarkdownPreview = lazy(() => import('./components/Editor/MarkdownPreview'));

function App() {
  // Use selectors to prevent unnecessary re-renders
  const darkMode = useAppStore((state) => state.darkMode);
  const lang = useAppStore((state) => state.lang);
  const view = useAppStore((state) => state.view);
  const note = useAppStore((state) => state.note);
  const setNote = useAppStore((state) => state.setNote);
  const resetConnection = useAppStore((state) => state.resetConnection);
  const showSidebar = useAppStore((state) => state.showSidebar);
  const setStorageInitialized = useAppStore((state) => state.setStorageInitialized);
  const notebooks = useAppStore((state) => state.notebooks);
  const activeNotebookId = useAppStore((state) => state.activeNotebookId);
  const deviceName = useAppStore((state) => state.deviceName);

  // Storage initialization
  const {
    isInitialized: storageReady,
    storageType,
    error: storageError,
    isLoading: storageLoading,
    initialize: initStorage,
    listNotebooks,
    getAllNotes,
    saveNotebook,
    saveNote,
  } = useStorage();

  const {
    joinChain,
    pushUpdate,
    disconnect,
    getSocketId,
    getCurrentRoomId,
    requestSync,
    conflictCount,
    pendingConflicts,
    resolveConflict,
    clearConflicts,
    queueSize,
    isOffline,
  } = useSocket();
  const t = useTranslation(lang);

  // Get store actions for offline status sync
  const setOfflineQueueSize = useAppStore((state) => state.setOfflineQueueSize);
  const setIsOnline = useAppStore((state) => state.setIsOnline);

  // Sync offline queue size from socket to store
  useEffect(() => {
    setOfflineQueueSize(queueSize);
  }, [queueSize, setOfflineQueueSize]);

  // Sync offline status to store
  useEffect(() => {
    setIsOnline(!isOffline());
  }, [isOffline, setIsOnline]);
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'preview', 'split'
  const [activeConflictId, setActiveConflictId] = useState(null);
  const [storageInitAttempted, setStorageInitAttempted] = useState(false);
  const notebookStateHydratedRef = useRef(false);

  const activeNotebook = useMemo(
    () => notebooks.find((entry) => entry.id === activeNotebookId) || null,
    [notebooks, activeNotebookId]
  );

  // Setup auto-save callback
  useEffect(() => {
    setAutoSaveCallback(async (noteData) => {
      if (storageReady && noteData.notebookId && noteData.noteId) {
        try {
          await saveNote(noteData.notebookId, {
            id: noteData.noteId,
            content: noteData.content,
            version: noteData.version,
            updatedAt: noteData.updatedAt,
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
          toast.error(lang === 'zh' ? '自动保存失败' : 'Auto-save failed', {
            duration: 3000,
          });
        }
      }
    });
  }, [storageReady, saveNote, lang]);

  // Initialize storage on mount
  useEffect(() => {
    const initStorageOnMount = async () => {
      if (storageInitAttempted) return;
      setStorageInitAttempted(true);

      try {
        const success = await initStorage();
        if (success) {
          setStorageInitialized(true, storageType);
          if (storageType === 'LocalStorage') {
            toast.success(lang === 'zh' ? '使用 LocalStorage 存储（IndexedDB 不可用）' : 'Using LocalStorage (IndexedDB unavailable)', {
              icon: '💾',
              duration: 4000,
            });
          }
        }
      } catch (error) {
        console.error('Storage initialization failed:', error);
        toast.error(lang === 'zh' ? '存储初始化失败' : 'Storage initialization failed', {
          icon: '❌',
          duration: 5000,
        });
      }
    };

    initStorageOnMount();
  }, [initStorage, storageType, setStorageInitialized, lang, storageInitAttempted]);

  // Show storage error state
  const showStorageError = storageInitAttempted && storageError && !storageReady;

  useEffect(() => {
    const hydrateNotebookData = async () => {
      if (!storageReady || notebookStateHydratedRef.current) {
        return;
      }

      try {
        const currentState = useAppStore.getState();
        const restored = await restoreNotebookState(
          {
            listNotebooks,
            listNotes: getAllNotes,
            saveNotebook,
            saveNote,
          },
          currentState
        );

        if (restored.notebooks.length === 0) {
          return;
        }

        notebookStateHydratedRef.current = true;

        useAppStore.setState({
          notebooks: restored.notebooks,
          notes: restored.notes,
          activeNotebookId: restored.activeNotebookId,
          activeNoteId: restored.activeNoteId,
          mnemonic: restored.mnemonic,
          note: restored.note,
          noteVersion: restored.noteVersion,
          noteTimestamp: restored.noteTimestamp,
          noteDeviceId: restored.noteDeviceId,
          view: 'app',
        });
      } catch (error) {
        console.error('Failed to restore notebook state:', error);
        toast.error(lang === 'zh' ? '恢复笔记本失败' : 'Failed to restore notebooks', {
          duration: 4000,
        });
      }
    };

    hydrateNotebookData();
  }, [storageReady, listNotebooks, getAllNotes, saveNotebook, saveNote, lang]);

  const activeConflict = useMemo(() => {
    if (!activeConflictId) return null;
    return pendingConflicts.find((c) => c.id === activeConflictId) || null;
  }, [activeConflictId, pendingConflicts]);

  const openConflictDialog = useCallback(() => {
    const first = pendingConflicts[0];
    if (first) {
      setActiveConflictId(first.id);
    }
  }, [pendingConflicts]);

  const closeConflictDialog = useCallback(() => {
    setActiveConflictId(null);
  }, []);

  const handleResolveConflict = useCallback(async (resolvedContent) => {
    if (!activeConflictId) return;

    const resolved = await resolveConflict(activeConflictId, resolvedContent);
    if (typeof resolved === 'string') {
      setNote(resolved);
      pushUpdate(resolved);
    }
    setActiveConflictId(null);
  }, [activeConflictId, resolveConflict, setNote, pushUpdate]);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle visibility change - request sync when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && view === 'app') {
        requestSync();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [view, requestSync]);

  // Handle note changes
  const handleNoteChange = useCallback((newContent) => {
    setNote(newContent);
    pushUpdate(newContent);
  }, [setNote, pushUpdate]);

  // Handle join chain
  const handleJoinChain = useCallback(async (mnemonic, deviceName) => {
    return joinChain(mnemonic, deviceName);
  }, [joinChain]);

  // Handle leave
  const handleLeave = useCallback(() => {
    disconnect();
    clearConflicts();
    resetConnection();
  }, [disconnect, clearConflicts, resetConnection]);

  useEffect(() => {
    const syncActiveNotebook = async () => {
      if (view !== 'app' || !storageReady || !activeNotebook?.mnemonic) {
        return;
      }

      if (getCurrentRoomId() === activeNotebook.roomId) {
        return;
      }

      const nextDeviceName = deviceName?.trim() || 'Local Device';
      const joined = await joinChain(activeNotebook.mnemonic, nextDeviceName);
      if (joined) {
        requestSync();
      }
    };

    syncActiveNotebook();
  }, [
    view,
    storageReady,
    activeNotebook,
    deviceName,
    joinChain,
    getCurrentRoomId,
    requestSync,
  ]);

  // Memoize word count calculation
  const wordCount = useMemo(() => {
    return note.split(/\s+/).filter(Boolean).length;
  }, [note]);

  // Show loading state during storage initialization
  if (storageLoading && !storageInitAttempted) {
    return (
      <div className={`h-screen flex items-center justify-center ${
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-sm text-slate-500">{lang === 'zh' ? '正在初始化存储...' : 'Initializing storage...'}</p>
        </div>
      </div>
    );
  }

  // Show storage error state
  if (showStorageError) {
    return (
      <div className={`h-screen flex items-center justify-center ${
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
          <AlertCircle size={48} className="text-red-500" />
          <h2 className="text-xl font-semibold">{lang === 'zh' ? '存储初始化失败' : 'Storage Initialization Failed'}</h2>
          <p className="text-sm text-slate-500">{storageError}</p>
          <button
            onClick={() => {
              setStorageInitAttempted(false);
              initStorage();
            }}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {lang === 'zh' ? '重试' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // Landing Page
  if (view === 'landing') {
    return (
      <ErrorBoundary lang={lang}>
        <Suspense fallback={<LoadingOverlay lang={lang} />}>
          <Landing onJoinChain={handleJoinChain} />
        </Suspense>
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: darkMode ? '!bg-slate-800 !text-white' : '',
            duration: 3000,
          }}
        />
      </ErrorBoundary>
    );
  }

  // Main App
  return (
    <ErrorBoundary lang={lang}>
      <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        {/* Offline status banner */}
        <OfflineIndicator />

        <Suspense fallback={<div className="h-14 bg-slate-800" />}>
          <Header onLeave={handleLeave} />
        </Suspense>

        <ConflictIndicator
          conflictCount={conflictCount}
          onClick={openConflictDialog}
          darkMode={darkMode}
        />

        <ConflictDialog
          conflict={activeConflict}
          onResolve={handleResolveConflict}
          onCancel={closeConflictDialog}
          darkMode={darkMode}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <Suspense fallback={<div className="w-64 bg-slate-800" />}>
            <Sidebar socketId={getSocketId()} />
          </Suspense>

          <div className={`hidden lg:block w-80 shrink-0 border-r ${
            darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <NoteList />
          </div>

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          showSidebar ? 'md:ml-0' : 'ml-0'
        }`}>
          {/* Toolbar */}
          <div className={`flex items-center justify-between px-4 py-2 border-b shrink-0 ${
            darkMode
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'edit'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Edit3 size={14} />
                <span className="hidden sm:inline">{t.edit}</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'preview'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Eye size={14} />
                <span className="hidden sm:inline">{t.preview}</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'split'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Columns size={14} />
                <span className="hidden sm:inline">{t.split}</span>
              </button>
            </div>

            {/* Character/Word count */}
            <div className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {note.length} {lang === 'zh' ? '字符' : 'chars'} · {wordCount} {lang === 'zh' ? '词' : 'words'}
            </div>
          </div>

          {/* Editor/Preview Area */}
          <div className="flex-1 overflow-hidden flex">
            <AnimatePresence mode="wait">
              {viewMode === 'edit' && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <Suspense fallback={<EditorSkeleton darkMode={darkMode} />}>
                    <CodeEditor
                      value={note}
                      onChange={handleNoteChange}
                      placeholder={t.notePlaceholder}
                    />
                  </Suspense>
                </motion.div>
              )}

              {viewMode === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className={`w-full h-full overflow-auto ${
                    darkMode ? 'bg-slate-900' : 'bg-white'
                  }`}
                >
                  <Suspense fallback={<EditorSkeleton darkMode={darkMode} />}>
                    <MarkdownPreview content={note || t.noContent} />
                  </Suspense>
                </motion.div>
              )}

              {viewMode === 'split' && (
                <motion.div
                  key="split"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full flex"
                >
                  <div className={`w-1/2 h-full border-r ${
                    darkMode ? 'border-slate-700' : 'border-slate-200'
                  }`}>
                    <Suspense fallback={<EditorSkeleton darkMode={darkMode} />}>
                      <CodeEditor
                        value={note}
                        onChange={handleNoteChange}
                        placeholder={t.notePlaceholder}
                      />
                    </Suspense>
                  </div>
                  <div className={`w-1/2 h-full overflow-auto ${
                    darkMode ? 'bg-slate-900' : 'bg-white'
                  }`}>
                    <Suspense fallback={<EditorSkeleton darkMode={darkMode} />}>
                      <MarkdownPreview content={note || t.noContent} />
                    </Suspense>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        </div>

        <Toaster
          position="bottom-center"
          toastOptions={{
            className: darkMode ? '!bg-slate-800 !text-white' : '',
            duration: 3000,
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
