import type { DefaultTheme } from 'vitepress'

type NavItem = DefaultTheme.NavItem

// 中文导航
export const navZh: NavItem[] = [
  { text: '首页', link: '/zh/' },
  { text: '架构', link: '/zh/architecture', activeMatch: '/zh/' },
  { text: 'API', link: '/api/websocket-api', activeMatch: '/api/' },
  {
    text: '更多',
    items: [
      { text: '安全机制', link: '/zh/security-sync' },
      { text: '技术规格', link: '/zh/tech-spec' },
      { text: '加密协议', link: '/zh/crypto-protocol' },
      { text: '同步算法', link: '/zh/sync-algorithm' },
    ]
  },
  {
    text: '外部链接',
    items: [
      { text: '更新日志', link: '/changelog/' },
      { text: 'GitHub', link: 'https://github.com/AICL-Lab/brave-sync-notes' }
    ]
  }
]

// 英文导航
export const navEn: NavItem[] = [
  { text: 'Home', link: '/en/' },
  { text: 'Architecture', link: '/en/architecture', activeMatch: '/en/' },
  { text: 'API', link: '/api/websocket-api', activeMatch: '/api/' },
  {
    text: 'More',
    items: [
      { text: 'Security', link: '/en/security-sync' },
      { text: 'Tech Spec', link: '/en/tech-spec' },
      { text: 'Crypto Protocol', link: '/en/crypto-protocol' },
      { text: 'Sync Algorithm', link: '/en/sync-algorithm' },
    ]
  },
  {
    text: 'Links',
    items: [
      { text: 'Changelog', link: '/changelog/' },
      { text: 'GitHub', link: 'https://github.com/AICL-Lab/brave-sync-notes' }
    ]
  }
]
