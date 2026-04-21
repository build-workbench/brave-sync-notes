import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useStore';

/**
 * Keyboard shortcuts for the application
 *
 * Shortcuts:
 * - Ctrl/Cmd + S: Save (trigger sync)
 * - Ctrl/Cmd + B: Toggle sidebar
 * - Ctrl/Cmd + P: Toggle preview
 * - Ctrl/Cmd + H: Toggle history
 * - Ctrl/Cmd + N: New note
 * - Ctrl/Cmd + /: Toggle dark mode
 * - Escape: Close modals/dialogs
 */
export const useKeyboardShortcuts = () => {
  const {
    toggleSidebar,
    toggleDarkMode,
    setShowPreview,
    showPreview,
    setShowHistory,
    showHistory,
    addNote,
    note,
    status,
  } = useAppStore();

  const handleKeyDown = useCallback((event) => {
    // Check if we're in an input field
    const target = event.target;
    const isInput = target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable;

    // Meta key (Cmd on Mac, Ctrl on Windows)
    const isMeta = event.metaKey || event.ctrlKey;

    // Escape key - always handle
    if (event.key === 'Escape') {
      // Close any open modals/dialogs
      const store = useAppStore.getState();
      if (store.showHistory) {
        store.setShowHistory(false);
        return;
      }
      if (store.showQRCode) {
        store.setShowQRCode(false);
        return;
      }
      return;
    }

    // Don't handle other shortcuts when in input fields
    if (isInput) {
      return;
    }

    // Ctrl/Cmd + S: Save (prevent default and trigger sync indicator)
    if (isMeta && event.key === 's') {
      event.preventDefault();
      // Visual feedback that save is happening
      const store = useAppStore.getState();
      if (store.status === 'connected') {
        store.setStatus('syncing');
        setTimeout(() => {
          const currentStore = useAppStore.getState();
          if (currentStore.status === 'syncing') {
            currentStore.setStatus('connected');
          }
        }, 500);
      }
      return;
    }

    // Ctrl/Cmd + B: Toggle sidebar
    if (isMeta && event.key === 'b') {
      event.preventDefault();
      toggleSidebar();
      return;
    }

    // Ctrl/Cmd + P: Toggle preview
    if (isMeta && event.key === 'p') {
      event.preventDefault();
      setShowPreview(!showPreview);
      return;
    }

    // Ctrl/Cmd + H: Toggle history
    if (isMeta && event.key === 'h') {
      event.preventDefault();
      setShowHistory(!showHistory);
      return;
    }

    // Ctrl/Cmd + N: New note
    if (isMeta && event.key === 'n') {
      event.preventDefault();
      addNote({});
      return;
    }

    // Ctrl/Cmd + /: Toggle dark mode
    if (isMeta && event.key === '/') {
      event.preventDefault();
      toggleDarkMode();
      return;
    }
  }, [toggleSidebar, toggleDarkMode, setShowPreview, showPreview, setShowHistory, showHistory, addNote]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

/**
 * Component to display keyboard shortcuts help
 */
export const KeyboardShortcutsHelp = ({ lang }) => {
  const shortcuts = [
    { key: 'Ctrl/⌘ + S', action: lang === 'zh' ? '保存' : 'Save' },
    { key: 'Ctrl/⌘ + B', action: lang === 'zh' ? '切换侧边栏' : 'Toggle sidebar' },
    { key: 'Ctrl/⌘ + P', action: lang === 'zh' ? '切换预览' : 'Toggle preview' },
    { key: 'Ctrl/⌘ + H', action: lang === 'zh' ? '切换历史' : 'Toggle history' },
    { key: 'Ctrl/⌘ + N', action: lang === 'zh' ? '新建笔记' : 'New note' },
    { key: 'Ctrl/⌘ + /', action: lang === 'zh' ? '切换深色模式' : 'Toggle dark mode' },
    { key: 'Esc', action: lang === 'zh' ? '关闭弹窗' : 'Close dialogs' },
  ];

  return (
    <div className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 font-mono text-xs">
            {shortcut.key}
          </kbd>
          <span className="text-slate-600 dark:text-slate-400">{shortcut.action}</span>
        </div>
      ))}
    </div>
  );
};

export default useKeyboardShortcuts;
