# Note Sync Now - Documentation Index

Welcome to the Note Sync Now project documentation. This index provides quick access to all documentation resources.

## 📋 Specifications (Single Source of Truth)

All technical and product specifications are in the `/specs` directory:

| Document | Description |
|----------|-------------|
| [Product Requirements](./specs/product/note-sync-system.md) | Feature definitions, user stories, and acceptance criteria |
| [Core Architecture](./specs/rfc/0001-core-architecture.md) | System architecture, data flow, and component design |
| [WebSocket API](./specs/api/websocket-api.yaml) | Socket.IO events and payloads |
| [Database Schema](./specs/db/schema-v1.dbml) | Server-side persistence data model |
| [Testing Strategy](./specs/testing/test-strategy.md) | Test frameworks and correctness properties |

**Full specs index**: [specs/README.md](./specs/README.md)

## 📚 User & Developer Guides

### Quick Start

- [README.md](./README.md) - Project overview and quick start
- [Getting Started](./docs/en/getting-started.md) - Installation and setup
  - [中文版](./docs/zh-CN/getting-started.md)

### Architecture & Design

- [Architecture](./architecture.md) - System boundary and core modules
- [Security & Sync](./security-sync.md) - Encryption and synchronization details
- [Deployment](./deployment.md) - Production deployment guide

### Contributing

- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [AI Agent Configuration](./AGENTS.md) - Spec-driven development workflow for AI assistants

### Releases

- [CHANGELOG.md](./CHANGELOG.md) - Version history
  - [中文版](./CHANGELOG.zh-CN.md)
- [Release Notes v2.2.0](./RELEASE_NOTES_v2.2.0.md)

## 🤖 For AI Agents

If you're an AI assistant working on this project, read [AGENTS.md](./AGENTS.md) first. It contains:

- Spec-Driven Development workflow rules
- Project conventions and coding standards
- Key file locations and important paths
- Code generation guidelines

## 📁 Documentation Directories

- `/specs/` - Technical and product specifications
- `/docs/` - User guides, tutorials, and supplementary docs
  - `/docs/setup/` - Environment setup guides
  - `/docs/tutorials/` - User tutorials
  - `/docs/architecture/` - High-level architecture
  - `/docs/assets/` - Images and static resources
  - `/docs/en/` - English documentation (legacy)
  - `/docs/zh-CN/` - Chinese documentation (legacy)
  - `/docs/api/` - API reference documentation

## 🌐 External Resources

- **Documentation Site**: https://lessup.github.io/brave-sync-notes/
- **GitHub Repository**: https://github.com/LessUp/brave-sync-notes
- **Issues**: https://github.com/LessUp/brave-sync-notes/issues
- **Discussions**: https://github.com/LessUp/brave-sync-notes/discussions
