import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './custom.css'
import FeatureCard from './components/FeatureCard.vue'
import HeroSection from './components/HeroSection.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // Add custom slots here
    })
  },
  enhanceApp({ app }) {
    // Register custom components
    app.component('FeatureCard', FeatureCard)
    app.component('HeroSection', HeroSection)
    app.component('LanguageSwitcher', LanguageSwitcher)
  }
}
