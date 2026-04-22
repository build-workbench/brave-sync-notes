import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Note Sync Now',
  titleTemplate: ':title | Note Sync Now',
  description: '端到端加密笔记同步 - 无需账户，扫码即用，多设备实时同步',

  cleanUrls: true,

  base: '/brave-sync-notes/',

  head: [
    ['meta', { charset: 'UTF-8' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { name: 'msapplication-TileColor', content: '#3b82f6' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],

    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:site_name', content: 'Note Sync Now' }],
    ['meta', { property: 'og:image', content: 'https://lessup.github.io/brave-sync-notes/og-image.png' }],

    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@LessUp' }],
    ['meta', { name: 'twitter:image', content: 'https://lessup.github.io/brave-sync-notes/og-image.png' }],

    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap', rel: 'stylesheet' }],

    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Note Sync Now',
      description: '端到端加密笔记同步应用',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CNY'
      }
    })]
  ],

  lastUpdated: {
    text: '最后更新',
    formatOptions: {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },

  ignoreDeadLinks: [
    'http://localhost:5173',
    'http://localhost:3002',
    'https://demo.note-sync.now'
  ],

  themeConfig: {
    logo: '/logo.svg',

    siteTitle: 'Note Sync Now',

    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/zh-CN/getting-started', activeMatch: '/zh-CN/' },
      { text: 'API', link: '/api/websocket-api', activeMatch: '/api/' },
      {
        text: '更多',
        items: [
          { text: '更新日志', link: '/changelog/' },
          { text: '贡献指南', link: '/zh-CN/contributing' },
          { text: 'GitHub', link: 'https://github.com/LessUp/brave-sync-notes' }
        ]
      }
    ],

    sidebar: {
      '/zh-CN/': [
        {
          text: '快速开始',
          collapsed: false,
          items: [
            { text: '概述', link: '/zh-CN/' },
            { text: '快速入门', link: '/zh-CN/getting-started' },
            { text: '架构说明', link: '/zh-CN/architecture' },
            { text: '安全机制', link: '/zh-CN/security-sync' }
          ]
        },
        {
          text: '部署',
          collapsed: false,
          items: [
            { text: '部署指南', link: '/zh-CN/deployment' }
          ]
        },
        {
          text: '开发',
          collapsed: false,
          items: [
            { text: '贡献指南', link: '/zh-CN/contributing' }
          ]
        }
      ],
      '/en/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/en/' },
            { text: 'Quick Start', link: '/en/getting-started' },
            { text: 'Architecture', link: '/en/architecture' },
            { text: 'Security', link: '/en/security-sync' }
          ]
        },
        {
          text: 'Deployment',
          collapsed: false,
          items: [
            { text: 'Deployment Guide', link: '/en/deployment' }
          ]
        },
        {
          text: 'Development',
          collapsed: false,
          items: [
            { text: 'Contributing', link: '/en/contributing' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          collapsed: false,
          items: [
            { text: 'WebSocket API', link: '/api/websocket-api' },
            { text: 'REST API', link: '/api/rest-api' }
          ]
        }
      ],
      '/changelog/': [
        {
          text: 'Version History',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/changelog/' },
            { text: 'v2.2.0 (EN)', link: '/changelog/en/v2.2.0' },
            { text: 'v2.2.0 (中文)', link: '/changelog/zh-CN/v2.2.0' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/LessUp/brave-sync-notes' }
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    footer: {
      message: '基于 MIT 协议开源',
      copyright: 'Copyright © 2026 LessUp'
    },

    outline: {
      level: [2, 4],
      label: '页面导航'
    },

    darkModeSwitchLabel: '切换主题',

    externalLinkIcon: true
  },

  vite: {
    css: {
      devSourcemap: true
    },
    build: {
      chunkSizeWarningLimit: 1000
    }
  }
})
