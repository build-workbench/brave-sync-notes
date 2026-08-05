import type { DefaultTheme } from 'vitepress'

type Sidebar = DefaultTheme.Sidebar

export const sidebarZh: Sidebar = {
  '/zh/': [
    {
      text: '快速开始',
      items: [
        { text: '概述', link: '/zh/' },
        { text: '快速入门', link: '/zh/getting-started' },
        { text: '架构说明', link: '/zh/architecture' },
        { text: '安全机制', link: '/zh/security-sync' }
      ]
    },
    {
      text: '技术白皮书',
      items: [
        { text: '技术规格', link: '/zh/tech-spec' },
        { text: '加密协议', link: '/zh/crypto-protocol' },
        { text: '同步算法', link: '/zh/sync-algorithm' },
        { text: 'API 设计', link: '/zh/api-design' },
        { text: '性能基准', link: '/zh/performance' },
        { text: '学术引用', link: '/zh/references' }
      ]
    },
    {
      text: '部署与开发',
      items: [
        { text: '部署指南', link: '/zh/deployment' },
        { text: '贡献指南', link: '/zh/contributing' },
        { text: '常见问题', link: '/zh/faq' },
        { text: '故障排查', link: '/zh/troubleshooting' }
      ]
    }
  ]
}

export const sidebarApi: Sidebar = {
  '/api/': [
    {
      text: 'API Reference',
      items: [
        { text: 'WebSocket API', link: '/api/websocket-api' },
        { text: 'REST API', link: '/api/rest-api' }
      ]
    }
  ]
}

export const sidebarChangelog: Sidebar = {
  '/changelog/': [
    {
      text: '版本历史',
      items: [
        { text: '概述', link: '/changelog/' },
        { text: 'v2.2.0', link: '/changelog/zh/v2.2.0' }
      ]
    }
  ]
}
