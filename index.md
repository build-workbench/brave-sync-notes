# Note Sync Now - Documentation Index

Welcome to the Note Sync Now project documentation. This index provides quick access to all documentation resources.

## 📋 Specifications (Single Source of Truth)

All technical and product specifications are in the `/specs` directory:

| Document | Description |
|----------|-------------|
| [Product Requirements](./specs/product/note-sync-system.md) | Feature definitions, user stories, and acceptance criteria |
| [Core Architecture (RFC 0001)](./specs/rfc/0001-core-architecture.md) | System architecture, data flow, and component design |
| [Comprehensive Refactor (RFC 0002)](./specs/rfc/0002-comprehensive-refactor.md) | Storage integration, offline mode, multi-note support |
| [WebSocket API](./specs/api/websocket-api.yaml) | Socket.IO events and payloads |
| [Database Schema](./specs/db/schema-v1.dbml) | Server-side persistence data model |
| [Testing Strategy](./specs/testing/test-strategy.md) | Test frameworks and correctness properties |

**Full specs index**: [specs/README.md](./specs/README.md)

## 📚 User & Developer Guides

### Quick Start

- [README.md](./README.md) - Project overview and quick start (English)
- [README.zh-CN.md](./README.zh-CN.md) - 项目概述和快速开始 (中文)
- [Getting Started](./docs/en/getting-started.md) - Installation and setup
  - [中文版](./docs/zh-CN/getting-started.md)

### Architecture & Design

- [Architecture](./docs/en/architecture.md) - System boundary and core modules
  - [中文版](./docs/zh-CN/architecture.md)
- [Security & Sync](./docs/en/security-sync.md) - Encryption and synchronization details
  - [中文版](./docs/zh-CN/security-sync.md)
- [Deployment](./docs/en/deployment.md) - Production deployment guide
  - [中文版](./docs/zh-CN/deployment.md)

### Contributing

- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [AI Agent Configuration](./AGENTS.md) - Spec-driven development workflow for AI assistants

### Releases

- [CHANGELOG.md](./CHANGELOG.md) - Version history (English)
  - [中文版](./CHANGELOG.zh-CN.md)
- [Changelog Directory](./changelog/) - Detailed release notes

## 🤖 For AI Agents

If you're an AI assistant working on this project, read [AGENTS.md](./AGENTS.md) first. It contains:

- Spec-Driven Development workflow rules
- Project conventions and coding standards
- Key file locations and important paths
- Code generation guidelines

## 📁 Documentation Directories

```
brave-sync-notes/
├── specs/                  # 📋 Specifications (Single Source of Truth)
│   ├── product/            # Product requirements
│   ├── rfc/                # Technical design documents (RFCs)
│   ├── api/                # API interface definitions
│   ├── db/                 # Database schema definitions
│   └── testing/            # Testing strategy
├── docs/                   # 📚 User & Developer Guides
│   ├── en/                 # English documentation
│   ├── zh-CN/              # Chinese documentation
│   ├── api/                # API reference
│   ├── setup/              # Setup guides
│   ├── tutorials/          # Tutorials
│   └── architecture/       # Architecture docs
├── changelog/              # 📜 Version history
│   ├── en/                 # English changelog
│   └── zh-CN/              # Chinese changelog
├── AGENTS.md               # 🤖 AI Agent configuration
├── CONTRIBUTING.md         # 🤝 Contributing guide
├── README.md               # 📖 Project overview (English)
└── README.zh-CN.md         # 📖 项目概述 (中文)
```

## 🌐 External Resources

- **Documentation Site**: https://lessup.github.io/brave-sync-notes/
- **GitHub Repository**: https://github.com/LessUp/brave-sync-notes
- **Issues**: https://github.com/LessUp/brave-sync-notes/issues
- **Discussions**: https://github.com/LessUp/brave-sync-notes/discussions
