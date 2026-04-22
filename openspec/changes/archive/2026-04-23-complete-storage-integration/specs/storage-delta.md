# Delta Spec: Storage Integration

## Base
`openspec/specs/capabilities/sync-core.md`

## ADDED Requirements

### Requirement: Storage Initialization
The Client SHALL initialize storage on application mount with a loading indicator.

#### Scenario: Successful initialization
- WHEN the application starts
- THEN the system SHALL initialize IndexedDB storage
- AND display the main UI after initialization completes

#### Scenario: IndexedDB unavailable
- WHEN IndexedDB is unavailable
- THEN the system SHALL fall back to LocalStorage
- AND display a notification about fallback mode

#### Scenario: All storage fails
- WHEN both IndexedDB and LocalStorage fail
- THEN the system SHALL display an error state
- AND allow the user to retry or continue without storage

### Requirement: Auto-Save
The Client SHALL automatically save note content with debouncing.

#### Scenario: Auto-save triggers
- WHEN the user stops typing for 300ms
- THEN the system SHALL save the current note content to storage
- AND update the note's updatedAt timestamp

#### Scenario: Auto-save disabled
- WHEN the user has disabled auto-save
- THEN the system SHALL NOT automatically save
- AND require manual save action

### Requirement: Data Recovery
The Client SHALL provide a mechanism to recover data from corrupted storage.

#### Scenario: Recovery initiation
- WHEN the user requests data recovery
- THEN the system SHALL attempt to read all recoverable data
- AND export the data as a JSON file

#### Scenario: Partial recovery
- WHEN some data is corrupted
- THEN the system SHALL recover all valid data
- AND report which notes could not be recovered
