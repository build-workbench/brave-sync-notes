import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import SearchIndex from '../../utils/search-index';
import { debounce } from '../../utils/debounce';

/**
 * Search Context
 */
const SearchContext = createContext(null);

/**
 * Search Index Provider
 * Initializes and manages SearchIndex instance for the app
 */
export function SearchIndexProvider({ children, notes }) {
  const [searchIndex, setSearchIndex] = useState(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Track indexed note IDs to avoid re-indexing
  const indexedNoteIdsRef = useRef(new Set());

  // Initialize search index
  useEffect(() => {
    const index = new SearchIndex();
    const indexedIds = new Set();

    setSearchIndex(index);

    return () => {
      // Cleanup
      index.clear();
      indexedIds.clear();
    };
  }, []);

  // Update index when notes change
  useEffect(() => {
    if (!searchIndex || !notes) {
      return;
    }

    const updateIndex = async () => {
      setIsIndexing(true);

      try {
        // Find notes to add (new notes)
        const notesToAdd = notes.filter(
          (note) => !indexedNoteIdsRef.current.has(note.id)
        );

        // Find notes to remove (deleted notes)
        const currentNoteIds = new Set(notes.map((n) => n.id));
        const notesToRemove = Array.from(indexedNoteIdsRef.current).filter(
          (id) => !currentNoteIds.has(id)
        );

        // Add new notes to index
        for (const note of notesToAdd) {
          searchIndex.indexNote(
            note.id,
            note.title || '',
            note.content || '',
            note.notebookId
          );
          indexedNoteIdsRef.current.add(note.id);
        }

        // Remove deleted notes from index
        for (const noteId of notesToRemove) {
          searchIndex.removeNote(noteId);
          indexedNoteIdsRef.current.delete(noteId);
        }
      } catch (error) {
        console.error('Failed to update search index:', error);
      } finally {
        setIsIndexing(false);
      }
    };

    updateIndex();
  }, [searchIndex, notes]);

  // Debounced search function
  const debouncedSearchRef = useRef(
    debounce((query) => {
      if (!searchIndex || !query || query.trim() === '') {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const results = searchIndex.search(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  );

  // Search function
  const search = useCallback((query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    debouncedSearchRef.current(query);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  // Context value
  const value = {
    searchIndex,
    searchResults,
    isIndexing,
    isSearching,
    search,
    clearSearch,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

/**
 * Hook to access search context
 * @returns {Object} Search context value
 */
export function useSearch() {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error('useSearch must be used within SearchIndexProvider');
  }

  return context;
}

export default SearchIndexProvider;
