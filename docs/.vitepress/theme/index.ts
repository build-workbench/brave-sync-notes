import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'
import mermaid from 'mermaid'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {})
  },
  setup() {
    const { isDark } = useData()

    const initMermaid = (dark: boolean) => {
      mermaid.initialize({
        startOnLoad: true,
        theme: dark ? 'dark' : 'base',
        themeVariables: dark ? {
          primaryColor: '#60a5fa',
          primaryTextColor: '#dbeafe',
          primaryBorderColor: '#60a5fa',
          lineColor: '#64748b',
          secondaryColor: '#1e3a5f',
          tertiaryColor: '#1e293b',
          background: '#0f172a',
          mainBkg: '#1e3a5f',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        } : {
          primaryColor: '#3b82f6',
          primaryTextColor: '#1e3a5f',
          primaryBorderColor: '#3b82f6',
          lineColor: '#94a3b8',
          secondaryColor: '#f1f5f9',
          tertiaryColor: '#e2e8f0',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        },
        flowchart: {
          curve: 'basis',
          padding: 15
        },
        sequence: {
          mirrorActors: false
        }
      })
    }

    onMounted(() => {
      initMermaid(isDark.value)
    })

    watch(isDark, (dark) => {
      // 刷新页面以重新渲染 Mermaid 图表
      // 这是一个简单的解决方案，确保图表正确渲染
      nextTick(() => {
        location.reload()
      })
    })
  }
} satisfies Theme
