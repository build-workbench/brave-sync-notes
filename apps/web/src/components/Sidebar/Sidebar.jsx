import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy,
  Check,
  Monitor,
  QrCode,
  History,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { useTranslation } from '../../utils/translations';
import toast from 'react-hot-toast';

const Sidebar = ({ socketId }) => {
  const {
    darkMode,
    lang,
    mnemonic,
    members,
    showSidebar,
    toggleSidebar,
    showQRCode,
    setShowQRCode,
    showHistory,
    setShowHistory,
    history,
    clearHistory,
    deleteHistoryItem,
    restoreFromHistory,
    setNote,
  } = useAppStore();
  
  const t = useTranslation(lang);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopyFeedback(true);
    toast.success(t.copied);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleRestore = (id) => {
    restoreFromHistory(id);
    toast.success(lang === 'zh' ? '已恢复' : 'Restored');
    setShowHistory(false);
  };

  const handleClearAll = () => {
    clearHistory();
    setShowClearConfirm(false);
    toast.success(lang === 'zh' ? '历史记录已清空' : 'History cleared');
  };

  const generateQRData = () => {
    // Generate a URL that includes the mnemonic for easy mobile joining
    const baseUrl = window.location.origin;
    return `${baseUrl}?chain=${encodeURIComponent(mnemonic)}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return lang === 'zh' ? '刚刚' : 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${lang === 'zh' ? '分钟前' : 'min ago'}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ${lang === 'zh' ? '小时前' : 'h ago'}`;
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed md:relative z-50 h-full w-72 md:w-64 flex flex-col border-r overflow-hidden ${
              darkMode
                ? 'bg-slate-800/95 border-slate-700 backdrop-blur-xl'
                : 'bg-white/95 border-slate-200 backdrop-blur-xl'
            }`}
          >
            {/* Close button for mobile */}
            <button
              onClick={toggleSidebar}
              className={`md:hidden absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
            >
              <X size={18} />
            </button>

            {/* Devices Section */}
            <div className="p-4 border-b border-inherit">
              <h3 className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <Monitor size={14} />
                {t.devicesInChain}
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        member.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'
                      }`} />
                      <span className={`truncate max-w-[140px] ${
                        member.id === socketId
                          ? 'font-bold text-orange-500'
                          : ''
                      }`}>
                        {member.name}
                        {member.id === socketId && ` (${lang === 'zh' ? '你' : 'You'})`}
                      </span>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lang === 'zh' ? '等待设备连接...' : 'Waiting for devices...'}
                  </p>
                )}
              </div>
            </div>

            {/* Chain Code Section */}
            <div className="p-4 border-b border-inherit">
              <h3 className={`text-xs font-bold uppercase mb-2 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {t.syncChainCode}
              </h3>
              <div className={`p-3 rounded-lg border text-xs font-mono break-all select-all ${
                darkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                {mnemonic}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                    darkMode
                      ? 'border-slate-700 hover:bg-slate-700 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  } ${copyFeedback ? 'ring-2 ring-green-500' : ''}`}
                >
                  {copyFeedback ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {t.copyCode}
                </button>
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className={`p-2 rounded-lg border transition-colors ${
                    darkMode
                      ? 'border-slate-700 hover:bg-slate-700 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  } ${showQRCode ? 'ring-2 ring-orange-500' : ''}`}
                  title={showQRCode ? t.hideQR : t.showQR}
                >
                  <QrCode size={14} />
                </button>
              </div>

              {/* QR Code */}
              <AnimatePresence>
                {showQRCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`mt-4 p-4 rounded-lg text-center ${
                      darkMode ? 'bg-white' : 'bg-white border border-slate-200'
                    }`}>
                      <QRCodeSVG
                        value={generateQRData()}
                        size={160}
                        level="M"
                        includeMargin
                        className="mx-auto"
                      />
                      <p className={`mt-2 text-xs ${
                        darkMode ? 'text-slate-600' : 'text-slate-500'
                      }`}>
                        {t.qrCodeDesc}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
                  darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                }`}
              >
                <span className={`text-xs font-bold uppercase flex items-center gap-2 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <History size={14} />
                  {t.history}
                  {history.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}>
                      {history.length}
                    </span>
                  )}
                </span>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${showHistory ? 'rotate-90' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex-1 overflow-hidden flex flex-col"
                  >
                    {history.length > 0 ? (
                      <>
                        <div className="flex-1 overflow-y-auto px-4 space-y-2">
                          {history.map((item) => (
                            <div
                              key={item.id}
                              className={`p-3 rounded-lg border transition-colors ${
                                darkMode
                                  ? 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <p className={`text-xs truncate mb-1 ${
                                darkMode ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {item.preview || '(empty)'}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-[10px] ${
                                  darkMode ? 'text-slate-600' : 'text-slate-400'
                                }`}>
                                  {formatTime(item.timestamp)}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleRestore(item.id)}
                                    className={`p-1 rounded transition-colors ${
                                      darkMode
                                        ? 'hover:bg-slate-700 text-slate-400'
                                        : 'hover:bg-slate-200 text-slate-500'
                                    }`}
                                    title={t.restore}
                                  >
                                    <RotateCcw size={12} />
                                  </button>
                                  <button
                                    onClick={() => deleteHistoryItem(item.id)}
                                    className={`p-1 rounded transition-colors ${
                                      darkMode
                                        ? 'hover:bg-red-900/50 text-slate-400 hover:text-red-400'
                                        : 'hover:bg-red-100 text-slate-500 hover:text-red-500'
                                    }`}
                                    title={t.delete}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 border-t border-inherit">
                          {showClearConfirm ? (
                            <div className="flex gap-2">
                              <button
                                onClick={handleClearAll}
                                className="flex-1 py-2 text-xs font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                              >
                                {t.confirm}
                              </button>
                              <button
                                onClick={() => setShowClearConfirm(false)}
                                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                                  darkMode
                                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                }`}
                              >
                                {t.cancel}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowClearConfirm(true)}
                              className={`w-full py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                                darkMode
                                  ? 'bg-slate-700 hover:bg-red-900/50 text-slate-400 hover:text-red-400'
                                  : 'bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500'
                              }`}
                            >
                              <Trash2 size={12} />
                              {t.clearAll}
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className={`px-4 text-sm ${
                        darkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {t.historyEmpty}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-r-lg transition-all ${
          darkMode
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-y border-r border-slate-700'
            : 'bg-white hover:bg-slate-50 text-slate-500 border-y border-r border-slate-200'
        } ${showSidebar ? 'translate-x-64' : 'translate-x-0'}`}
      >
        {showSidebar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </>
  );
};

export default Sidebar;
