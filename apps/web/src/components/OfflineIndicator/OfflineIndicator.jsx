import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { useTranslation } from '../../utils/translations';

/**
 * OfflineIndicator Component
 * Shows network and sync status with visual indicators
 */
const OfflineIndicator = () => {
  const {
    darkMode,
    lang,
    isOnline,
    status,
    offlineQueueSize,
    setIsOnline,
  } = useAppStore();

  const t = useTranslation(lang);
  const [showRetry, setShowRetry] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRetry(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  // Determine status
  const isOffline = !isOnline;
  const isDisconnected = status === 'disconnected';
  const hasPendingSync = offlineQueueSize > 0;

  // Don't show if everything is fine
  if (!isOffline && !isDisconnected && !hasPendingSync) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
          isOffline
            ? 'bg-red-500 text-white'
            : isDisconnected
            ? 'bg-amber-500 text-white'
            : 'bg-blue-500 text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isOffline ? (
            <>
              <WifiOff size={16} />
              <span>{lang === 'zh' ? '网络已断开' : 'You are offline'}</span>
            </>
          ) : isDisconnected ? (
            <>
              <CloudOff size={16} />
              <span>{lang === 'zh' ? '同步服务已断开' : 'Sync service disconnected'}</span>
              {hasPendingSync && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {lang === 'zh' ? `${offlineQueueSize} 个待同步` : `${offlineQueueSize} pending`}
                </span>
              )}
            </>
          ) : hasPendingSync ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>{lang === 'zh' ? `正在同步 ${offlineQueueSize} 个更改...` : `Syncing ${offlineQueueSize} changes...`}</span>
            </>
          ) : null}

          {(isOffline || isDisconnected) && (
            <button
              onClick={handleRetry}
              className="ml-3 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            >
              {lang === 'zh' ? '重试' : 'Retry'}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * ConnectionStatus Component
 * Shows a small status indicator in the header
 */
export const ConnectionStatus = () => {
  const { darkMode, lang, isOnline, status } = useAppStore();
  const t = useTranslation(lang);

  const isConnected = isOnline && status === 'connected';
  const isSyncing = status === 'syncing';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
      isConnected
        ? 'bg-green-500/20 text-green-500'
        : isSyncing
        ? 'bg-blue-500/20 text-blue-500'
        : 'bg-red-500/20 text-red-500'
    }`}>
      {isConnected ? (
        <>
          <Wifi size={12} />
          <span>{lang === 'zh' ? '已连接' : 'Connected'}</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw size={12} className="animate-spin" />
          <span>{lang === 'zh' ? '同步中' : 'Syncing'}</span>
        </>
      ) : (
        <>
          <CloudOff size={12} />
          <span>{lang === 'zh' ? '离线' : 'Offline'}</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
