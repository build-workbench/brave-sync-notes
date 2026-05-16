import type { UserConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export const viteConfig: UserConfig['vite'] = {
  plugins: [llmstxt()],
  build: {
    chunkSizeWarningLimit: 1000
  }
}
