import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { locales } from './locales'
import { head } from './head'
import { viteConfig } from './vite'

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

  head,

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

  locales,

  themeConfig: {
    logo: {
      light: '/logo.svg',
      dark: '/logo-dark.svg'
    },
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

  mermaid: {
    // 参考: https://mermaid.js.org/config/theming.html
    theme: 'base',
    themeVariables: {
      primaryColor: '#3b82f6',
      primaryTextColor: '#1e3a5f',
      primaryBorderColor: '#3b82f6',
      lineColor: '#94a3b8',
      secondaryColor: '#f1f5f9',
      tertiaryColor: '#e2e8f0',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }
  },

  vite: viteConfig
}))
