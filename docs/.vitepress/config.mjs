import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import llmstxt from 'vitepress-plugin-llms'

const rawBase = process.env.VITEPRESS_BASE
const base = rawBase
  ? rawBase.startsWith('/')
    ? rawBase.endsWith('/') ? rawBase : `${rawBase}/`
    : `/${rawBase}/`
  : '/brave-sync-notes/'

export default withMermaid(defineConfig({
  base,
  title: 'Note Sync Now',
  description: '端到端加密笔记同步 - 技术白皮书',

  cleanUrls: true,

  head: [
    ['meta', { charset: 'UTF-8' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Note Sync Now' }],
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

  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'Note Sync Now',
      description: '端到端加密笔记同步技术白皮书',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '架构', link: '/zh-CN/architecture', activeMatch: '/zh-CN/' },
          { text: 'API', link: '/api/websocket-api', activeMatch: '/api/' },
          {
            text: '更多',
            items: [
              { text: '安全机制', link: '/zh-CN/security-sync' },
              { text: '技术规格', link: '/zh-CN/tech-spec' },
              { text: '加密协议', link: '/zh-CN/crypto-protocol' },
              { text: '同步算法', link: '/zh-CN/sync-algorithm' },
            ]
          },
          {
            text: '外部链接',
            items: [
              { text: '更新日志', link: '/changelog/' },
              { text: 'GitHub', link: 'https://github.com/AICL-Lab/brave-sync-notes' }
            ]
          }
        ],
        sidebar: {
          '/zh-CN/': [
            {
              text: '快速开始',
              items: [
                { text: '概述', link: '/zh-CN/' },
                { text: '快速入门', link: '/zh-CN/getting-started' },
                { text: '架构说明', link: '/zh-CN/architecture' },
                { text: '安全机制', link: '/zh-CN/security-sync' }
              ]
            },
            {
              text: '技术白皮书',
              items: [
                { text: '技术规格', link: '/zh-CN/tech-spec' },
                { text: '加密协议', link: '/zh-CN/crypto-protocol' },
                { text: '同步算法', link: '/zh-CN/sync-algorithm' },
                { text: 'API 设计', link: '/zh-CN/api-design' }
              ]
            },
            {
              text: '部署与开发',
              items: [
                { text: '部署指南', link: '/zh-CN/deployment' },
                { text: '贡献指南', link: '/zh-CN/contributing' }
              ]
            }
          ],
          '/en/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Overview', link: '/en/' },
                { text: 'Quick Start', link: '/en/getting-started' },
                { text: 'Architecture', link: '/en/architecture' },
                { text: 'Security', link: '/en/security-sync' }
              ]
            },
            {
              text: 'Technical Whitepaper',
              items: [
                { text: 'Tech Spec', link: '/en/tech-spec' },
                { text: 'Crypto Protocol', link: '/en/crypto-protocol' },
                { text: 'Sync Algorithm', link: '/en/sync-algorithm' },
                { text: 'API Design', link: '/en/api-design' }
              ]
            },
            {
              text: 'Deployment',
              items: [
                { text: 'Deployment Guide', link: '/en/deployment' },
                { text: 'Contributing', link: '/en/contributing' }
              ]
            }
          ],
          '/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'WebSocket API', link: '/api/websocket-api' },
                { text: 'REST API', link: '/api/rest-api' }
              ]
            }
          ],
          '/changelog/': [
            {
              text: 'Version History',
              items: [
                { text: 'Overview', link: '/changelog/' },
                { text: 'v2.2.0 (EN)', link: '/changelog/en/v2.2.0' },
                { text: 'v2.2.0 (中文)', link: '/changelog/zh-CN/v2.2.0' }
              ]
            }
          ]
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'Note Sync Now',
      description: 'E2EE Note Sync Technical Whitepaper',
      themeConfig: {
        nav: [
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
      }
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    outline: { level: [2, 4], label: '页面导航' },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换' }
          }
        }
      }
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/AICL-Lab/brave-sync-notes' }
    ],
    footer: {
      message: '基于 MIT 协议开源',
      copyright: 'Copyright © 2026 AICL-Lab'
    },
    darkModeSwitchLabel: '切换主题',
    externalLinkIcon: true
  },

  vite: {
    plugins: [llmstxt()],
    build: {
      chunkSizeWarningLimit: 1000
    }
  }
}))
