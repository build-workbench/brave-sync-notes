import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // Site Metadata
  title: 'Note Sync Now',
  titleTemplate: ':title | Note Sync Now',
  description: 'End-to-end encrypted note synchronization - Real-time collaboration and multi-device sync',
  
  // Clean URLs
  cleanUrls: true,
  
  // Base URL for GitHub Pages
  base: '/brave-sync-notes/',
  
  // Head - SEO & Meta
  head: [
    ['meta', { charset: 'UTF-8' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { name: 'msapplication-TileColor', content: '#3b82f6' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }],
    
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { property: 'og:site_name', content: 'Note Sync Now' }],
    ['meta', { property: 'og:image', content: 'https://lessup.github.io/brave-sync-notes/og-image.png' }],
    
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@LessUp' }],
    ['meta', { name: 'twitter:image', content: 'https://lessup.github.io/brave-sync-notes/og-image.png' }],
    
    // Fonts
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap', rel: 'stylesheet' }],
    
    // Structured Data
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Note Sync Now',
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    })]
  ],
  
  // Last Updated
  lastUpdated: {
    text: 'Last updated',
    formatOptions: {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  },
  
  // Markdown Settings
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },
  
  // Theme Configuration
  themeConfig: {
    // Logo
    logo: '/logo.svg',
    
    // Site Title
    siteTitle: 'Note Sync Now',
    
    // Navigation
    nav: [
      { text: 'Guide', link: '/en/getting-started', activeMatch: '/en/' },
      { text: 'API', link: '/api/websocket-api', activeMatch: '/api/' },
      { text: 'Changelog', link: '/changelog/', activeMatch: '/changelog/' },
      {
        text: 'v2.2.0',
        items: [
          { text: 'Release Notes', link: '/changelog/en/v2.2.0' },
          { text: 'Contributing', link: '/en/contributing' },
          { text: 'GitHub', link: 'https://github.com/LessUp/brave-sync-notes' }
        ]
      }
    ],
    
    // Sidebar for English docs
    sidebar: {
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
    
    // Social Links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/LessUp/brave-sync-notes' }
    ],
    
    // Search Configuration
    search: {
      provider: 'local'
    },
    
    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 LessUp'
    },
    
    // Outline
    outline: {
      level: [2, 4],
      label: 'On this page'
    },
    
    // Dark mode switch
    darkModeSwitchLabel: 'Appearance',
    
    // External link icon
    externalLinkIcon: true
  },
  
  // Vite Configuration
  vite: {
    css: {
      devSourcemap: true
    },
    build: {
      chunkSizeWarningLimit: 1000
    }
  }
})
