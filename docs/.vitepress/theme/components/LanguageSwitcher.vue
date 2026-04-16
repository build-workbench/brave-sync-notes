<template>
  <div class="language-switcher">
    <button 
      class="switcher-button"
      @click="isOpen = !isOpen"
      :aria-expanded="isOpen"
    >
      <svg class="globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        <path d="M2 12h20"/>
      </svg>
      <span class="current-lang">{{ currentLang === 'zh-CN' ? '中文' : 'EN' }}</span>
      <svg class="chevron-icon" :class="{ 'is-open': isOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </button>
    
    <transition name="dropdown">
      <div v-show="isOpen" class="dropdown-menu" @click="isOpen = false">
        <a 
          v-for="lang in languages" 
          :key="lang.code"
          :href="getLangLink(lang.code)"
          class="lang-option"
          :class="{ active: currentLang === lang.code }"
        >
          <span class="lang-flag">{{ lang.flag }}</span>
          <span class="lang-name">{{ lang.name }}</span>
        </a>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const isOpen = ref(false)
const { page } = useData()

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' }
]

const currentLang = computed(() => {
  const path = page.value.relativePath
  if (path.startsWith('zh-CN/')) return 'zh-CN'
  return 'en'
})

const getLangLink = (targetLang) => {
  const path = page.value.relativePath
  const currentPath = path.replace(/^(en\/|zh-CN\/)?/, '').replace(/\.md$/, '')
  
  if (targetLang === 'en') {
    return `/brave-sync-notes/en/${currentPath}`
  } else {
    return `/brave-sync-notes/zh-CN/${currentPath}`
  }
}

// Close dropdown when clicking outside
const closeDropdown = (e) => {
  if (!e.target.closest('.language-switcher')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.language-switcher {
  position: relative;
}

.switcher-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
}

.switcher-button:hover {
  border-color: var(--vp-c-text-3);
  color: var(--vp-c-text-1);
}

.globe-icon {
  width: 1rem;
  height: 1rem;
}

.current-lang {
  min-width: 2rem;
}

.chevron-icon {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform 0.2s ease;
}

.chevron-icon.is-open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 160px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 0.375rem;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}

/* Transition animations */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 8px;
  text-decoration: none;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  transition: all 0.15s ease;
}

.lang-option:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.lang-option.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.lang-flag {
  font-size: 1rem;
}
</style>
