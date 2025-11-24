import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { generateSyncChain, deriveKeys, encryptData, decryptData } from './utils/crypto';
import { Copy, Check, RefreshCw, Shield, Smartphone, Wifi, Moon, Sun, Laptop, Monitor } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Connect to server
const SOCKET_URL = 'http://localhost:3002';

function App() {
  // --- State ---
  const [view, setView] = useState('landing'); // 'landing', 'app'
  const [mnemonic, setMnemonic] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('disconnected'); // 'disconnected', 'connected', 'syncing'
  const [members, setMembers] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showPreview, setShowPreview] = useState(false); // Toggle between Edit/Preview
  const [lang, setLang] = useState('en');

  // Refs
  const socketRef = useRef(null);
  const keysRef = useRef(null);

  // --- Effects ---
  // Initialize Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // --- Handlers ---
  const translations = {
    en: {
      appTitle: 'Secure Note Chain',
      appSubtitleLine1: 'End-to-end encrypted synchronization.',
      appSubtitleLine2: 'No accounts. No tracking.',
      deviceNameLabel: 'Your Device Name',
      deviceNamePlaceholder: 'e.g. MacBook Pro',
      startChain: 'Start New Sync Chain',
      orJoinExisting: 'Or join existing',
      chainPlaceholder: 'Paste your 12-word Chain Code here...',
      joinChain: 'Join Chain',
      headerTitle: 'Secure Notes',
      leave: 'Leave',
      devicesInChain: 'Devices in Chain',
      syncChainCode: 'Sync Chain Code',
      copyCode: 'Copy Code',
      edit: 'Edit',
      preview: 'Preview',
      notePlaceholder: '# Start typing your secure notes...',
      noContent: '*No content yet...*',
      statusConnected: 'connected',
      statusSyncing: 'syncing',
      statusDisconnected: 'disconnected',
    },
    zh: {
      appTitle: '安全同步笔记',
      appSubtitleLine1: '端到端加密的多设备同步。',
      appSubtitleLine2: '无需账号，不留痕迹。',
      deviceNameLabel: '设备名称',
      deviceNamePlaceholder: '例如：我的 MacBook',
      startChain: '创建新的同步链',
      orJoinExisting: '或加入已有同步链',
      chainPlaceholder: '在此粘贴你的 12 个单词同步密钥...',
      joinChain: '加入同步链',
      headerTitle: '安全笔记',
      leave: '退出',
      devicesInChain: '在线设备',
      syncChainCode: '同步链代码',
      copyCode: '复制代码',
      edit: '编辑',
      preview: '预览',
      notePlaceholder: '# 在这里开始记录你的笔记...',
      noContent: '*还没有内容...*',
      statusConnected: '已连接',
      statusSyncing: '同步中',
      statusDisconnected: '未连接',
    },
  };

  const t = translations[lang] || translations.en;
  const statusLabel = {
    connected: t.statusConnected,
    syncing: t.statusSyncing,
    disconnected: t.statusDisconnected,
  }[status] || status;

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleStartNewChain = () => {
    const newMnemonic = generateSyncChain();
    setMnemonic(newMnemonic);
    // Auto-generate a device name if empty
    const autoName = deviceName.trim() || `Device-${Math.floor(Math.random() * 1000)}`;
    joinChain(newMnemonic, autoName);
  };

  const handleJoinChain = () => {
    if (!mnemonic.trim()) return;
    const nameToUse = deviceName.trim() || `Device-${Math.floor(Math.random() * 1000)}`;
    joinChain(mnemonic, nameToUse);
  };

  const joinChain = (chainMnemonic, name) => {
    try {
      // 1. Derive keys
      const keys = deriveKeys(chainMnemonic);
      keysRef.current = keys;
      
      // 2. Connect to Socket
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('connect', () => {
        setStatus('connected');
        // 3. Join the specific room with device name
        socketRef.current.emit('join-chain', { 
          roomId: keys.roomId, 
          deviceName: name 
        });
      });

      socketRef.current.on('sync-update', (payload) => {
        // 4. Decrypt incoming data
        if (payload && payload.encryptedData) {
          const decrypted = decryptData(payload.encryptedData, keys.encryptionKey);
          if (decrypted && decrypted.content !== undefined) {
            setNote(decrypted.content);
          }
        }
      });

      socketRef.current.on('room-info', (data) => {
        if (data && data.members) {
          setMembers(data.members);
        }
      });

      socketRef.current.on('disconnect', () => {
        setStatus('disconnected');
      });

      setView('app');
    } catch (e) {
      console.error("Error joining chain", e);
      alert("Failed to initialize crypto keys.");
    }
  };

  const handleNoteChange = (e) => {
    const newContent = e.target.value;
    setNote(newContent);
    setStatus('syncing');

    // Debounce or just emit immediately
    if (socketRef.current && keysRef.current) {
      const encrypted = encryptData({ content: newContent }, keysRef.current.encryptionKey);
      
      socketRef.current.emit('push-update', {
        roomId: keysRef.current.roomId,
        encryptedData: encrypted,
        timestamp: Date.now()
      });
      
      // Reset status after a brief delay
      setTimeout(() => setStatus('connected'), 500);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // --- Render: Landing Page ---
  if (view === 'landing') {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col items-center justify-center p-4`}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="px-3 py-1 rounded-full text-xs font-medium border border-slate-500/40 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            {lang === 'en' ? '中' : 'En'}
          </button>
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        <div className={`max-w-md w-full p-8 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-center mb-6 text-orange-500">
            <Shield size={64} />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">{t.appTitle}</h1>
          <p className={`text-center mb-8 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {t.appSubtitleLine1} <br/>
            <span className="text-orange-500 font-semibold">{t.appSubtitleLine2}</span>
          </p>

          <div className="space-y-4">
             {/* Device Name Input */}
             <div>
              <label className={`block text-xs font-bold uppercase mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {t.deviceNameLabel}
              </label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder={t.deviceNamePlaceholder}
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className={`w-full border rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
                <Laptop size={16} className="absolute left-3 top-3.5 text-slate-500" />
              </div>
            </div>

            <div className="border-t border-b py-4 my-4 border-slate-200 dark:border-slate-700 space-y-4">
              <button 
                onClick={handleStartNewChain}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                {t.startChain}
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-400'}`}>{t.orJoinExisting}</span>
              </div>
            </div>

            <div>
              <textarea 
                placeholder={t.chainPlaceholder}
                className={`w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none h-24 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                onChange={(e) => setMnemonic(e.target.value)}
              />
              <button 
                onClick={handleJoinChain}
                className={`mt-2 w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
              >
                <Smartphone size={20} />
                {t.joinChain}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Main App ---
  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b p-4 flex flex-wrap gap-4 justify-between items-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <Shield className="text-orange-500" />
          <span className="font-bold hidden sm:inline">{t.headerTitle}</span>
        </div>
        
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="px-3 py-1 rounded-full text-xs font-medium border border-slate-500/40 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            {lang === 'en' ? '中' : 'En'}
          </button>

          {/* Dark Mode Toggle */}
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${status === 'connected' ? 'bg-green-500/10 text-green-500' : status === 'syncing' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
            <Wifi size={16} />
            <span className="capitalize font-medium">{statusLabel}</span>
          </div>
          
          <button 
            onClick={() => setView('landing')}
            className={`text-sm font-medium ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {t.leave}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Info Panel (Collapsible on mobile could be added) */}
        <aside className={`w-full md:w-64 border-r flex flex-col ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="p-4 border-b border-inherit">
             <h3 className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
               <Monitor size={14} /> {t.devicesInChain}
             </h3>
             <div className="space-y-2">
               {members.map((member) => (
                 <div key={member.id} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                     <span className={`truncate max-w-[120px] ${member.id === socketRef.current?.id ? 'font-bold text-orange-500' : ''}`}>
                       {member.name} {member.id === socketRef.current?.id && '(You)'}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="p-4">
            <h3 className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {t.syncChainCode}
            </h3>
            <div className={`p-3 rounded-lg border text-xs font-mono break-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              {mnemonic}
            </div>
            <button 
              onClick={copyToClipboard}
              className={`mt-2 w-full py-2 text-xs font-medium rounded border transition-colors flex items-center justify-center gap-2 ${darkMode ? 'border-slate-700 hover:bg-slate-700 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'}`}
            >
              {copyFeedback ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {t.copyCode}
            </button>
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col w-full relative">
          {/* Toolbar */}
          <div className={`flex items-center justify-between p-2 border-b ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
             <div className="flex items-center gap-2">
               <button 
                 onClick={() => setShowPreview(false)}
                 className={`px-3 py-1.5 text-sm rounded-md transition-colors ${!showPreview ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white shadow text-slate-900') : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}
               >
                 {t.edit}
               </button>
               <button 
                 onClick={() => setShowPreview(true)}
                 className={`px-3 py-1.5 text-sm rounded-md transition-colors ${showPreview ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white shadow text-slate-900') : (darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}
               >
                 {t.preview}
               </button>
             </div>
          </div>

          <div className="flex-1 relative overflow-auto">
            {showPreview ? (
              <div className={`p-8 prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note || t.noContent}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={note}
                onChange={handleNoteChange}
                placeholder={t.notePlaceholder}
                className={`w-full h-full p-8 text-lg font-mono leading-relaxed focus:outline-none resize-none ${darkMode ? 'bg-slate-900 text-slate-200 placeholder-slate-600' : 'bg-white text-slate-800 placeholder-slate-300'}`}
                spellCheck="false"
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
