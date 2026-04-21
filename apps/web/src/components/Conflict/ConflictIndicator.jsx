import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * 冲突指示器
 * 显示在界面顶部，提示用户有待解决的冲突
 */
const ConflictIndicator = ({ conflictCount, onClick, darkMode = true }) => {
    if (conflictCount === 0) return null;

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-40 ${darkMode ? 'bg-orange-500/90' : 'bg-orange-500'
                } backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform`}
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span className="font-medium">
                    {conflictCount} 个冲突待解决
                </span>
                <span className="text-sm opacity-80">点击查看</span>
            </div>
        </motion.div>
    );
};

export default ConflictIndicator;
