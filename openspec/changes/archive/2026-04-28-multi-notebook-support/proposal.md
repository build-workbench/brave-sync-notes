## Why

The product specs already define multi-notebook support as a core user capability, but the current implementation only partially wires the necessary state, storage, and UI pieces together. Users cannot yet manage notebooks end-to-end in a way that matches the documented behavior around notebook isolation, notebook switching, and notebook-backed note organization.

## What Changes

- Implement notebook CRUD and active-notebook selection as a first-class user flow.
- Connect notebook-aware note management to the existing Zustand store and storage layer.
- Restore notebooks, notes, and active selection from client storage during app initialization.
- Integrate notebook navigation into the main app UI so note creation, selection, renaming, and deletion operate within the active notebook.
- Align current sync behavior with notebook scope decisions and document whether per-notebook sync-chain switching is included now or deferred.
- Add or update tests for notebook persistence, notebook isolation, and selection restoration.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `multi-notebook`: Deliver the existing Requirement 3 behavior through notebook CRUD, notebook-aware note management, persistence restoration, and scoped UI flows.
- `sync-core`: Clarify how notebook selection interacts with the current room-based sync model, especially if active notebook switching changes the joined sync chain.

## Impact

- Affected frontend code includes the Zustand store, storage hook, notebook/note navigation UI, and app initialization flow.
- Affected specifications likely include capability deltas for `multi-notebook` and `sync-core`, with possible knock-on notes to testing expectations.
- Affected tests include notebook isolation and persistence behavior across reloads and notebook switches.
