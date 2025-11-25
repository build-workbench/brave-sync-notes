import React, { useEffect, useCallback, useState, useMemo, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useStore';
import { useSocket } from './hooks/useSocket';
import { useTranslation } from './utils/translations';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { LoadingOverlay, EditorSkeleton } from './components/Loading/LoadingSpinner';
import { Eye, Edit3, Columns } from 'lucide-react';

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

  const { joinChain, pushUpdate, disconnect, getSocketId, requestSync } = useSocket();
  const t = useTranslation(lang);
  const [viewMode, setViewMode] = useState('edit'); // 'edit', 'preview', 'split'
  const [isLoading, setIsLoading] = useState(false);

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
    resetConnection();
  }, [disconnect, resetConnection]);

  // Memoize word count calculation
  const wordCount = useMemo(() => {
    return note.split(/\s+/).filter(Boolean).length;
  }, [note]);

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
        <Suspense fallback={<div className="h-14 bg-slate-800" />}>
          <Header onLeave={handleLeave} />
        </Suspense>

        <div className="flex flex-1 overflow-hidden relative">
          <Suspense fallback={<div className="w-64 bg-slate-800" />}>
            <Sidebar socketId={getSocketId()} />
          </Suspense>

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
