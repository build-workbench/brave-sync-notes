import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Check, GitMerge } from 'lucide-react';

/**
 * 冲突解决对话框
 */
const ConflictDialog = ({ conflict, onResolve, onCancel, darkMode = true }) => {
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [customContent, setCustomContent] = useState('');
    const [resolutionMode, setResolutionMode] = useState('choose'); // 'choose' | 'custom'

    if (!conflict) return null;

    const handleResolve = () => {
        if (resolutionMode === 'choose' && selectedVersion) {
            onResolve(selectedVersion === 'local' ? conflict.localVersion.content : conflict.remoteVersion.content);
        } else if (resolutionMode === 'custom' && customContent) {
            onResolve(customContent);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getConflictTypeLabel = (type) => {
        switch (type) {
            case 'concurrent_edit':
                return '并发编辑冲突';
            case 'offline_divergence':
                return '离线分歧冲突';
            default:
                return '未知冲突类型';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
                        }`}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">检测到内容冲突</h2>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {getConflictTypeLabel(conflict.type)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className={`p-2 rounded-lg transition-colors ${darkMode
                                    ? 'hover:bg-slate-700 text-slate-400 hover:text-white'
                                    : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                        {/* Resolution Mode Selector */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setResolutionMode('choose')}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${resolutionMode === 'choose'
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : darkMode
                                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                选择版本
                            </button>
                            <button
                                onClick={() => setResolutionMode('custom')}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${resolutionMode === 'custom'
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : darkMode
                                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                自定义合并
                            </button>
                        </div>

                        {resolutionMode === 'choose' ? (
                            /* Version Comparison */
                            <div className="grid grid-cols-2 gap-4">
                                {/* Local Version */}
                                <div
                                    onClick={() => setSelectedVersion('local')}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedVersion === 'local'
                                            ? 'border-orange-500 bg-orange-500/10'
                                            : darkMode
                                                ? 'border-slate-700 hover:border-slate-600'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-lg">本地版本</h3>
                                        {selectedVersion === 'local' && (
                                            <Check className="w-5 h-5 text-orange-500" />
                                        )}
                                    </div>
                                    <div className={`text-sm space-y-1 mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                        <p>版本: {conflict.localVersion.version}</p>
                                        <p>时间: {formatTimestamp(conflict.localVersion.timestamp)}</p>
                                        <p>设备: {conflict.localVersion.deviceId}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg font-mono text-sm overflow-auto max-h-64 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
                                        }`}>
                                        <pre className="whitespace-pre-wrap break-words">
                                            {conflict.localVersion.content}
                                        </pre>
                                    </div>
                                </div>

                                {/* Remote Version */}
                                <div
                                    onClick={() => setSelectedVersion('remote')}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedVersion === 'remote'
                                            ? 'border-orange-500 bg-orange-500/10'
                                            : darkMode
                                                ? 'border-slate-700 hover:border-slate-600'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-lg">远程版本</h3>
                                        {selectedVersion === 'remote' && (
                                            <Check className="w-5 h-5 text-orange-500" />
                                        )}
                                    </div>
                                    <div className={`text-sm space-y-1 mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                        <p>版本: {conflict.remoteVersion.version}</p>
                                        <p>时间: {formatTimestamp(conflict.remoteVersion.timestamp)}</p>
                                        <p>设备: {conflict.remoteVersion.deviceId}</p>
                                    </div>
                                    <div className={`p-3 rounded-lg font-mono text-sm overflow-auto max-h-64 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
                                        }`}>
                                        <pre className="whitespace-pre-wrap break-words">
                                            {conflict.remoteVersion.content}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Custom Merge */
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <GitMerge className="w-5 h-5 text-orange-500" />
                                    <h3 className="font-bold">自定义合并内容</h3>
                                </div>
                                <textarea
                                    value={customContent}
                                    onChange={(e) => setCustomContent(e.target.value)}
                                    placeholder="在此输入合并后的内容..."
                                    className={`w-full h-96 p-4 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 ${darkMode
                                            ? 'bg-slate-900 border border-slate-700'
                                            : 'bg-slate-50 border border-slate-200'
                                        }`}
                                />
                                <div className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    <p>提示：你可以参考下面的版本内容进行合并</p>
                                </div>

                                {/* Reference Versions */}
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">本地版本参考</h4>
                                        <div className={`p-3 rounded-lg font-mono text-xs overflow-auto max-h-32 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
                                            }`}>
                                            <pre className="whitespace-pre-wrap break-words">
                                                {conflict.localVersion.content}
                                            </pre>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">远程版本参考</h4>
                                        <div className={`p-3 rounded-lg font-mono text-xs overflow-auto max-h-32 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'
                                            }`}>
                                            <pre className="whitespace-pre-wrap break-words">
                                                {conflict.remoteVersion.content}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`flex items-center justify-end gap-3 p-6 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'
                        }`}>
                        <button
                            onClick={onCancel}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${darkMode
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                                }`}
                        >
                            取消
                        </button>
                        <button
                            onClick={handleResolve}
                            disabled={
                                (resolutionMode === 'choose' && !selectedVersion) ||
                                (resolutionMode === 'custom' && !customContent)
                            }
                            className={`px-6 py-2 rounded-lg font-medium transition-all ${(resolutionMode === 'choose' && !selectedVersion) ||
                                    (resolutionMode === 'custom' && !customContent)
                                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30'
                                }`}
                        >
                            解决冲突
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConflictDialog;
