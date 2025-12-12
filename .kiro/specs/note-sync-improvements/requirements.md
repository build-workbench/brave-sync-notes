# 笔记同步系统改进需求文档

## 简介

本文档定义了对现有笔记同步系统的改进需求。当前系统是一个端到端加密的实时笔记同步工具，支持多设备协作。系统已实现基本的同步功能、Markdown 编辑、历史记录等核心特性。本次改进旨在解决现有系统的稳定性、可靠性和用户体验问题，并增加新的功能以提升产品竞争力。

## 术语表

- **System**: 笔记同步系统（Note Sync Now）
- **Client**: 前端应用程序（React + Vite）
- **Server**: 后端服务器（Express + Socket.IO）
- **Sync Chain**: 使用相同 12 词助记词的设备组成的同步链
- **Room**: 服务器端的同步链标识符
- **Encrypted Data**: 使用 AES-256 加密的笔记内容
- **Device**: 连接到同步链的客户端实例
- **Chunk**: 大文件传输时的数据分块
- **History Entry**: 历史记录条目
- **Mnemonic**: 12 词助记词，用于生成加密密钥
- **WebSocket**: 实时双向通信协议
- **LocalStorage**: 浏览器本地存储
- **IndexedDB**: 浏览器结构化数据存储

## 需求

### 需求 1：数据持久化与可靠性

**用户故事：** 作为用户，我希望我的笔记数据能够可靠地保存，即使服务器重启或网络中断，我也不会丢失数据。

#### 验收标准

1. WHEN the Server restarts THEN the System SHALL restore all active sync chains and their latest content from persistent storage
2. WHEN all Devices disconnect from a Sync Chain THEN the Server SHALL retain the encrypted data for at least 7 days
3. WHEN a Device reconnects after network interruption THEN the System SHALL synchronize the latest content without data loss
4. WHEN the Client stores data locally THEN the System SHALL use IndexedDB as primary storage with LocalStorage as fallback
5. WHEN storage quota is exceeded THEN the System SHALL notify the user and provide options to clear old history entries

### 需求 2：冲突检测与解决

**用户故事：** 作为用户，当多个设备同时编辑笔记时，我希望系统能够智能地处理冲突，避免数据覆盖。

#### 验收标准

1. WHEN two Devices push updates within 5 seconds THEN the System SHALL detect the conflict and preserve both versions
2. WHEN a conflict is detected THEN the Client SHALL display a conflict resolution interface showing both versions
3. WHEN the user resolves a conflict THEN the System SHALL merge the selected content and broadcast to all Devices
4. WHEN a Device is offline and makes changes THEN the System SHALL queue the changes and detect conflicts upon reconnection
5. WHILE a conflict exists THEN the System SHALL prevent new edits until the conflict is resolved

### 需求 3：多笔记本支持

**用户故事：** 作为用户，我希望能够创建多个独立的笔记本，每个笔记本可以包含多个笔记文件，以便更好地组织我的内容。

#### 验收标准

1. WHEN a user creates a new notebook THEN the System SHALL generate a unique identifier and encryption key for that notebook
2. WHEN a user switches between notebooks THEN the System SHALL load the corresponding notes and maintain separate sync chains
3. WHEN a user creates a note within a notebook THEN the System SHALL associate the note with the notebook and encrypt it with the notebook's key
4. WHEN a user deletes a notebook THEN the System SHALL prompt for confirmation and remove all associated notes from local storage
5. WHEN a user shares a notebook THEN the System SHALL generate a QR code containing the notebook's mnemonic and metadata

### 需求 4：离线模式与 PWA 支持

**用户故事：** 作为用户，我希望在没有网络连接时也能查看和编辑笔记，并在网络恢复后自动同步。

#### 验收标准

1. WHEN the Client is installed as a PWA THEN the System SHALL cache all necessary assets for offline use
2. WHEN the Device goes offline THEN the Client SHALL continue to function with local data and display offline status
3. WHEN the user edits notes offline THEN the Client SHALL store changes locally with timestamps
4. WHEN the Device reconnects THEN the System SHALL automatically sync all offline changes to the Server
5. WHEN offline changes conflict with server data THEN the System SHALL apply conflict resolution rules

### 需求 5：版本控制与差异比较

**用户故事：** 作为用户，我希望能够查看笔记的完整修改历史，并能够比较不同版本之间的差异。

#### 验收标准

1. WHEN a user views history THEN the System SHALL display a timeline of all saved versions with timestamps and device names
2. WHEN a user selects two versions THEN the System SHALL display a side-by-side diff view highlighting additions and deletions
3. WHEN a user restores a previous version THEN the System SHALL create a new history entry and broadcast the restored content
4. WHEN the System saves a version THEN the System SHALL store only the delta from the previous version to save space
5. WHEN a user searches history THEN the System SHALL support full-text search across all historical versions

