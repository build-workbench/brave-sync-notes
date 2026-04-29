## Context

The stable product and capability specs already define multi-notebook behavior, including notebook CRUD, notebook isolation, per-notebook sync identity, and QR-based sharing metadata. The current codebase only partially supports this: the Zustand store has notebook and note relationships, `NoteList.jsx` already consumes notebook-aware store actions, and `useStorage.js` exposes notebook CRUD APIs, but app initialization, persistence restoration, and sync switching are not wired together. Sidebar navigation is still centered on the single global chain view, and persisted Zustand state does not currently retain notebook or note collections across reloads.

This change crosses multiple client modules (`App.jsx`, store, sidebar, note list, storage integration, and socket flow), touches sync behavior, and must preserve existing single-chain users without data loss. That makes a design document useful before implementation.

## Goals / Non-Goals

**Goals:**
- Deliver notebook CRUD, notebook-aware note management, and active notebook switching through the existing UI.
- Persist notebooks, notes, and active selection in the client storage layer and restore them on startup.
- Give each notebook its own sync identity (mnemonic, roomId, encryptionKey) in a way that matches Requirement 3 and the multi-notebook capability spec.
- Ensure switching notebooks updates the active sync context without leaving the app in an inconsistent state.
- Preserve existing single-chain users by migrating their current note and mnemonic into a default notebook.

**Non-Goals:**
- Background synchronization for multiple notebooks at once.
- Nested notebooks, notebook templates, or cross-user sharing workflows beyond QR-exportable notebook metadata.
- Search/history redesign outside the minimum updates needed to keep notebook scoping correct.
- Server-side schema changes for notebook metadata storage; notebook metadata remains client-side.

## Decisions

### 1. Treat each notebook as a notebook-scoped sync context

**Decision:** Each notebook will own its own `mnemonic`, derived `roomId`, and `encryptionKey`, and the active notebook determines the active WebSocket room.

**Why:** This matches the product spec, the existing capability spec, and the client-side schema definitions for notebook metadata. It also keeps notebook isolation explicit rather than trying to multiplex multiple notebooks through one shared room.

**Alternatives considered:**
- **Single global sync chain with notebook IDs inside payloads:** easier to wire short-term, but conflicts with current specs and weakens notebook isolation.
- **Multiple concurrent notebook sockets:** supports background sync, but adds state complexity and is not needed for the first delivery.

### 2. Migrate current single-chain state into a default notebook on first load

**Decision:** On initialization, if notebook records do not exist but legacy single-note / single-chain state exists, create a default notebook using the current mnemonic and attach the current note/history state to it.

**Why:** This preserves existing users' data and avoids a breaking reset. It also gives a clean bridge from the current global-store model to notebook-scoped state.

**Alternatives considered:**
- **Hard reset into a new notebook model:** simplest code path, but unacceptable data loss risk.
- **Keep legacy mode indefinitely alongside notebook mode:** increases long-term complexity and duplicates logic.

### 3. Make storage the source of truth for notebook restoration

**Decision:** `useStorage` / `StorageManager` will be used to load notebooks and notes during app startup, while Zustand remains the in-memory working state.

**Why:** Notebook and note persistence APIs already exist there, and this keeps startup restoration consistent with the local-first design.

**Alternatives considered:**
- **Persist notebook/note collections only through Zustand middleware:** easier for small UI state, but insufficient for structured notebook/note storage and conflicts with the existing storage abstraction.

### 4. Keep the notebook UI in the existing left navigation surface

**Decision:** Notebook navigation and note list management will live in the existing left-side navigation experience, using `Sidebar` for sync-chain/device/history controls and `NoteList` as the notebook/note management surface.

**Why:** `NoteList.jsx` is already implemented around notebook-aware interactions, so integrating it is lower-risk than redesigning Sidebar into a multi-purpose panel in this change.

**Alternatives considered:**
- **Expand Sidebar to also own notebook CRUD:** possible, but it overloads a component already focused on sync-chain metadata and history.
- **Create a new independent notebook pane:** more flexible, but larger UX churn for the first delivery.

### 5. Scope QR output to the active notebook's mnemonic

**Decision:** QR export should use the active notebook's mnemonic/metadata, not a global chain mnemonic.

**Why:** The product spec defines notebook sharing in notebook terms. Reusing the existing QR affordance with notebook-scoped data is the smallest path that preserves the intended behavior.

**Alternatives considered:**
- **Keep QR tied to the global mnemonic for now:** inconsistent with notebook-scoped sync.
- **Defer QR entirely:** reduces scope, but leaves Requirement 3 incomplete.

### 6. Request fresh sync after notebook join and clear state when no notebook remains

**Decision:** Switching to a notebook requests fresh sync after the new room join completes. Deleting the last notebook clears the active note and mnemonic until the user creates or imports another notebook.

**Why:** Requesting sync after successful join keeps the newly selected notebook from showing stale editor content. Clearing active state after the last notebook is removed avoids silently inventing replacement data and keeps deletion semantics explicit.

**Alternatives considered:**
- **Join without an immediate sync request:** risks showing stale editor content from the previous notebook.
- **Auto-create a replacement default notebook:** keeps the UI non-empty, but conflicts with the user's explicit delete action.

## Risks / Trade-offs

- **[Migration complexity]** Legacy global state may be partially populated or inconsistent → **Mitigation:** create a one-time migration path with explicit guards and fallback defaults.
- **[Sync switching regressions]** Notebook switches can race with pending socket events → **Mitigation:** centralize notebook switch flow, disconnect old room before joining the new room, and restore local note state only after active notebook changes are committed.
- **[Persistence duplication]** Zustand and storage can diverge if writes are not ordered → **Mitigation:** make storage writes explicit in notebook/note flows and use startup hydration from storage as the authoritative reload path.
- **[Scope growth]** Notebook-specific sync identity introduces more work than simple notebook CRUD → **Mitigation:** keep background sync, advanced sharing, and cross-notebook workflows out of this first change.

## Migration Plan

1. Detect whether notebook records already exist in storage.
2. If not, inspect legacy in-memory / persisted single-note state.
3. Create a default notebook from the current mnemonic/device context.
4. Persist the current note as the first note in that notebook.
5. Mark the migrated notebook and note as active.
6. On failure, preserve legacy state in memory and surface an error rather than deleting data.

Rollback strategy:
- Code rollback is safe because notebook metadata remains client-side and legacy server protocol is unchanged.
- If migration introduces issues, retain notebook records and legacy fallback guards so users can still access the migrated default notebook data after rollback.

## Open Questions

- None for the currently implemented scope.
