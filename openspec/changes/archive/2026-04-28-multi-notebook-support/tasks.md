## 1. Data model and migration

- [x] 1.1 Add notebook sync metadata generation and storage fields so newly created notebooks include mnemonic, roomId, and encryptionKey.
- [x] 1.2 Implement startup hydration that loads notebooks and notes from client storage into the in-memory store.
- [x] 1.3 Implement one-time migration from legacy single-chain state into a default notebook and first note.
- [x] 1.4 Persist notebook and note collections or ensure they are reconstructed consistently from storage on reload.

## 2. Store and application flow

- [x] 2.1 Update Zustand notebook and note actions to preserve active notebook / active note consistency during CRUD flows.
- [x] 2.2 Wire app initialization to restore notebook state before rendering notebook-aware interactions.
- [x] 2.3 Update notebook switching flow so the editor content and active note are refreshed from the selected notebook.

## 3. UI integration

- [x] 3.1 Integrate the existing `NoteList` notebook/note navigation surface into the main app layout.
- [x] 3.2 Update sidebar or adjacent navigation so QR output and notebook metadata reflect the active notebook.
- [x] 3.3 Implement notebook create, rename, delete, and select flows with user-visible confirmations and empty-state handling.
- [x] 3.4 Ensure note create, rename, delete, and select flows operate within the active notebook only.

## 4. Sync-context handling

- [x] 4.1 Update the socket/notebook integration so the active notebook determines the joined sync chain.
- [x] 4.2 Ensure notebook creation generates a notebook-scoped mnemonic and that notebook switching disconnects and rejoins the correct room.
- [x] 4.3 Request fresh sync state when entering a notebook and prevent stale content from the previous notebook from remaining in the editor.

## 5. Validation and specification updates

- [x] 5.1 Add or update tests for notebook CRUD, notebook isolation, startup restoration, and notebook-switch consistency.
- [x] 5.2 Update any user-facing documentation or spec deltas if implementation decisions require clarification.
- [x] 5.3 Run the existing project lint, test, and build commands after the change is implemented.
