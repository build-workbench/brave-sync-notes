import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  FolderOpen,
  Search,
  MoreHorizontal,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { SearchIndexProvider, useSearch } from '../Search/SearchIndexProvider';

/**
 * NoteListInner Component
 * Internal component that uses search context
 */
const NoteListInner = () => {
  const {
    darkMode,
    lang,
    notes,
    activeNoteId,
    notebooks,
    activeNotebookId,
    addNote,
    updateNote,
    removeNote,
    setActiveNoteId,
    addNotebook,
    updateNotebook,
    removeNotebook,
    setActiveNotebookId,
  } = useAppStore();

  const { searchResults, isSearching, search, clearSearch } = useSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showNotebookMenu, setShowNotebookMenu] = useState(false);
  const [editingNotebookId, setEditingNotebookId] = useState(null);
  const [editingNotebookName, setEditingNotebookName] = useState('');

  // Handle search input with debounce
  const handleSearchChange = useCallback(
    (e) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (query.trim()) {
        search(query);
      } else {
        clearSearch();
      }
    },
    [search, clearSearch]
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    clearSearch();
  }, [clearSearch]);

  // Filter notes based on search query and active notebook
  const filteredNotes = useMemo(() => {
    if (!activeNotebookId) {
      return [];
    }

    // If there's a search query and search results, use them
    if (searchQuery.trim() && searchResults.length > 0) {
      // Filter search results to current notebook
      const notebookResults = searchResults.filter(
        (result) => result.notebookId === activeNotebookId
      );

      // Convert search results to notes format
      const resultNoteIds = new Set(notebookResults.map((r) => r.noteId));
      const matchedNotes = notes.filter(
        (note) => resultNoteIds.has(note.id) && note.notebookId === activeNotebookId
      );

      // Sort by last updated
      return matchedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    // Otherwise, filter notes normally
    let result = notes.filter((note) => note.notebookId === activeNotebookId);

    // Filter by simple search query (fallback)
    if (searchQuery.trim() && searchResults.length === 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Sort by last updated
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, activeNotebookId, searchQuery, searchResults]);

  // Get notes count per notebook
  const notebookNoteCounts = useMemo(() => {
    const counts = {};
    notes.forEach((note) => {
      counts[note.notebookId] = (counts[note.notebookId] || 0) + 1;
    });
    return counts;
  }, [notes]);

  // Handle creating a new note
  const handleAddNote = () => {
    if (!activeNotebookId) {
      return;
    }

    addNote({
      title: lang === 'zh' ? '新笔记' : 'New Note',
      content: '',
      notebookId: activeNotebookId,
    });
  };

  // Handle note title edit
  const handleStartEditTitle = (note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
  };

  const handleSaveTitle = (noteId) => {
    if (editingTitle.trim()) {
      updateNote(noteId, { title: editingTitle.trim() });
    }
    setEditingNoteId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingTitle('');
  };

  // Handle note deletion
  const handleDeleteNote = (noteId) => {
    if (window.confirm(lang === 'zh' ? '确定要删除这个笔记吗？' : 'Are you sure you want to delete this note?')) {
      removeNote(noteId);
    }
  };

  // Handle notebook operations
  const handleAddNotebook = () => {
    addNotebook({
      name: lang === 'zh' ? '新笔记本' : 'New Notebook',
    });
    setShowNotebookMenu(false);
  };

  const handleStartEditNotebook = (notebook) => {
    setEditingNotebookId(notebook.id);
    setEditingNotebookName(notebook.name);
    setShowNotebookMenu(false);
  };

  const handleSaveNotebookName = (notebookId) => {
    if (editingNotebookName.trim()) {
      updateNotebook(notebookId, { name: editingNotebookName.trim() });
    }
    setEditingNotebookId(null);
    setEditingNotebookName('');
  };

  const handleDeleteNotebook = (notebookId) => {
    const noteCount = notebookNoteCounts[notebookId] || 0;
    const confirmMsg = lang === 'zh'
      ? `确定要删除这个笔记本吗？这将删除 ${noteCount} 个笔记。`
      : `Are you sure? This will delete ${noteCount} note(s).`;

    if (window.confirm(confirmMsg)) {
      removeNotebook(notebookId);
    }
    setShowNotebookMenu(false);
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (lang === 'zh') {
      if (minutes < 1) return '刚刚';
      if (minutes < 60) return `${minutes} 分钟前`;
      if (hours < 24) return `${hours} 小时前`;
      return `${days} 天前`;
    } else {
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
  };

  // Truncate content for preview
  const truncateContent = (content, maxLength = 50) => {
    if (!content) return '';
    const stripped = content.replace(/[#*_`[\]]/g, '').trim();
    return stripped.length > maxLength
      ? stripped.substring(0, maxLength) + '...'
      : stripped;
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Search Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          />
          <input
            type="text"
            placeholder={lang === 'zh' ? '搜索笔记...' : 'Search notes...'}
            value={searchQuery}
            onChange={handleSearchChange}
            className={`w-full pl-9 pr-16 py-2 rounded-lg text-sm transition-all ${
              darkMode
                ? 'bg-slate-700 text-white placeholder-slate-400 focus:bg-slate-600'
                : 'bg-slate-100 text-slate-900 placeholder-slate-500 focus:bg-white'
            } focus:outline-none focus:ring-2 focus:ring-orange-500`}
          />
          {/* Search Status */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching && (
              <Loader2 size={14} className="animate-spin text-slate-400" />
            )}
            {!isSearching && searchQuery.trim() && searchResults.length > 0 && (
              <span className="text-xs text-slate-400">
                {searchResults.length}
              </span>
            )}
            {searchQuery.trim() && (
              <button
                onClick={handleClearSearch}
                className={`p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notebooks Section */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs font-semibold uppercase ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {lang === 'zh' ? '笔记本' : 'Notebooks'}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowNotebookMenu(!showNotebookMenu)}
              className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <MoreHorizontal size={14} />
            </button>

            {/* Notebook Menu Dropdown */}
            <AnimatePresence>
              {showNotebookMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute right-0 top-6 z-10 w-40 rounded-lg shadow-lg ${
                    darkMode ? 'bg-slate-700' : 'bg-white border border-slate-200'
                  }`}
                >
                  <button
                    onClick={handleAddNotebook}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                      darkMode
                        ? 'text-slate-200 hover:bg-slate-600'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Plus size={14} />
                    {lang === 'zh' ? '新建笔记本' : 'New Notebook'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Notebook List */}
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {notebooks.map((notebook) => (
            <div
              key={notebook.id}
              className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                activeNotebookId === notebook.id
                  ? 'bg-orange-500 text-white'
                  : darkMode
                  ? 'text-slate-200 hover:bg-slate-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {editingNotebookId === notebook.id ? (
                <input
                  type="text"
                  value={editingNotebookName}
                  onChange={(e) => setEditingNotebookName(e.target.value)}
                  onBlur={() => handleSaveNotebookName(notebook.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNotebookName(notebook.id);
                    if (e.key === 'Escape') {
                      setEditingNotebookId(null);
                      setEditingNotebookName('');
                    }
                  }}
                  className={`flex-1 px-1 py-0.5 rounded text-sm ${
                    darkMode ? 'bg-slate-600 text-white' : 'bg-white text-slate-900'
                  }`}
                  autoFocus
                />
              ) : (
                <>
                  <button
                    onClick={() => setActiveNotebookId(notebook.id)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <FolderOpen size={14} />
                    <span className="truncate">{notebook.name}</span>
                    <span
                      className={`ml-auto text-xs ${
                        activeNotebookId === notebook.id
                          ? 'text-white/70'
                          : darkMode
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {notebookNoteCounts[notebook.id] || 0}
                    </span>
                  </button>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => handleStartEditNotebook(notebook)}
                      className={`p-0.5 rounded ${
                        darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'
                      }`}
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteNotebook(notebook.id)}
                      className={`p-0.5 rounded ${
                        darkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'
                      }`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-semibold uppercase ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {lang === 'zh' ? '笔记' : 'Notes'}
            </span>
            <button
              onClick={handleAddNote}
              disabled={!activeNotebookId}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus size={12} />
              {lang === 'zh' ? '新建' : 'New'}
            </button>
          </div>

          {/* Note Items */}
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {filteredNotes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-center py-8 ${
                    darkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {notebooks.length === 0
                      ? lang === 'zh'
                        ? '先创建一个笔记本'
                        : 'Create your first notebook'
                      : !activeNotebookId
                      ? lang === 'zh'
                        ? '请选择一个笔记本'
                        : 'Select a notebook'
                      : searchQuery
                      ? lang === 'zh'
                        ? '未找到匹配的笔记'
                        : 'No matching notes found'
                      : lang === 'zh'
                      ? '还没有笔记'
                      : 'No notes yet'}
                  </p>
                </motion.div>
              ) : (
                filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`group relative rounded-lg p-2 cursor-pointer transition-colors ${
                      activeNoteId === note.id
                        ? 'bg-orange-500 text-white'
                        : darkMode
                        ? 'hover:bg-slate-700 text-slate-200'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    onClick={() => setActiveNoteId(note.id)}
                  >
                    {editingNoteId === note.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(note.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle(note.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className={`w-full px-1 py-0.5 rounded text-sm ${
                          darkMode ? 'bg-slate-600 text-white' : 'bg-white text-slate-900'
                        }`}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{note.title}</h4>
                            <p
                              className={`text-xs mt-0.5 truncate ${
                                activeNoteId === note.id
                                  ? 'text-white/70'
                                  : darkMode
                                  ? 'text-slate-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {truncateContent(note.content)}
                            </p>
                          </div>
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditTitle(note);
                              }}
                              className={`p-1 rounded ${
                                activeNoteId === note.id
                                  ? 'hover:bg-white/20'
                                  : darkMode
                                  ? 'hover:bg-slate-600'
                                  : 'hover:bg-slate-200'
                              }`}
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                              className={`p-1 rounded ${
                                activeNoteId === note.id
                                  ? 'hover:bg-white/20'
                                  : darkMode
                                  ? 'hover:bg-slate-600'
                                  : 'hover:bg-slate-200'
                              }`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs ${
                            activeNoteId === note.id
                              ? 'text-white/50'
                              : darkMode
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          <Clock size={10} />
                          <span>{formatRelativeTime(note.updatedAt)}</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * NoteList Component
 * Main export with SearchIndexProvider wrapper
 */
const NoteList = () => {
  const notes = useAppStore((state) => state.notes);

  return (
    <SearchIndexProvider notes={notes}>
      <NoteListInner />
    </SearchIndexProvider>
  );
};

export default NoteList;
