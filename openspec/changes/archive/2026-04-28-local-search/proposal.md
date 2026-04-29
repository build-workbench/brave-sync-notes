# Proposal: Local Search

## Problem

Users cannot search their notes by content. The current interface shows only the notebook/note list without full-text search. To find a note about "encryption keys", users must manually browse through all notebooks and notes.

Implementing search on the server side would:
- Expose note content to the server (breaks E2E encryption)
- Require indexing infrastructure
- Create privacy concerns

## Solution

Implement **client-side search** using **Transformers.js** (ONNX neural networks in the browser):

1. **Full-text search** - Index all note content locally
2. **Semantic search** - Find notes by meaning, not just keywords (optional)
3. **Zero privacy** - All processing happens in the browser
4. **No server calls** - Instant search results

Transformers.js provides pre-trained models that run 100% in the browser without server calls.

## Why Now

- Multi-notebook gives us clear note scope to search within
- Search is a core UX feature that builds on stable storage/sync
- Library is mature and widely used (Hugging Face)

## Scope

- Full-text search index built on app startup from stored notes
- Search input field in sidebar
- Results show note preview + notebook name
- Incrementally update index when notes change
- Optionally add semantic search (embedding-based)

## Out of Scope

- Server-side search integration
- Search history or saved searches
- Advanced query syntax (defer to v2)
- Real-time collaborative search awareness
