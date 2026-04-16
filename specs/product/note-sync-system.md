# Note Sync System - Product Requirements

> **Status:** Active  
> **Created:** 2026-04-17  
> **Last Updated:** 2026-04-17

## Overview

Note Sync Now is an end-to-end encrypted real-time note synchronization tool supporting multi-device collaboration.

### Core Features

- **End-to-End Encryption**: Client-side AES-256 encryption, server only relays ciphertext
- **Mnemonic Recovery**: 12-word mnemonic derives encryption key
- **Real-time Sync**: WebSocket bidirectional communication with reconnection support
- **Conflict Resolution**: Conflict detection and manual resolution mechanism
- **Multi-Layer Storage**: IndexedDB + LocalStorage dual-layer storage

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State Management | Zustand |
| Editor | CodeMirror 6 |
| Backend | Node.js + Express + Socket.IO |
| Storage | Redis / SQLite / IndexedDB |
| Testing | Vitest + Jest + fast-check |

---

## Requirements

### Requirement 1: Data Persistence & Reliability

**User Story:** As a user, I want my note data to be saved reliably, even if the server restarts or the network disconnects.

#### Acceptance Criteria

1. WHEN the Server restarts THEN the System SHALL restore all active sync chains and their latest content from persistent storage
2. WHEN all Devices disconnect from a Sync Chain THEN the Server SHALL retain the encrypted data for at least 7 days
3. WHEN a Device reconnects after network interruption THEN the System SHALL synchronize the latest content without data loss
4. WHEN the Client stores data locally THEN the System SHALL use IndexedDB as primary storage with LocalStorage as fallback
5. WHEN storage quota is exceeded THEN the System SHALL notify the user and provide options to clear old history entries

### Requirement 2: Conflict Detection & Resolution

**User Story:** As a user, when multiple devices edit the same note simultaneously, I want the system to intelligently handle conflicts without data loss.

#### Acceptance Criteria

1. WHEN two Devices push updates within 5 seconds THEN the System SHALL detect the conflict and preserve both versions
2. WHEN a conflict is detected THEN the Client SHALL display a conflict resolution interface showing both versions
3. WHEN the user resolves a conflict THEN the System SHALL merge the selected content and broadcast to all Devices
4. WHEN a Device is offline and makes changes THEN the System SHALL queue the changes and detect conflicts upon reconnection
5. WHILE a conflict exists THEN the System SHALL prevent new edits until the conflict is resolved

### Requirement 3: Multi-Notebook Support

**User Story:** As a user, I want to create multiple independent notebooks, each containing multiple note files, for better content organization.

#### Acceptance Criteria

1. WHEN a user creates a new notebook THEN the System SHALL generate a unique identifier and encryption key for that notebook
2. WHEN a user switches between notebooks THEN the System SHALL load the corresponding notes and maintain separate sync chains
3. WHEN a user creates a note within a notebook THEN the System SHALL associate the note with the notebook and encrypt it with the notebook's key
4. WHEN a user deletes a notebook THEN the System SHALL prompt for confirmation and remove all associated notes from local storage
5. WHEN a user shares a notebook THEN the System SHALL generate a QR code containing the notebook's mnemonic and metadata

### Requirement 4: Offline Mode & PWA Support

**User Story:** As a user, I want to view and edit notes without network connection, and automatically sync when the network is restored.

#### Acceptance Criteria

1. WHEN the Client is installed as a PWA THEN the System SHALL cache all necessary assets for offline use
2. WHEN the Device goes offline THEN the Client SHALL continue to function with local data and display offline status
3. WHEN the user edits notes offline THEN the Client SHALL store changes locally with timestamps
4. WHEN the Device reconnects THEN the System SHALL automatically sync all offline changes to the Server
5. WHEN offline changes conflict with server data THEN the System SHALL apply conflict resolution rules

### Requirement 5: Version Control & Diff Comparison

**User Story:** As a user, I want to view the complete modification history of notes and compare differences between versions.

#### Acceptance Criteria

1. WHEN a user views history THEN the System SHALL display a timeline of all saved versions with timestamps and device names
2. WHEN a user selects two versions THEN the System SHALL display a side-by-side diff view highlighting additions and deletions
3. WHEN a user restores a previous version THEN the System SHALL create a new history entry and broadcast the restored content
4. WHEN the System saves a version THEN the System SHALL store only the delta from the previous version to save space
5. WHEN a user searches history THEN the System SHALL support full-text search across all historical versions

### Requirement 6: Enhanced Collaboration

**User Story:** As a user collaborating with others, I want to see other people's cursor positions and real-time editing status.

#### Acceptance Criteria

