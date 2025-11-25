import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export const LoadingSpinner = ({ size = 24, className = '' }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className={className}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  </motion.div>
);

export const LoadingOverlay = ({ message, lang = 'zh' }) => {
  const defaultMessage = lang === 'zh' ? '加载中...' : 'Loading...';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
    >
      <div className="text-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="inline-flex p-4 rounded-full bg-orange-500/20 text-orange-500 mb-4"
        >
          <Shield size={48} />
        </motion.div>
        <p className="text-slate-300 text-lg">{message || defaultMessage}</p>
      </div>
    </motion.div>
  );
};

export const EditorSkeleton = ({ darkMode = true }) => (
  <div className={`w-full h-full p-4 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
    <div className="animate-pulse space-y-3">
      <div className={`h-4 rounded w-3/4 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-4 rounded w-1/2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-4 rounded w-5/6 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-4 rounded w-2/3 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className="h-4" />
      <div className={`h-4 rounded w-4/5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-4 rounded w-3/5 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-4 rounded w-1/2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
  </div>
);

export const SidebarSkeleton = ({ darkMode = true }) => (
  <div className={`w-64 h-full p-4 border-r ${
    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
  }`}>
    <div className="animate-pulse space-y-4">
      {/* Devices section */}
      <div>
        <div className={`h-3 rounded w-24 mb-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
            <div className={`h-4 rounded w-32 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
            <div className={`h-4 rounded w-28 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
          </div>
        </div>
      </div>
      
      {/* Chain code section */}
      <div className={`pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className={`h-3 rounded w-28 mb-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-20 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-8 rounded mt-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
      </div>
    </div>
  </div>
);

export default LoadingSpinner;
