import type { HeadConfig } from 'vitepress'

export const head: HeadConfig[] = [
  ['meta', { charset: 'UTF-8' }],
  ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
  ['meta', { name: 'theme-color', content: '#3b82f6' }],
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:site_name', content: 'Note Sync Now' }],
]
