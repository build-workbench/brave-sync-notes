import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useStore';
import debounce from 'lodash.debounce';

/**
 * 自动保存 Hook
 * 监听笔记变化并自动保存到存储
 *
 * 替代之前的模块级 autoSaveCallback 模式，
 * 使自动保存行为更加显式和可测试
 */
export const useAutoSave = ({ storage, enabled = true, delay = 300 }) => {
  const autoSaveEnabled = useAppStore((state) => state.autoSave);
  const activeNoteId = useAppStore((state) => state.activeNoteId);
  const activeNotebookId = useAppStore((state) => state.activeNotebookId);
  const note = useAppStore((state) => state.note);
  const noteVersion = useAppStore((state) => state.noteVersion);
  const storageInitialized = useAppStore((state) => state.storageInitialized);

  // Track last saved state to avoid unnecessary saves
  const lastSavedRef = useRef({
    content: null,
    version: null,
    timestamp: 0,
  });

  // Debounced save function
  const debouncedSaveRef = useRef(
    debounce(async (data) => {
      if (!storage || !data.notebookId || !data.noteId) {
        return;
      }

      // Skip if content hasn't changed
      if (
        lastSavedRef.current.content === data.content &&
        lastSavedRef.current.version === data.version
      ) {
        return;
      }

      try {
        await storage.saveNote(data.notebookId, {
          id: data.noteId,
          content: data.content,
          version: data.version,
          updatedAt: data.updatedAt,
        });

        lastSavedRef.current = {
          content: data.content,
          version: data.version,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error('Auto-save failed:', error);
        throw error;
      }
    }, delay)
  );

  // Trigger auto-save when note changes
  const triggerAutoSave = useCallback(() => {
    if (!enabled || !autoSaveEnabled || !activeNoteId || !storageInitialized) {
      return;
    }

    debouncedSaveRef.current({
      notebookId: activeNotebookId,
      noteId: activeNoteId,
      content: note,
      version: noteVersion,
      updatedAt: Date.now(),
    });
  }, [enabled, autoSaveEnabled, activeNoteId, activeNotebookId, note, noteVersion, storageInitialized]);

  // Watch for note changes
  useEffect(() => {
    triggerAutoSave();
  }, [triggerAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    const debouncedSave = debouncedSaveRef.current;
    return () => {
      debouncedSave.cancel();
    };
  }, []);

  // Manual save function (flushes pending debounced save)
  const saveNow = useCallback(async () => {
    debouncedSaveRef.current.flush();

    if (!enabled || !autoSaveEnabled || !activeNoteId || !storageInitialized) {
      return;
    }

    const data = {
      notebookId: activeNotebookId,
      noteId: activeNoteId,
      content: note,
      version: noteVersion,
      updatedAt: Date.now(),
    };

    try {
      await storage.saveNote(data.notebookId, {
        id: data.noteId,
        content: data.content,
        version: data.version,
        updatedAt: data.updatedAt,
      });

      lastSavedRef.current = {
        content: data.content,
        version: data.version,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    }
  }, [enabled, autoSaveEnabled, activeNoteId, activeNotebookId, note, noteVersion, storageInitialized, storage]);

  return {
    triggerAutoSave,
    saveNow,
  };
};

export default useAutoSave;