### 需求 6：协作功能增强

**用户故事：** 作为用户，当我与他人协作编辑时，我希望能够看到其他人的光标位置和实时编辑状态。

#### 验收标准

1. WHEN a Device moves the cursor THEN the System SHALL broadcast the cursor position to all other Devices in the Sync Chain
2. WHEN a Device receives cursor position updates THEN the Client SHALL display colored cursors with device names
3. WHEN a Device is typing THEN the System SHALL broadcast typing indicators to other Devices
4. WHEN a Device selects text THEN the System SHALL broadcast the selection range to other Devices
5. WHEN a Device disconnects THEN the System SHALL remove that Device's cursor and indicators from all other Clients

### 需求 7：安全性增强

**用户故事：** 作为用户，我希望系统提供更强的安全保护，包括密钥轮换和访问控制。

#### 验收标准

1. WHEN a user enables key rotation THEN the System SHALL generate a new encryption key and re-encrypt all data
2. WHEN a user suspects key compromise THEN the System SHALL provide a one-click key rotation feature
3. WHEN a user enables access control THEN the System SHALL require device approval before joining the Sync Chain
4. WHEN a new Device attempts to join THEN the System SHALL notify existing Devices and require approval from at least one Device
5. WHEN a user revokes a Device THEN the System SHALL disconnect that Device and prevent future connections with the old key

### 需求 8：性能优化

**用户故事：** 作为用户，我希望系统在处理大型笔记和高频编辑时保持流畅响应。

#### 验收标准

1. WHEN a note exceeds 1MB THEN the System SHALL use incremental sync to transmit only changed portions
2. WHEN the user types continuously THEN the System SHALL debounce sync operations to reduce network traffic by at least 80%
3. WHEN the Client renders a large note THEN the System SHALL use virtual scrolling to maintain 60fps rendering
4. WHEN the Server handles 100+ concurrent connections THEN the System SHALL maintain average response time below 100ms
5. WHEN the System detects slow network THEN the System SHALL automatically adjust chunk size and debounce intervals

### 需求 9：数据导入导出增强

**用户故事：** 作为用户，我希望能够批量导入导出笔记，并支持更多格式。

#### 验收标准

1. WHEN a user exports a notebook THEN the System SHALL create a ZIP file containing all notes in Markdown format
2. WHEN a user imports a ZIP file THEN the System SHALL extract and import all supported file formats
3. WHEN a user exports notes THEN the System SHALL support Markdown, HTML, PDF, and plain text formats
4. WHEN a user imports from other note apps THEN the System SHALL support Evernote ENEX, Notion, and OneNote formats
5. WHEN export includes images THEN the System SHALL embed images as base64 or include them as separate files

### 需求 10：搜索与标签功能

**用户故事：** 作为用户，我希望能够快速搜索笔记内容，并使用标签组织笔记。

#### 验收标准

1. WHEN a user enters a search query THEN the System SHALL return results within 200ms for notebooks up to 10,000 notes
2. WHEN a user searches THEN the System SHALL support full-text search with highlighting of matched terms
3. WHEN a user adds a tag to a note THEN the System SHALL store the tag and make it searchable
4. WHEN a user filters by tag THEN the System SHALL display all notes with that tag
5. WHEN a user views tag statistics THEN the System SHALL display tag usage frequency and related tags

### 需求 11：备份与恢复

**用户故事：** 作为用户，我希望能够定期备份我的所有数据，并在需要时完整恢复。

#### 验收标准

1. WHEN a user enables automatic backup THEN the System SHALL create encrypted backups daily to the user's chosen location
2. WHEN a user initiates manual backup THEN the System SHALL create a complete backup including all notebooks, notes, and settings
3. WHEN a user restores from backup THEN the System SHALL decrypt and restore all data to the original state
4. WHEN backup fails THEN the System SHALL retry up to 3 times and notify the user of persistent failures
5. WHEN a user views backup history THEN the System SHALL display all available backups with timestamps and sizes

### 需求 12：测试与质量保证

**用户故事：** 作为开发者，我希望系统具有完善的测试覆盖，确保代码质量和功能正确性。

#### 验收标准

1. WHEN code is committed THEN the System SHALL run all unit tests and achieve at least 80% code coverage
2. WHEN critical functions are modified THEN the System SHALL pass all property-based tests
3. WHEN the Client is built THEN the System SHALL pass all integration tests for sync operations
4. WHEN the Server is deployed THEN the System SHALL pass load tests with 1000 concurrent connections
5. WHEN encryption functions are used THEN the System SHALL verify correctness through round-trip property tests
