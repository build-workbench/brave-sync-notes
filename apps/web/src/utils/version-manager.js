/**
 * Version snapshot management for note history
 */

class VersionManager {
  constructor(notebookId, maxSnapshots = 50) {
    this.notebookId = notebookId;
    this.maxSnapshots = maxSnapshots;
    this.snapshots = new Map(); // noteId -> Array of snapshots
  }

  /**
   * Create a snapshot of a note
   */
  createSnapshot(noteId, content, description = null) {
    if (!this.snapshots.has(noteId)) {
      this.snapshots.set(noteId, []);
    }

    const snapshot = {
      id: `snap-${noteId}-${Date.now()}`,
      noteId,
      content,
      description,
      timestamp: Date.now(),
      size: this.estimateSize(content),
    };

    const noteSnapshots = this.snapshots.get(noteId);
    noteSnapshots.push(snapshot);

    // Keep only maxSnapshots
    if (noteSnapshots.length > this.maxSnapshots) {
      noteSnapshots.shift(); // Remove oldest
    }

    return snapshot.id;
  }

  /**
   * Get all snapshots for a note
   */
  getSnapshots(noteId) {
    return this.snapshots.get(noteId) || [];
  }

  /**
   * Get a specific snapshot
   */
  getSnapshot(snapshotId) {
    for (const snapshots of this.snapshots.values()) {
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      if (snapshot) return snapshot;
    }
    return null;
  }

  /**
   * Restore a note from a snapshot
   */
  restoreSnapshot(snapshotId) {
    const snapshot = this.getSnapshot(snapshotId);
    if (!snapshot) return null;

    return {
      noteId: snapshot.noteId,
      content: snapshot.content,
      restoredAt: Date.now(),
    };
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId) {
    for (const snapshots of this.snapshots.values()) {
      const index = snapshots.findIndex((s) => s.id === snapshotId);
      if (index >= 0) {
        snapshots.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Delete all snapshots for a note
   */
  deleteNoteSnapshots(noteId) {
    this.snapshots.delete(noteId);
  }

  /**
   * Get diff between two snapshots (simple character count change)
   */
  getDiff(snapshotId1, snapshotId2) {
    const snap1 = this.getSnapshot(snapshotId1);
    const snap2 = this.getSnapshot(snapshotId2);

    if (!snap1 || !snap2) return null;

    const len1 = snap1.content.length;
    const len2 = snap2.content.length;
    const added = Math.max(0, len2 - len1);
    const removed = Math.max(0, len1 - len2);

    return {
      from: snap1.timestamp,
      to: snap2.timestamp,
      added,
      removed,
      percentChange: len1 > 0 ? ((len2 - len1) / len1 * 100).toFixed(1) : 0,
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    let totalSnapshots = 0;
    let totalSize = 0;

    for (const snapshots of this.snapshots.values()) {
      totalSnapshots += snapshots.length;
      totalSize += snapshots.reduce((sum, s) => sum + (s.size || 0), 0);
    }

    return {
      noteCount: this.snapshots.size,
      totalSnapshots,
      totalSize,
      averageSnapshotSize: totalSnapshots > 0 ? Math.round(totalSize / totalSnapshots) : 0,
    };
  }

  /**
   * Estimate content size in bytes
   */
  estimateSize(content) {
    return new Blob([content]).size;
  }

  /**
   * Clear all snapshots
   */
  clear() {
    this.snapshots.clear();
  }

  /**
   * Export snapshots (for backup)
   */
  export() {
    const data = {};
    for (const [noteId, snapshots] of this.snapshots) {
      data[noteId] = snapshots;
    }
    return {
      notebookId: this.notebookId,
      exportedAt: Date.now(),
      snapshots: data,
    };
  }

  /**
   * Import snapshots (for restore)
   */
  import(data) {
    if (!data.snapshots) return false;

    for (const [noteId, snapshots] of Object.entries(data.snapshots)) {
      this.snapshots.set(noteId, snapshots);
    }
    return true;
  }
}

export default VersionManager;
