---
layout: default
title: Contributing Guide
description: Contribution workflow, validation commands, and documentation/changelog expectations for Note Sync Now
permalink: /docs/en/contributing/
lang: en
---

# Contributing to Note Sync Now

Thank you for your interest in contributing to Note Sync Now! This guide will help you get started with the development workflow.

---

## 🌐 Language / 语言

[English](./) | [简体中文](../zh-CN/contributing.md)

---

## 📋 Table of Contents

- [Quick Links](#quick-links)
- [Ways to Contribute](#ways-to-contribute)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Testing Guidelines](#testing-guidelines)
- [Code Style](#code-style)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Documentation Expectations](#documentation-expectations)
- [Security Considerations](#security-considerations)
- [Getting Help](#getting-help)

---

## Quick Links

| Resource | Link |
|----------|------|
| Documentation Home | https://lessup.github.io/brave-sync-notes/ |
| Repository Overview | https://lessup.github.io/brave-sync-notes/overview/ |
| Changelog | https://lessup.github.io/brave-sync-notes/changelog/ |
| Issues | https://github.com/LessUp/brave-sync-notes/issues |
| Discussions | https://github.com/LessUp/brave-sync-notes/discussions |

---

## Ways to Contribute

### 🐛 Report Bugs

- Check if the issue already exists
- Include reproduction steps
- Provide environment details (OS, Node version, browser)
- Include error messages and logs

### 💡 Request Features

- Describe the use case
- Explain the proposed solution
- Discuss alternatives considered

### 📝 Improve Documentation

- Fix typos and unclear explanations
- Add examples and tutorials
- Translate to other languages
- Update outdated information

### 🔧 Submit Code Changes

- Bug fixes
- Performance improvements
- New features
- Test coverage improvements

---

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/brave-sync-notes.git
cd brave-sync-notes
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements

### 3. Make Changes

- Keep commits small and focused
- Write clear commit messages
- Add tests for new functionality
- Update documentation as needed

### 4. Run Local Validation

```bash
# Client validation
cd apps/web
npm ci
npm test -- --run
npm run build

# Server validation
cd ../api
npm ci
npm test

# Property-based testing (recommended for sync/persistence changes)
npm run test:property
```

### 5. Update Changelog

Every change set should include a changelog entry. See [Changelog](/changelog/).

### 6. Submit Pull Request

- Provide clear description of changes
- Reference related issues
- Include screenshots for UI changes
- Ensure all CI checks pass

---

## Project Structure

```
brave-sync-notes/
├── apps/
│   ├── web/                  # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── store/       # Zustand state management
│   │   │   └── utils/       # Utility functions
│   │   ├── tests/           # Test files
│   │   └── package.json
│   └── api/                  # Express + Socket.IO backend
│       ├── src/
│       │   └── persistence/ # Storage adapters
│       ├── tests/           # Test files
│       └── package.json
├── docs/                     # Documentation
├── changelog/                # Version history
└── .github/workflows/        # CI/CD configuration
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm 9+
- Redis 7+ (optional, for production-like environment)

### Quick Start

```bash
# Terminal 1: Start server
cd apps/api
npm ci
node index.js

# Terminal 2: Start client
cd apps/web
npm ci
npm run dev
```

Access the application at `http://localhost:5173`.

---

## Testing Guidelines

### Test Organization

| Type | Location | Command |
|------|----------|---------|
| Unit Tests | `*/tests/*.test.js` | `npm test` |
| Integration Tests | `server/tests/*.test.js` | `npm test` |
| Property Tests | `server/tests/property/*.test.js` | `npm run test:property` |
| E2E Tests | Planned | - |

### Writing Tests

- Test behavior, not implementation
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies

Example:

```javascript
describe('useSocket', () => {
  it('should establish connection on joinChain', async () => {
    // Arrange
    const mnemonic = generateTestMnemonic();
    
    // Act
    const result = await joinChain(mnemonic);
    
    // Assert
    expect(result.connected).toBe(true);
    expect(result.roomId).toBeDefined();
  });
});
```

### Test Coverage Requirements

- New features: >80% coverage
- Bug fixes: Include regression test
- Critical paths: 100% coverage (encryption, sync)

---

## Code Style

### General Principles

- Keep functions small and focused (single responsibility)
- Prefer clear naming over short names
- Avoid deep nesting (max 3 levels)
- Limit function parameters (max 4, use object for more)

### JavaScript/React Guidelines

```javascript
// ✅ Good: Descriptive names, early returns
function encryptContent(content, mnemonic) {
  if (!content || !mnemonic) {
    throw new Error('Content and mnemonic required');
  }
  
  const key = deriveKey(mnemonic);
  return aesEncrypt(content, key);
}

// ❌ Avoid: Cryptic names, deep nesting
function enc(c, m) {
  if (c && m) {
    const k = doStuff(m);
    if (k) {
      return doMore(c, k);
    }
  }
}
```

### File Organization

- One component per file (React)
- Group related utilities in modules
- Keep test files alongside source or in `tests/` directory

---

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Build process or auxiliary tool changes |

### Examples

```
feat(sync): add chunked transfer for large content

Implements automatic splitting of content larger than 50KB
into multiple chunks for reliable WebSocket transmission.

Closes #123
```

```
fix(crypto): correct PBKDF2 salt derivation

Changes salt from hardcoded value to mnemonic-derived value
for improved security. Breaking change: existing chains must
be recreated.

Security: CVE-2026-XXXX
```

---

## Documentation Expectations

### When to Update Documentation

- New features: Add usage documentation
- API changes: Update API reference
- Configuration changes: Update deployment guide
- Breaking changes: Include migration guide

### Documentation Structure

- Keep root documentation aligned with GitHub Pages site
- Prefer updating relevant overview/architecture/deployment/security pages
- Avoid duplicating explanations across files
- Update both docs and changelog in the same PR

### Bilingual Documentation

- Primary changes should be made in English (`docs/en/`)
- Chinese translations follow in `docs/zh-CN/`
- Keep both versions synchronized

---

## Security Considerations

### Do NOT Commit

- API keys
- Passwords
- Private tokens
- `.env` files with real values
- Test credentials for production services

### Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. Email security concerns to: security@lessup.dev (or project maintainer)
3. Allow time for remediation before public disclosure
4. Credit will be given in security advisory

### Security Checklist

- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] Rate limiting considered
- [ ] Dependencies updated (`npm audit`)
- [ ] Secure defaults configured

---

## Getting Help

### Communication Channels

- **General Questions**: GitHub Discussions
- **Bug Reports**: GitHub Issues
- **Security Issues**: Private email
- **Real-time Chat**: (if available)

### Before Asking

1. Check existing documentation
2. Search closed issues
3. Provide minimal reproduction case
4. Include environment details

---

## Recognition

Contributors will be recognized in:

- Release notes for significant contributions
- CONTRIBUTORS.md file (if created)
- Git commit history (of course!)

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Publishing others' private information
- Other conduct that could reasonably be considered inappropriate

---

Thank you for contributing to Note Sync Now! 🎉

---

*Last updated: 2026-04-16*
