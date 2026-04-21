import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Menu,
  Settings,
  Download,
  Upload,
  FileText,
  Code,
  LogOut,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { useTranslation } from '../../utils/translations';
import toast from 'react-hot-toast';

const Header = ({ onLeave }) => {
  const {
    darkMode,
    toggleDarkMode,
    lang,
    toggleLang,
    status,
    toggleSidebar,
    showSidebar,
    note,
    setNote,
    editorMode,
    setEditorMode,
    fontSize,
    setFontSize,
    lineNumbers,
    setLineNumbers,
    wordWrap,
    setWordWrap,
  } = useAppStore();
  
  const t = useTranslation(lang);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-green-500 bg-green-500/10',
      label: t.statusConnected,
    },
    syncing: {
      icon: Wifi,
      color: 'text-blue-500 bg-blue-500/10 animate-pulse',
      label: t.statusSyncing,
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-red-500 bg-red-500/10',
      label: t.statusDisconnected,
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.disconnected;
  const StatusIcon = currentStatus.icon;

  const handleExport = (format) => {
    const filename = `note-${new Date().toISOString().split('T')[0]}`;
    const blob = new Blob([note], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'md' ? `${filename}.md` : `${filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t.exportSuccess);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.markdown';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const text = await file.text();
        setNote(text);
        toast.success(t.importSuccess);
      }
    };
    input.click();
  };

  const handleLeave = () => {
    setShowLeaveConfirm(false);
    onLeave?.();
  };

  return (
    <>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
        darkMode
          ? 'bg-slate-800/80 border-slate-700'
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg transition-colors md:hidden ${
                darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
              title={t.sidebarTooltip}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="text-orange-500" size={24} />
              <span className="font-bold text-lg hidden sm:inline">{t.headerTitle}</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                darkMode
                  ? 'hover:bg-slate-700 text-slate-300'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
              title={t.languageTooltip}
            >
              {lang === 'en' ? '中文' : 'EN'}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
              title={t.darkModeTooltip}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
              title={t.settings}
            >
              <Settings size={20} />
            </button>

            {/* Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${currentStatus.color}`}>
              <StatusIcon size={16} />
              <span className="hidden sm:inline">{currentStatus.label}</span>
            </div>

            {/* Leave */}
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                darkMode
                  ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20'
                  : 'text-slate-500 hover:text-red-500 hover:bg-red-100'
              }`}
            >
              <span className="hidden sm:inline">{t.leave}</span>
              <LogOut size={18} className="sm:hidden" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                darkMode ? 'bg-slate-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-4 border-b ${
                darkMode ? 'border-slate-700' : 'border-slate-200'
              }`}>
                <h2 className="text-lg font-bold">{t.settings}</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Editor Mode */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {t.editorMode}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditorMode('markdown')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        editorMode === 'markdown'
                          ? 'bg-orange-500 text-white'
                          : darkMode
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <FileText size={16} />
                      {t.markdown}
                    </button>
                    <button
                      onClick={() => setEditorMode('code')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        editorMode === 'code'
                          ? 'bg-orange-500 text-white'
                          : darkMode
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Code size={16} />
                      {t.code}
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {t.fontSize}: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>

                {/* Line Numbers */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {t.lineNumbers}
                  </label>
                  <button
                    onClick={() => setLineNumbers(!lineNumbers)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      lineNumbers ? 'bg-orange-500' : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      lineNumbers ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Word Wrap */}
                <div className="flex items-center justify-between">
                  <label className={`text-sm font-medium ${
                    darkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {t.wordWrap}
                  </label>
                  <button
                    onClick={() => setWordWrap(!wordWrap)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      wordWrap ? 'bg-orange-500' : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      wordWrap ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Import/Export */}
                <div className={`pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <div className="flex gap-2">
                    <button
                      onClick={handleImport}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        darkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Upload size={16} />
                      {t.importFile}
                    </button>
                    <button
                      onClick={() => handleExport('md')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        darkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Download size={16} />
                      {t.exportFile}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowLeaveConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 ${
                darkMode ? 'bg-slate-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">{t.leave}</h3>
              <p className={`mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.confirmLeave}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleLeave}
                  className="flex-1 py-2 px-4 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  {t.leave}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
