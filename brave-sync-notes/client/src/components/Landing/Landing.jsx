import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Shield,
  Moon,
  Sun,
  RefreshCw,
  Smartphone,
  Laptop,
  QrCode,
  Lock,
  Zap,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { useTranslation } from '../../utils/translations';
import { generateSyncChain } from '../../utils/crypto';

const Landing = ({ onJoinChain }) => {
  const {
    darkMode,
    toggleDarkMode,
    lang,
    toggleLang,
    deviceName,
    setDeviceName,
    setMnemonic,
  } = useAppStore();
  
  const t = useTranslation(lang);
  const [inputMnemonic, setInputMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check URL for chain code (from QR scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chainCode = params.get('chain');
    if (chainCode) {
      setInputMnemonic(decodeURIComponent(chainCode));
      // Clear the URL parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleStartNewChain = async () => {
    setIsLoading(true);
    try {
      const newMnemonic = generateSyncChain();
      setMnemonic(newMnemonic);
      const autoName = deviceName.trim() || `Device-${Math.floor(Math.random() * 1000)}`;
      setDeviceName(autoName);
      await onJoinChain(newMnemonic, autoName);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChain = async () => {
    if (!inputMnemonic.trim()) return;
    setIsLoading(true);
    try {
      const nameToUse = deviceName.trim() || `Device-${Math.floor(Math.random() * 1000)}`;
      setDeviceName(nameToUse);
      setMnemonic(inputMnemonic.trim());
      await onJoinChain(inputMnemonic.trim(), nameToUse);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Lock,
      title: lang === 'zh' ? '端到端加密' : 'End-to-End Encryption',
      desc: lang === 'zh' ? '使用 AES-256 加密，服务器无法解密' : 'AES-256 encryption, server cannot decrypt',
    },
    {
      icon: Zap,
      title: lang === 'zh' ? '实时同步' : 'Real-time Sync',
      desc: lang === 'zh' ? '多设备即时同步，支持大文件' : 'Instant sync across devices, large file support',
    },
    {
      icon: Globe,
      title: lang === 'zh' ? '无需注册' : 'No Registration',
      desc: lang === 'zh' ? '无账号、无追踪、无数据收集' : 'No accounts, no tracking, no data collection',
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-slate-50 to-orange-50 text-slate-900'
    }`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${
          darkMode ? 'bg-orange-500/10' : 'bg-orange-200/50'
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${
          darkMode ? 'bg-blue-500/10' : 'bg-blue-200/50'
        }`} />
      </div>

      {/* Header */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={toggleLang}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            darkMode
              ? 'hover:bg-slate-800 text-slate-300'
              : 'hover:bg-white/50 text-slate-600'
          }`}
        >
          {lang === 'en' ? '中文' : 'EN'}
        </button>
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-colors ${
            darkMode ? 'hover:bg-slate-800' : 'hover:bg-white/50'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Card */}
          <div className={`rounded-3xl shadow-2xl overflow-hidden ${
            darkMode
              ? 'bg-slate-800/90 border border-slate-700/50 backdrop-blur-xl'
              : 'bg-white/90 border border-white/50 backdrop-blur-xl'
          }`}>
            {/* Header */}
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-6 shadow-lg shadow-orange-500/30"
              >
                <Shield size={48} />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{t.appTitle}</h1>
              <p className={`text-base ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.appSubtitleLine1}
              </p>
              <p className="text-orange-500 font-semibold mt-1">{t.appSubtitleLine2}</p>
            </div>

            {/* Form */}
            <div className="px-8 pb-8 space-y-5">
              {/* Device Name */}
              <div>
                <label className={`block text-xs font-bold uppercase mb-2 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {t.deviceNameLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t.deviceNamePlaceholder}
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className={`w-full rounded-xl p-3.5 pl-11 text-sm transition-all focus:ring-2 focus:ring-orange-500 focus:outline-none ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border`}
                  />
                  <Laptop size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                </div>
              </div>

              {/* Start New Chain */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartNewChain}
                disabled={isLoading}
                className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <RefreshCw size={20} />
                )}
                {t.startChain}
              </motion.button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-3 ${
                    darkMode ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-400'
                  }`}>
                    {t.orJoinExisting}
                  </span>
                </div>
              </div>

              {/* Join Existing Chain */}
              <div>
                <div className="relative">
                  <textarea
                    placeholder={t.chainPlaceholder}
                    value={inputMnemonic}
                    onChange={(e) => setInputMnemonic(e.target.value)}
                    className={`w-full rounded-xl p-3.5 text-sm transition-all focus:ring-2 focus:ring-orange-500 focus:outline-none h-24 resize-none font-mono ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    } border ${showMnemonic ? '' : 'blur-[2px] focus:blur-none'}`}
                  />
                  <button
                    onClick={() => setShowMnemonic(!showMnemonic)}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'
                    }`}
                  >
                    {showMnemonic ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleJoinChain}
                  disabled={isLoading || !inputMnemonic.trim()}
                  className={`mt-3 w-full py-3.5 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    darkMode
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  <Smartphone size={20} />
                  {t.joinChain}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`p-4 rounded-2xl text-center ${
                  darkMode
                    ? 'bg-slate-800/50 border border-slate-700/50'
                    : 'bg-white/50 border border-white/50'
                }`}
              >
                <feature.icon size={24} className="mx-auto mb-2 text-orange-500" />
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mt-8 text-center text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
        >
          <p>
            {lang === 'zh' ? '开源项目' : 'Open Source'} · {lang === 'zh' ? '安全可靠' : 'Secure & Reliable'}
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Landing;
