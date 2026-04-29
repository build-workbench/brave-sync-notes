/**
 * Yjs CRDT integration for real-time collaborative editing
 */
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

class YjsManager {
  constructor(notebookId, noteId) {
    this.notebookId = notebookId;
    this.noteId = noteId;
    this.docName = `notebook-${notebookId}-note-${noteId}`;
    this.doc = null;
    this.provider = null;
    this.yText = null;
  }

  /**
   * Initialize Yjs document and persistence
   */
  async init() {
    // Create or load Y.Doc
    this.doc = new Y.Doc();
    
    // Try to create IndexedDB persistence provider
    // In tests or unsupported environments, skip persistence
    try {
      if (typeof window !== 'undefined' && window.indexedDB) {
        this.provider = new IndexeddbPersistence(this.docName, this.doc);
      }
    } catch (err) {
      // IndexedDB not available in test environment; using in-memory doc only
    }
    
    // Create Y.Text for note content
    this.yText = this.doc.getText('content');
    
    // Wait for provider to load from IndexedDB (if available)
    if (this.provider) {
      return new Promise((resolve) => {
        this.provider.once('synced', () => {
          resolve(this.yText.toString());
        });
        // Timeout after 5s if sync doesn't complete
        setTimeout(() => resolve(this.yText.toString()), 5000);
      });
    }
    
    // Return immediately if no provider
    return this.yText.toString();
  }

  /**
   * Get current content
   */
  getContent() {
    return this.yText?.toString() || '';
  }

  /**
   * Apply a change to the Y.Text
   */
  applyChange(change) {
    if (!this.yText) return;
    
    // Insert or replace content
    this.doc.transact(() => {
      const { index, delete: deleteLen, insert } = change;
      if (deleteLen > 0) {
        this.yText.delete(index, deleteLen);
      }
      if (insert) {
        this.yText.insert(index, insert);
      }
    });
  }

  /**
   * Get Yjs update bytes for sync
   */
  getUpdateBytes() {
    if (!this.doc) return new Uint8Array();
    return Y.encodeStateAsUpdate(this.doc);
  }

  /**
   * Apply received Yjs update
   */
  applyUpdate(updateBytes) {
    if (!this.doc || !updateBytes) return;
    Y.applyUpdate(this.doc, updateBytes);
  }

  /**
   * Get a snapshot of current state
   */
  getSnapshot() {
    if (!this.doc) return null;
    return {
      content: this.yText?.toString() || '',
      state: Y.encodeStateAsUpdate(this.doc),
      timestamp: Date.now(),
    };
  }

  /**
   * Restore from a snapshot
   */
  restoreSnapshot(snapshot) {
    if (!this.doc || !snapshot.state) return;
    // Create new doc from snapshot state
    const newDoc = new Y.Doc();
    Y.applyUpdate(newDoc, snapshot.state);
    this.doc = newDoc;
    this.yText = newDoc.getText('content');
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.provider) {
      this.provider.destroy();
    }
    if (this.doc) {
      this.doc.destroy();
    }
    this.yText = null;
  }

  /**
   * Watch for changes
   */
  onChange(callback) {
    if (!this.doc) return;
    
    const observer = (update, origin) => {
      // Ignore local updates
      if (origin === 'local') return;
      callback(this.yText.toString());
    };
    
    this.doc.on('update', observer);
    
    return () => {
      this.doc.off('update', observer);
    };
  }
}

export default YjsManager;