1. WHEN a Device moves the cursor THEN the System SHALL broadcast the cursor position to all other Devices in the Sync Chain
2. WHEN a Device receives cursor position updates THEN the Client SHALL display colored cursors with device names
3. WHEN a Device is typing THEN the System SHALL broadcast typing indicators to other Devices
4. WHEN a Device selects text THEN the System SHALL broadcast the selection range to other Devices
5. WHEN a Device disconnects THEN the System SHALL remove that Device's cursor and indicators from all other Clients

### Requirement 7: Security Enhancement

**User Story:** As a user, I want stronger security protection, including key rotation and access control.

#### Acceptance Criteria

1. WHEN a user enables key rotation THEN the System SHALL generate a new encryption key and re-encrypt all data
2. WHEN a user suspects key compromise THEN the System SHALL provide a one-click key rotation feature
3. WHEN a user enables access control THEN the System SHALL require device approval before joining the Sync Chain
4. WHEN a new Device attempts to join THEN the System SHALL notify existing Devices and require approval from at least one Device
5. WHEN a user revokes a Device THEN the System SHALL disconnect that Device and prevent future connections with the old key

### Requirement 8: Performance Optimization

**User Story:** As a user, I want the system to maintain smooth response when processing large notes and high-frequency editing.

#### Acceptance Criteria

1. WHEN a note exceeds 1MB THEN the System SHALL use incremental sync to transmit only changed portions
2. WHEN the user types continuously THEN the System SHALL debounce sync operations to reduce network traffic by at least 80%
3. WHEN the Client renders a large note THEN the System SHALL use virtual scrolling to maintain 60fps rendering
4. WHEN the Server handles 100+ concurrent connections THEN the System SHALL maintain average response time below 100ms
5. WHEN the System detects slow network THEN the System SHALL automatically adjust chunk size and debounce intervals

### Requirement 9: Enhanced Data Import/Export

**User Story:** As a user, I want to batch import/export notes and support more formats.

#### Acceptance Criteria

1. WHEN a user exports a notebook THEN the System SHALL create a ZIP file containing all notes in Markdown format
2. WHEN a user imports a ZIP file THEN the System SHALL extract and import all supported file formats
3. WHEN a user exports notes THEN the System SHALL support Markdown, HTML, PDF, and plain text formats
4. WHEN a user imports from other note apps THEN the System SHALL support Evernote ENEX, Notion, and OneNote formats
5. WHEN export includes images THEN the System SHALL embed images as base64 or include them as separate files

### Requirement 10: Search & Tag Functionality

**User Story:** As a user, I want to quickly search note content and use tags to organize notes.

#### Acceptance Criteria

1. WHEN a user enters a search query THEN the System SHALL return results within 200ms for notebooks up to 10,000 notes
2. WHEN a user searches THEN the System SHALL support full-text search with highlighting of matched terms
3. WHEN a user adds a tag to a note THEN the System SHALL store the tag and make it searchable
4. WHEN a user filters by tag THEN the System SHALL display all notes with that tag
5. WHEN a user views tag statistics THEN the System SHALL display tag usage frequency and related tags

### Requirement 11: Backup & Recovery

**User Story:** As a user, I want to periodically backup all my data and recover it completely when needed.

#### Acceptance Criteria

1. WHEN a user enables automatic backup THEN the System SHALL create encrypted backups daily to the user's chosen location
2. WHEN a user initiates manual backup THEN the System SHALL create a complete backup including all notebooks, notes, and settings
3. WHEN a user restores from backup THEN the System SHALL decrypt and restore all data to the original state
4. WHEN backup fails THEN the System SHALL retry up to 3 times and notify the user of persistent failures
5. WHEN a user views backup history THEN the System SHALL display all available backups with timestamps and sizes

---

## Glossary

| Term | Definition |
|------|------------|
| System | Note Sync Now - the note synchronization system |
| Client | Frontend application (React + Vite) |
| Server | Backend server (Express + Socket.IO) |
| Sync Chain | A group of devices using the same 12-word mnemonic |
| Room | Server-side sync chain identifier |
| Encrypted Data | Note content encrypted with AES-256 |
| Device | Client instance connected to the sync chain |
| Chunk | Data block for large file transfer |
| History Entry | Historical version record |
| Mnemonic | 12-word mnemonic for generating encryption key |
| WebSocket | Real-time bidirectional communication protocol |
| LocalStorage | Browser local storage |
| IndexedDB | Browser structured storage |

---

## Related Documents

- [System Architecture](../rfc/0001-core-architecture.md)
- [API Specification](../api/openapi.yaml)
- [Database Schema](../db/schema-v1.dbml)
