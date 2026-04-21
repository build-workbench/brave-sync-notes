---
layout: home

hero:
  name: "Note Sync Now"
  text: "End-to-End Encrypted Sync"
  tagline: Real-time note synchronization with complete privacy. Your data is encrypted on your device and never readable by the server.
  image:
    src: /hero-illustration.svg
    alt: Note Sync Now
  actions:
    - theme: brand
      text: Get Started
      link: /en/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/LessUp/brave-sync-notes
    - theme: alt
      text: 中文文档
      link: /zh-CN/

features:
  - icon: 🔐
    title: End-to-End Encryption
    details: AES-256-GCM encryption ensures your notes are secure. Only you hold the keys derived from your 12-word mnemonic.
    link: /en/security-sync
  - icon: ⚡
    title: Real-time Synchronization
    details: WebSocket-powered instant sync across all your devices. Automatic chunked transfer for large content.
    link: /en/architecture
  - icon: 🔄
    title: Smart Conflict Resolution
    details: Three-way merge algorithm detects and helps resolve editing conflicts between devices.
    link: /en/security-sync#conflict-handling
  - icon: 💾
    title: Multi-Layer Storage
    details: Redis/SQLite persistence on server with automatic fallback. Local IndexedDB for offline access.
    link: /en/deployment
  - icon: 🚀
    title: Easy Deployment
    details: Docker-ready with minimal configuration. Runs on any platform with Node.js.
    link: /en/deployment
  - icon: 📱
    title: Mobile Ready
    details: Responsive design works on all devices. Scan QR code to instantly join sync chains.
    link: /en/getting-started
---

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Animate features on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
      }
    })
  }, { threshold: 0.1 })

  document.querySelectorAll('.VPFeature').forEach(el => {
    observer.observe(el)
  })
})
</script>

<style scoped>
.VPFeature {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.VPFeature.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.VPFeatures .container {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 2rem !important;
}

@media (max-width: 1024px) {
  .VPFeatures .container {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 640px) {
  .VPFeatures .container {
    grid-template-columns: 1fr !important;
  }
}
</style>

## Quick Start

```bash
# Clone repository
git clone https://github.com/LessUp/brave-sync-notes.git
cd brave-sync-notes

# Start server
cd apps/api && npm ci && node index.js

# Start client (new terminal)
cd apps/web && npm ci && npm run dev
```

That's it! Open [http://localhost:5173](http://localhost:5173) in your browser.

## Why Note Sync Now?

<FeatureCard 
  icon="🛡️"
  title="Privacy First"
  description="Your notes are encrypted before leaving your device. The server only relays ciphertext and cannot decrypt your content."
  :details="['Client-side AES-256-GCM encryption', 'Mnemonic-based key derivation', 'Zero-knowledge server design']"
  iconBg="linear-gradient(135deg, #10b981 0%, #3b82f6 100%)"
/>

<FeatureCard 
  icon="🔄"
  title="Always in Sync"
  description="Real-time collaboration across unlimited devices with intelligent conflict resolution."
  :details="['WebSocket bidirectional sync', 'Automatic reconnection', 'Three-way merge algorithm']"
  iconBg="linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)"
/>

## Architecture

```
┌─────────────┐      WebSocket       ┌─────────────┐
│   Client    │◄────────────────────►│   Server    │
│  (React)    │   Encrypted Data     │  (Express)  │
└─────────────┘                      └─────────────┘
       │                                    │
       │ Local Storage                       │ Redis/SQLite
       ▼                                    ▼
┌─────────────┐                      ┌─────────────┐
│  IndexedDB  │                      │ Persistence │
└─────────────┘                      └─────────────┘
```

## Documentation

| Resource | Link |
|----------|------|
| **Getting Started** | [English](/en/getting-started) · [中文](/zh-CN/getting-started) |
| **Architecture** | [English](/en/architecture) · [中文](/zh-CN/architecture) |
| **Deployment** | [English](/en/deployment) · [中文](/zh-CN/deployment) |
| **API Reference** | [WebSocket](/api/websocket-api) · [REST](/api/rest-api) |
| **Contributing** | [English](/en/contributing) · [中文](/zh-CN/contributing) |

## License

[MIT License](https://github.com/LessUp/brave-sync-notes/blob/main/LICENSE)
