# Delta Spec: Multi-Notebook Support

## Base
`openspec/specs/capabilities/multi-notebook.md`

## ADDED Requirements

### Requirement: Notebook state is restored from client storage
The Client SHALL restore notebooks, notebook-scoped notes, and the active notebook selection from client storage during application initialization.

#### Scenario: Existing notebook data is restored
- **WHEN** the application starts and notebook data exists in client storage
- **THEN** the system SHALL load all stored notebooks
- **AND** restore notes associated with each notebook
- **AND** restore the previously active notebook and active note when they still exist

#### Scenario: Legacy single-chain state is migrated
- **WHEN** the application starts without notebook records but with legacy single-note state
- **THEN** the system SHALL create a default notebook from the legacy sync context
- **AND** persist the current note into that notebook
- **AND** mark the migrated notebook as the active notebook

### Requirement: Notebook actions are notebook-scoped
The Client SHALL scope note creation, selection, renaming, and deletion to the active notebook.

#### Scenario: Creating a note in the active notebook
- **WHEN** the user creates a note while a notebook is active
- **THEN** the system SHALL associate the new note with the active notebook
- **AND** make the new note the active note

#### Scenario: Switching notebooks changes visible notes
- **WHEN** the user switches from one notebook to another
- **THEN** the system SHALL show only notes associated with the selected notebook
- **AND** update the active note to a note within that notebook or clear the editor if no note exists

#### Scenario: Deleting a notebook removes associated notes
- **WHEN** the user confirms deletion of a notebook
- **THEN** the system SHALL remove the notebook from client storage
- **AND** remove notes associated with that notebook
- **AND** choose a new active notebook if one remains

#### Scenario: Deleting the last notebook clears active notebook state
- **WHEN** the user confirms deletion of the last remaining notebook
- **THEN** the system SHALL remove that notebook from client storage
- **AND** clear the active notebook selection
- **AND** clear the active note and notebook mnemonic until a new notebook is created or imported

### Requirement: Notebook sharing metadata uses the notebook sync context
The Client SHALL generate notebook sharing output from the active notebook's mnemonic and metadata.

#### Scenario: QR generation for the active notebook
- **WHEN** the user requests a QR code for notebook sharing
- **THEN** the system SHALL encode the active notebook's mnemonic
- **AND** include notebook-identifying metadata needed to import that notebook on another device
