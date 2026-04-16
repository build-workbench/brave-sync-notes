<template>
  <div class="feature-card" :class="{ 'feature-highlight': highlight }">
    <div class="feature-icon-wrapper" :style="{ background: iconBg }">
      <span class="feature-icon">{{ icon }}</span>
    </div>
    <h3 class="feature-title">{{ title }}</h3>
    <p class="feature-description">{{ description }}</p>
    <div v-if="details" class="feature-details">
      <ul>
        <li v-for="detail in details" :key="detail">{{ detail }}</li>
      </ul>
    </div>
    <a v-if="link" :href="link" class="feature-link">
      Learn more
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </a>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: Array,
    default: () => []
  },
  link: {
    type: String,
    default: ''
  },
  highlight: {
    type: Boolean,
    default: false
  },
  iconBg: {
    type: String,
    default: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
  }
})
</script>

<style scoped>
.feature-card {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
  border-color: var(--vp-c-brand-1);
}

.feature-highlight {
  border-color: var(--vp-c-brand-1);
  background: linear-gradient(180deg, var(--vp-c-bg) 0%, var(--vp-c-brand-soft) 100%);
}

.feature-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  margin-bottom: 1.25rem;
}

.feature-icon {
  font-size: 1.75rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.75rem;
}

.feature-description {
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0 0 1rem;
  flex: 1;
}

.feature-details {
  margin-bottom: 1rem;
}

.feature-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-details li {
  position: relative;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.feature-details li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.feature-details li + li {
  margin-top: 0.375rem;
}

.feature-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  transition: gap 0.2s ease;
}

.feature-link:hover {
  gap: 0.625rem;
}

.feature-link svg {
  width: 1rem;
  height: 1rem;
}
</style>
