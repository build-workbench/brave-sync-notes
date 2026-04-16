# Changelog Directory

This directory contains the structured changelog for Note Sync Now.

---

## Structure

```
changelog/
├── index.md              # Changelog portal (bilingual)
├── README.md             # This file
├── en/                   # English release notes
│   └── v2.2.0.md        # Version-specific notes
└── zh-CN/               # Chinese release notes (中文发布说明)
    └── v2.2.0.md
```

---

## Purpose

The main changelog files (`CHANGELOG.md` and `CHANGELOG.zh-CN.md`) in the repository root contain the complete, machine-readable version history following the [Keep a Changelog](https://keepachangelog.com/) format.

This `changelog/` directory provides:

1. **Human-readable release notes**: Detailed explanations of each release
2. **Migration guides**: Step-by-step upgrade instructions
3. **Known issues**: Documented problems and workarounds
4. **Contributors**: Recognition for each release

---

## Adding Release Notes

When creating a new version release:

1. Update `CHANGELOG.md` and `CHANGELOG.zh-CN.md` (root level)
2. Create `changelog/en/vX.Y.Z.md`
3. Create `changelog/zh-CN/vX.Y.Z.md`
4. Update `changelog/index.md` to include the new version

---

## Format

Release notes should include:

- Overview/摘要
- New features/新功能
- Bug fixes/Bug 修复
- Security updates/安全更新 (if any)
- Performance improvements/性能改进 (if any)
- Migration guide/迁移指南
- Known issues/已知问题
- Contributors/贡献者

---

*Last updated: 2026-04-16*
