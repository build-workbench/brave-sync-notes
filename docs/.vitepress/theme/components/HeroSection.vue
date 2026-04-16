<template>
  <div class="hero-section">
    <div class="hero-content">
      <div class="hero-badge">
        <span class="badge-version">v2.2.0</span>
        <span class="badge-separator">•</span>
        <span class="badge-text">MIT Licensed</span>
      </div>
      
      <h1 class="hero-title">
        <span class="gradient-text">Note Sync Now</span>
      </h1>
      
      <p class="hero-subtitle">
        End-to-end encrypted note synchronization
      </p>
      
      <p class="hero-description">
        Real-time collaboration and multi-device sync with complete privacy. 
        Your notes, encrypted on your device, never readable by the server.
      </p>
      
      <div class="hero-actions">
        <a href="/brave-sync-notes/en/getting-started" class="hero-button primary">
          Get Started
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
        <a href="https://github.com/LessUp/brave-sync-notes" class="hero-button secondary" target="_blank">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          GitHub
        </a>
      </div>
      
      <div class="hero-features">
        <div class="feature-tag">
          <span class="feature-icon">🔐</span>
          <span>E2E Encryption</span>
        </div>
        <div class="feature-tag">
          <span class="feature-icon">⚡</span>
          <span>Real-time Sync</span>
        </div>
        <div class="feature-tag">
          <span class="feature-icon">🔄</span>
          <span>Conflict Resolution</span>
        </div>
      </div>
    </div>
    
    <div class="hero-visual">
      <div class="code-window">
        <div class="code-header">
          <div class="code-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="code-title">terminal</div>
        </div>
        <div class="code-content">
          <pre><code><span class="code-prompt">$</span> <span class="code-command">git clone</span> https://github.com/LessUp/brave-sync-notes.git
<span class="code-output">Cloning into 'brave-sync-notes'...</span>

<span class="code-prompt">$</span> <span class="code-command">cd</span> brave-sync-notes/server && npm ci
<span class="code-output">added 127 packages in 2s</span>

<span class="code-prompt">$</span> <span class="code-command">node</span> index.js
<span class="code-success">✓ Server listening on port 3002</span>

<span class="code-prompt">$</span> <span class="code-command">cd</span> ../client && npm run dev
<span class="code-success">✓ Ready on http://localhost:5173</span></code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  min-height: calc(100vh - 64px);
  padding: 4rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.badge-version {
  background: linear-gradient(135deg, var(--vp-c-brand-1), #8b5cf6);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 600;
}

.badge-separator {
  color: var(--vp-c-text-3);
}

.badge-text {
  color: var(--vp-c-text-2);
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0;
}

.hero-subtitle {
  font-size: 1.75rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin: 0;
}

.hero-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--vp-c-text-3);
  max-width: 480px;
  margin: 0;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.hero-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-button.primary {
  background: linear-gradient(135deg, var(--vp-c-brand-1), #8b5cf6);
  color: white;
}

.hero-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 40px -10px rgba(59, 130, 246, 0.5);
}

.hero-button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.hero-button.secondary:hover {
  background: var(--vp-c-bg-mute);
  border-color: var(--vp-c-text-3);
}

.hero-button .icon {
  width: 1.25rem;
  height: 1.25rem;
}

.hero-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.feature-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 9999px;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.feature-icon {
  font-size: 1rem;
}

/* Code Window */
.hero-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}

.code-window {
  width: 100%;
  max-width: 520px;
  background: #1e1e2e;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.code-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #181825;
  border-bottom: 1px solid #313244;
}

.code-dots {
  display: flex;
  gap: 0.5rem;
}

.code-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.code-dots span:nth-child(1) { background: #f38ba8; }
.code-dots span:nth-child(2) { background: #fab387; }
.code-dots span:nth-child(3) { background: #a6e3a1; }

.code-title {
  flex: 1;
  text-align: center;
  font-size: 0.75rem;
  color: #6c7086;
  font-family: var(--vp-font-family-mono);
}

.code-content {
  padding: 1.5rem;
  overflow-x: auto;
}

.code-content pre {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
  line-height: 1.8;
  color: #cdd6f4;
}

.code-prompt {
  color: #6c7086;
}

.code-command {
  color: #89b4fa;
}

.code-output {
  color: #6c7086;
}

.code-success {
  color: #a6e3a1;
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-section {
    grid-template-columns: 1fr;
    gap: 3rem;
    text-align: center;
    min-height: auto;
    padding: 3rem 1.5rem;
  }
  
  .hero-title {
    font-size: 3rem;
  }
  
  .hero-subtitle {
    font-size: 1.5rem;
  }
  
  .hero-description {
    max-width: 100%;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .hero-features {
    justify-content: center;
  }
  
  .code-window {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2.25rem;
  }
  
  .hero-actions {
    flex-direction: column;
  }
  
  .hero-button {
    justify-content: center;
  }
}
</style>
