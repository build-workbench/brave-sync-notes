# Delta Spec: Sync Core for Multi-Notebook

## Base
`openspec/specs/capabilities/sync-core.md`

## ADDED Requirements

### Requirement: Active notebook determines the active sync chain
The Client SHALL join the sync chain derived from the active notebook and SHALL leave the previous notebook's sync chain before switching active notebooks.

#### Scenario: Switching to a different notebook
- **WHEN** the user activates a notebook with a different sync context
- **THEN** the client SHALL disconnect from the previous notebook's room
- **AND** join the room derived from the selected notebook's mnemonic
- **AND** request the latest sync state for the selected notebook

#### Scenario: Creating a notebook generates a sync context
- **WHEN** the user creates a new notebook
- **THEN** the client SHALL generate a unique notebook mnemonic
- **AND** derive a room ID and encryption key for that notebook
- **AND** store that sync context with the notebook metadata

### Requirement: Notebook sync switching preserves local consistency
The Client SHALL keep editor state and note selection consistent while the active notebook sync context changes.

#### Scenario: Switching notebooks with an existing active note
- **WHEN** the active notebook changes
- **THEN** the system SHALL update the active note from the selected notebook before accepting new edits
- **AND** prevent stale content from the previous notebook from remaining in the editor
