# Proposal: Yjs Collaboration Framework

## Problem

The current multi-notebook implementation provides basic note storage and sync, but lacks **real-time collaborative editing** and robust **conflict resolution**. When multiple devices edit the same note simultaneously, the current whole-document sync model cannot preserve partial edits or provide fine-grained conflict detection.

Users on the same notebook want to see:
- Real-time cursor positions from collaborators
- Awareness of who is editing which note
- Automatic conflict-free merging of simultaneous edits
- No manual conflict resolution needed for concurrent changes

## Solution

Integrate **Yjs** (a high-performance CRDT library) to provide:

1. **Character-level awareness** - Track cursor/selection per device
2. **Automatic conflict-free merging** - CRDT-based operations ensure causality
3. **Incremental sync** - Only sync changes, not full documents
4. **Performance optimization** - Smaller payloads, lower latency

## Why First

- Multi-notebook gives us the routing infrastructure (per-notebook rooms)
- Yjs is battle-tested in Figma, Notion, and JupyterHub
- Solves the last critical gap: concurrent edit handling
- Foundation for multi-user notebooks

## Scope

- Integrate Yjs on client-side (y-indexeddb for persistence)
- Create Y.Text binding for CodeMirror editor
- Wire Yjs updates into existing Socket.IO sync chain
- Preserve existing conflict resolution UI for non-resolvable conflicts (rare)

## Out of Scope

- Server-side CRDT state management (clients resolve conflicts)
- Multi-user cursors UI (implement in future change)
- Shared awareness channel (implement in future change)
