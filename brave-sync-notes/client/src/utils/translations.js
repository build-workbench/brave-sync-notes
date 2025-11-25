export const translations = {
  en: {
    // Landing Page
    appTitle: 'Secure Note Chain',
    appSubtitleLine1: 'End-to-end encrypted synchronization.',
    appSubtitleLine2: 'No accounts. No tracking.',
    deviceNameLabel: 'Your Device Name',
    deviceNamePlaceholder: 'e.g. MacBook Pro',
    startChain: 'Start New Sync Chain',
    orJoinExisting: 'Or join existing',
    chainPlaceholder: 'Paste your 12-word Chain Code here...',
    joinChain: 'Join Chain',
    scanQR: 'Scan QR to Join',
    
    // App Header
    headerTitle: 'Secure Notes',
    leave: 'Leave',
    settings: 'Settings',
    
    // Sidebar
    devicesInChain: 'Devices in Chain',
    syncChainCode: 'Sync Chain Code',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    showQR: 'Show QR Code',
    hideQR: 'Hide QR Code',
    qrCodeTitle: 'Scan to Join',
    qrCodeDesc: 'Open on mobile and scan this code',
    
    // Editor
    edit: 'Edit',
    preview: 'Preview',
    split: 'Split',
    notePlaceholder: '# Start typing your secure notes...\n\nSupports **Markdown** and `code` highlighting.',
    noContent: '*No content yet...*',
    
    // History
    history: 'History',
    historyEmpty: 'No history yet',
    restore: 'Restore',
    delete: 'Delete',
    clearAll: 'Clear All',
    clearAllConfirm: 'Are you sure you want to clear all history?',
    
    // Status
    statusConnected: 'Connected',
    statusSyncing: 'Syncing...',
    statusDisconnected: 'Disconnected',
    
    // File Operations
    importFile: 'Import',
    exportFile: 'Export',
    exportMarkdown: 'Export as Markdown',
    exportText: 'Export as Text',
    importSuccess: 'File imported successfully',
    exportSuccess: 'File exported successfully',
    
    // Settings
    fontSize: 'Font Size',
    tabSize: 'Tab Size',
    lineNumbers: 'Line Numbers',
    wordWrap: 'Word Wrap',
    syncDelay: 'Sync Delay (ms)',
    editorMode: 'Editor Mode',
    markdown: 'Markdown',
    code: 'Code',
    
    // Confirmations
    confirmLeave: 'Are you sure you want to leave the sync chain?',
    confirmClear: 'This will clear all content. Continue?',
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
    confirm: 'Confirm',
    
    // Tooltips
    darkModeTooltip: 'Toggle dark mode',
    languageTooltip: 'Switch language',
    sidebarTooltip: 'Toggle sidebar',
    
    // Mobile
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mobileWarning: 'Best experience on larger screens',
  },
  zh: {
    // 登录页面
    appTitle: '安全同步笔记',
    appSubtitleLine1: '端到端加密的多设备同步。',
    appSubtitleLine2: '无需账号，不留痕迹。',
    deviceNameLabel: '设备名称',
    deviceNamePlaceholder: '例如：我的 MacBook',
    startChain: '创建新的同步链',
    orJoinExisting: '或加入已有同步链',
    chainPlaceholder: '在此粘贴你的 12 个单词同步密钥...',
    joinChain: '加入同步链',
    scanQR: '扫码加入',
    
    // 应用头部
    headerTitle: '安全笔记',
    leave: '退出',
    settings: '设置',
    
    // 侧边栏
    devicesInChain: '在线设备',
    syncChainCode: '同步链代码',
    copyCode: '复制代码',
    copied: '已复制！',
    showQR: '显示二维码',
    hideQR: '隐藏二维码',
    qrCodeTitle: '扫码加入',
    qrCodeDesc: '在手机上打开并扫描此二维码',
    
    // 编辑器
    edit: '编辑',
    preview: '预览',
    split: '分屏',
    notePlaceholder: '# 在这里开始记录你的笔记...\n\n支持 **Markdown** 和 `代码` 高亮显示。',
    noContent: '*还没有内容...*',
    
    // 历史记录
    history: '历史记录',
    historyEmpty: '暂无历史记录',
    restore: '恢复',
    delete: '删除',
    clearAll: '清空全部',
    clearAllConfirm: '确定要清空所有历史记录吗？',
    
    // 状态
    statusConnected: '已连接',
    statusSyncing: '同步中...',
    statusDisconnected: '未连接',
    
    // 文件操作
    importFile: '导入',
    exportFile: '导出',
    exportMarkdown: '导出为 Markdown',
    exportText: '导出为文本',
    importSuccess: '文件导入成功',
    exportSuccess: '文件导出成功',
    
    // 设置
    fontSize: '字体大小',
    tabSize: 'Tab 大小',
    lineNumbers: '显示行号',
    wordWrap: '自动换行',
    syncDelay: '同步延迟 (毫秒)',
    editorMode: '编辑器模式',
    markdown: 'Markdown',
    code: '代码',
    
    // 确认提示
    confirmLeave: '确定要退出同步链吗？',
    confirmClear: '这将清除所有内容。是否继续？',
    yes: '是',
    no: '否',
    cancel: '取消',
    confirm: '确认',
    
    // 提示
    darkModeTooltip: '切换深色模式',
    languageTooltip: '切换语言',
    sidebarTooltip: '切换侧边栏',
    
    // 移动端
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
    mobileWarning: '大屏幕体验更佳',
  },
};

export const useTranslation = (lang) => {
  return translations[lang] || translations.zh;
};
