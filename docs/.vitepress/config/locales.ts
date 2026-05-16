import type { DefaultTheme } from 'vitepress'
import { navZh, navEn } from './nav'
import { sidebarZh, sidebarEn, sidebarApi, sidebarChangelog } from './sidebar'

type LocaleConfig = DefaultTheme.Config['locales']

export const locales: LocaleConfig = {
  root: {
    label: '简体中文',
    lang: 'zh-CN',
    title: 'Note Sync Now',
    description: '端到端加密笔记同步技术白皮书',
    themeConfig: {
      nav: navZh,
      sidebar: {
        ...sidebarZh,
        ...sidebarApi,
        ...sidebarChangelog
      },
      editLink: {
        pattern: 'https://github.com/AICL-Lab/brave-sync-notes/edit/main/docs/:path',
        text: '在 GitHub 上编辑此页'
      },
      docFooter: {
        prev: '上一页',
        next: '下一页'
      },
      lastUpdated: {
        text: '最后更新于',
        formatOptions: {
          dateStyle: 'short',
          timeStyle: 'short'
        }
      },
      outline: {
        label: '页面导航'
      },
      returnToTopLabel: '返回顶部',
      sidebarMenuLabel: '菜单',
      darkModeSwitchLabel: '切换主题',
      lightModeSwitchTitle: '切换到浅色模式',
      darkModeSwitchTitle: '切换到深色模式'
    }
  },
  en: {
    label: 'English',
    lang: 'en-US',
    link: '/en/',
    title: 'Note Sync Now',
    description: 'E2EE Note Sync Technical Whitepaper',
    themeConfig: {
      nav: navEn,
      sidebar: {
        ...sidebarEn,
        ...sidebarApi,
        ...sidebarChangelog
      },
      editLink: {
        pattern: 'https://github.com/AICL-Lab/brave-sync-notes/edit/main/docs/:path',
        text: 'Edit this page on GitHub'
      },
      docFooter: {
        prev: 'Previous',
        next: 'Next'
      },
      lastUpdated: {
        text: 'Last updated',
        formatOptions: {
          dateStyle: 'short',
          timeStyle: 'short'
        }
      },
      outline: {
        label: 'On this page'
      },
      returnToTopLabel: 'Return to top',
      sidebarMenuLabel: 'Menu',
      darkModeSwitchLabel: 'Toggle theme',
      lightModeSwitchTitle: 'Switch to light theme',
      darkModeSwitchTitle: 'Switch to dark theme'
    }
  }
}
