# 笔记同步系统全面重构需求文档

## 简介

本文档定义了对现有笔记同步系统的全面重构需求。经过代码分析，发现系统存在多个未完成或不完善的功能模块。本次重构旨在修复现有问题、完善核心功能、提升用户体验，使系统达到生产就绪状态。

## 术语表

- **System**: 笔记同步系统（Note Sync Now）
- **Client**: 前端应用程序（React + Vite）
- **Server**: 后端服务器（Express + Socket.IO）
- **StorageManager**: 客户端存储管理器，负责 IndexedDB/LocalStorage 操作
- **ConflictManager**: 冲突管理器，负责检测和解决同步冲突
- **OfflineQueue**: 离线操作队列，存储离线时的编辑操作
- **Notebook**: 笔记本，包含多个笔记的容器
- **Note**: 单个笔记文档
- **Sync_Chain**: 使用相同助记词的设备组成的同步链
- **PWA**: 渐进式 Web 应用

## 需求

### 需求 1：存储系统集成

**用户故事：** 作为用户，我希望我的笔记能够可靠地保存在本地，即使关闭浏览器后重新打开也能恢复数据。

#### 验收标准

1. WHEN the Client initializes THEN the StorageManager SHALL automatically detect and use IndexedDB if available
2. WHEN IndexedDB is unavailable THEN the StorageManager SHALL fallback to LocalStorage without data loss
3. WHEN a user edits a note THEN the System SHALL persist changes to local storage within 1 second
4. WHEN the user reopens the application THEN the System SHALL restore the last saved note content
5. WHEN storage quota is exceeded THEN the System SHALL display a warning and offer to clear old history
6. WHEN the user joins a sync chain THEN the System SHALL migrate any existing local data to the new storage format

### 需求 2：冲突管理集成

**用户故事：** 作为用户，当我在多个设备上编辑同一笔记时，我希望系统能够智能处理冲突，不会丢失我的任何修改。

#### 验收标准

1. WHEN two devices edit the same note within 5 seconds THEN the ConflictManager SHALL detect the conflict
2. WHEN a conflict is detected THEN the Client SHALL display the ConflictDialog showing both versions
3. WHEN the user selects a resolution THEN the System SHALL apply the chosen content and sync to all devices
4. WHEN the user chooses to merge THEN the System SHALL attempt three-way merge and show the result
5. WHILE conflicts exist THEN the ConflictIndicator SHALL display the conflict count in the header
6. IF auto-resolve is enabled THEN the System SHALL use the configured strategy without user intervention

### 需求 3：离线模式支持

**用户故事：** 作为用户，我希望在没有网络连接时也能继续编辑笔记，并在网络恢复后自动同步。

#### 验收标准

1. WHEN the network disconnects THEN the Client SHALL display an offline indicator
2. WHEN the user edits notes offline THEN the OfflineQueue SHALL store all changes with timestamps
3. WHEN the network reconnects THEN the System SHALL automatically sync all queued changes
4. WHEN offline changes conflict with server data THEN the System SHALL trigger conflict resolution
5. WHEN the Client is offline THEN the System SHALL continue to function with cached data
6. WHEN the user attempts to join a new chain offline THEN the System SHALL display an appropriate error message

### 需求 4：多笔记支持

**用户故事：** 作为用户，我希望能够在同一个同步链中创建和管理多个笔记，以便更好地组织我的内容。

#### 验收标准

1. WHEN a user creates a new note THEN the System SHALL generate a unique identifier and add it to the note list
2. WHEN a user switches between notes THEN the System SHALL save the current note and load the selected note
3. WHEN a user deletes a note THEN the System SHALL prompt for confirmation and remove it from storage
4. WHEN a user renames a note THEN the System SHALL update the title and sync to all devices
5. WHEN the sidebar displays notes THEN the System SHALL show note titles sorted by last modified time
6. WHEN a user searches notes THEN the System SHALL filter the note list by title and content

### 需求 5：历史版本增强

**用户故事：** 作为用户，我希望能够查看笔记的修改历史，并能够比较和恢复之前的版本。

#### 验收标准

1. WHEN a user views history THEN the System SHALL display a list of saved versions with timestamps
2. WHEN a user selects a history entry THEN the System SHALL show a preview of that version
3. WHEN a user compares two versions THEN the System SHALL display a diff view highlighting changes
4. WHEN a user restores a version THEN the System SHALL create a new entry and update the current content
5. WHEN history exceeds 50 entries THEN the System SHALL automatically remove the oldest entries
6. WHEN a user clears history THEN the System SHALL remove all history entries after confirmation

### 需求 6：用户界面改进

**用户故事：** 作为用户，我希望界面更加直观易用，能够清楚地看到同步状态和系统信息。

#### 验收标准

1. WHEN the connection status changes THEN the Header SHALL display the current status with appropriate icon
2. WHEN a sync operation is in progress THEN the System SHALL show a subtle loading indicator
3. WHEN an error occurs THEN the System SHALL display a user-friendly error message with recovery options
4. WHEN the user hovers over a member THEN the System SHALL show device details and connection time
5. WHEN the sidebar is collapsed THEN the System SHALL preserve the collapsed state across sessions
6. WHEN the user changes settings THEN the System SHALL apply changes immediately without page reload

### 需求 7：测试修复与完善

**用户故事：** 作为开发者，我希望所有测试都能通过，确保代码质量和功能正确性。

#### 验收标准

1. WHEN tests are executed THEN the System SHALL pass all unit tests with at least 90% success rate
2. WHEN the version increment test runs THEN the LocalStorageAdapter SHALL correctly increment note versions
3. WHEN the history cleanup test runs THEN the System SHALL correctly count and remove old entries
4. WHEN the data validation test runs THEN the System SHALL reject invalid note data with appropriate errors
5. WHEN property tests run THEN the System SHALL verify round-trip consistency for all data operations
6. WHEN the test suite completes THEN the System SHALL generate a coverage report

