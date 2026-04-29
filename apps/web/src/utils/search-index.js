/**
 * Local full-text search index for notes
 */

class SearchIndex {
  constructor() {
    // Map<term, Set<noteId>>
    this.index = new Map();
    this.noteMetadata = new Map(); // noteId -> { title, content, notebookId }
  }

  /**
   * Index a single note
   */
  indexNote(noteId, title, content, notebookId) {
    // Store metadata
    this.noteMetadata.set(noteId, { title, content, notebookId });

    // Tokenize and index
    const text = `${title} ${content}`.toLowerCase();
    const tokens = text.match(/\b\w+\b/g) || [];
    const uniqueTokens = new Set(tokens);

    uniqueTokens.forEach((token) => {
      if (!this.index.has(token)) {
        this.index.set(token, new Set());
      }
      this.index.get(token).add(noteId);
    });
  }

  /**
   * Remove note from index
   */
  removeNote(noteId) {
    this.noteMetadata.delete(noteId);

    // Remove from all token sets
    this.index.forEach((noteIds) => {
      noteIds.delete(noteId);
    });

    // Clean up empty token entries
    for (const [token, noteIds] of this.index) {
      if (noteIds.size === 0) {
        this.index.delete(token);
      }
    }
  }

  /**
   * Search for a query
   * Returns array of { noteId, title, snippet, notebookId }
   */
  search(query, limit = 10) {
    if (!query || query.trim() === '') {
      return [];
    }

    const queryTokens = query.toLowerCase().match(/\b\w+\b/g) || [];
    if (queryTokens.length === 0) return [];

    // Find notes matching all query tokens
    let results = null;
    for (const token of queryTokens) {
      const matchingNotes = this.index.get(token) || new Set();
      if (results === null) {
        results = new Set(matchingNotes);
      } else {
        // Intersection: keep only notes that match all tokens
        results = new Set([...results].filter((n) => matchingNotes.has(n)));
      }
    }

    if (!results || results.size === 0) return [];

    // Convert to array and add metadata
    const searchResults = [...results]
      .map((noteId) => {
        const metadata = this.noteMetadata.get(noteId);
        if (!metadata) return null;

        // Create snippet (first 100 chars of content)
        const snippet = metadata.content.substring(0, 100).trim();
        const hasMore = metadata.content.length > 100;

        return {
          noteId,
          title: metadata.title,
          snippet: hasMore ? `${snippet}...` : snippet,
          notebookId: metadata.notebookId,
        };
      })
      .filter(Boolean)
      .slice(0, limit);

    return searchResults;
  }

  /**
   * Clear entire index
   */
  clear() {
    this.index.clear();
    this.noteMetadata.clear();
  }

  /**
   * Get index statistics
   */
  getStats() {
    return {
      tokenCount: this.index.size,
      noteCount: this.noteMetadata.size,
      totalIndexSize: this.index.size * 50, // Rough estimate
    };
  }
}

export default SearchIndex;
