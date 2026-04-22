---
layout: home

hero:
  name: "Note Sync Now"
  text: "端到端加密笔记同步"
  tagline: 你的笔记，只有你能读懂。无需账户，扫码即用，多设备实时同步。
  image:
    src: /app-screenshot.png
    alt: Note Sync Now 应用截图
  actions:
    - theme: brand
      text: 快速开始
      link: /zh-CN/getting-started
    - theme: alt
      text: 在线演示
      link: https://demo.note-sync.now
    - theme: alt
      text: GitHub
      link: https://github.com/LessUp/brave-sync-notes

features:
  - icon: 🔐
    title: 端到端加密
    details: AES-256-GCM 加密，只有你持有密钥。服务器只转发密文，无法读取内容。
  - icon: ⚡
    title: 实时同步
    details: WebSocket 双向通信，毫秒级同步。大文件自动分块传输，断线自动重连。
  - icon: 🔄
    title: 智能冲突解决
    details: 三路合并算法检测编辑冲突，可视化差异对比，一键解决冲突。
  - icon: 📱
    title: 扫码即用
    details: 无需注册账户，扫描二维码即可加入同步链，支持无限设备。
  - icon: 💾
    title: 离线可用
    details: IndexedDB 本地存储，离线编辑自动队列，上线后自动同步。
  - icon: 🚀
    title: 一键部署
    details: Docker 镜像开箱即用，支持 Redis/SQLite 持久化，K8s 友好。
---

<script setup>
import { ref, onMounted } from 'vue'

const stats = ref([
  { value: '0ms', label: '同步延迟' },
  { value: '256-bit', label: '加密强度' },
  { value: '∞', label: '设备数量' },
  { value: '100%', label: '隐私保护' }
])

const techStack = ref([
  'React 18', 'Vite 5', 'Express', 'Socket.IO', 'Redis', 'SQLite', 'IndexedDB', 'Docker'
])

const securityFeatures = ref([
  { icon: '🔑', title: '客户端加密', desc: '所有数据在离开设备前已加密' },
  { icon: '🧠', title: '助记词恢复', desc: '12 个单词恢复所有数据' },
  { icon: '🔐', title: '零知识服务', desc: '服务器无法解密任何内容' },
  { icon: '🛡️', title: '本地存储', desc: '数据只存于你的设备' }
])
</script>

<div class="stats-section">
  <div class="stat-item" v-for="stat in stats" :key="stat.label">
    <div class="stat-value">{{ stat.value }}</div>
    <div class="stat-label">{{ stat.label }}</div>
  </div>
</div>

## 为什么选择 Note Sync Now？

<FeatureCard
  icon="🛡️"
  title="隐私至上"
  description="你的笔记在离开设备前就已加密。服务器只是密文的中转站，永远无法读取你的内容。"
  :details="['客户端 AES-256-GCM 加密', 'PBKDF2 派生密钥，暴力破解不可行', '零知识架构设计']"
  iconBg="linear-gradient(135deg, #10b981 0%, #3b82f6 100%)"
/>

<FeatureCard
  icon="⚡"
  title="极致体验"
  description="无需注册，无需登录。扫描二维码即可在任意设备间同步笔记，支持实时协作编辑。"
  :details="['WebSocket 实时双向同步', '断线自动重连恢复', '大文件智能分块传输']"
  iconBg="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
/>

<FeatureCard
  icon="🔄"
  title="冲突智能解决"
  description="多设备同时编辑不再头疼。智能检测冲突，可视化差异对比，轻松合并变更。"
  :details="['三路合并算法', '可视化差异对比', '一键解决冲突']"
  iconBg="linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
/>

## 安全机制

<div class="security-grid">
  <div class="security-item" v-for="feature in securityFeatures" :key="feature.title">
    <div class="security-icon">{{ feature.icon }}</div>
    <div class="security-content">
      <h4>{{ feature.title }}</h4>
      <p>{{ feature.desc }}</p>
    </div>
  </div>
</div>

## 技术栈

<div class="tech-stack">
  <span class="tech-badge" v-for="tech in techStack" :key="tech">{{ tech }}</span>
</div>

## 快速开始

<div class="quick-start-steps">
  <div class="quick-start-step">
    <div class="step-number">1</div>
    <div class="step-title">启动服务端</div>
    <div class="step-description">
      <code>docker run -p 3002:3002 lessup/note-sync-server</code>
    </div>
  </div>
  <div class="quick-start-step">
    <div class="step-number">2</div>
    <div class="step-title">打开网页</div>
    <div class="step-description">
      访问 http://localhost:3002，点击「新建同步链」
    </div>
  </div>
  <div class="quick-start-step">
    <div class="step-number">3</div>
    <div class="step-title">扫码加入</div>
    <div class="step-description">
      在其他设备扫描二维码，输入助记词即可同步
    </div>
  </div>
</div>

<div class="cta-section">
  <h2>准备好了吗？</h2>
  <p>开始使用端到端加密的笔记同步服务</p>
  <div class="cta-buttons">
    <a href="/zh-CN/getting-started" class="cta-button primary">
      开始使用
    </a>
    <a href="https://github.com/LessUp/brave-sync-notes" class="cta-button secondary" target="_blank">
      查看源码
    </a>
  </div>
</div>

<style scoped>
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  padding: 2rem 0;
  margin: 2rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: 0.5rem;
}

.security-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.security-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
}

.security-item:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.security-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  font-size: 1.5rem;
}

.security-content h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.security-content p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.tech-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
}

.tech-badge:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.quick-start-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.quick-start-step {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
}

.quick-start-step:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.step-title {
  font-weight: 600;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
  color: var(--vp-c-text-1);
}

.step-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.step-description code {
  display: block;
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  font-size: 0.8rem;
  overflow-x: auto;
}

.cta-section {
  text-align: center;
  padding: 4rem 2rem;
  margin: 3rem 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-radius: 24px;
  border: 1px solid var(--vp-c-divider);
}

.cta-section h2 {
  margin-top: 0 !important;
  margin-bottom: 0.5rem !important;
  font-size: 2rem !important;
  border: none !important;
  padding: 0 !important;
}

.cta-section p {
  max-width: 400px;
  margin: 0 auto 1.5rem !important;
  color: var(--vp-c-text-2);
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.cta-button.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 15px -3px rgba(59, 130, 246, 0.5);
}

.cta-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(59, 130, 246, 0.6);
}

.cta-button.secondary {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.cta-button.secondary:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

@media (max-width: 960px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-start-steps {
    grid-template-columns: 1fr;
  }

  .security-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stat-value {
    font-size: 1.75rem;
  }

  .cta-section {
    padding: 2.5rem 1.5rem;
  }

  .cta-section h2 {
    font-size: 1.5rem !important;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .cta-button {
    width: 100%;
    max-width: 280px;
    justify-content: center;
  }
}
</style>
