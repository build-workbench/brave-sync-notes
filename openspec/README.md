# OpenSpec Integration Guide

This document explains how OpenSpec integrates with the Note Sync Now project's existing specification system.

## Overview

OpenSpec provides a **change-driven workflow** for AI-assisted development. It complements our existing `specs/` directory structure.

## Directory Structure

```
brave-sync-notes/
├── specs/                    # Stable specifications (Single Source of Truth)
│   ├── product/              # Product requirements
│   ├── rfc/                  # Technical design documents
│   ├── api/                  # API interface definitions
│   ├── db/                   # Database schema
│   └── testing/              # Testing strategy
│
├── openspec/                 # OpenSpec working directory
│   ├── config.yaml           # OpenSpec configuration
│   ├── specs/                # Delta specs (from changes)
│   └── changes/              # Active change proposals
│       ├── <change-name>/    # Individual change
│       │   ├── .openspec.yaml    # Change metadata
│       │   ├── proposal.md       # What & Why
│       │   ├── design.md         # How (technical approach)
│       │   ├── tasks.md          # Implementation checklist
│       │   └── specs/            # Delta specs for this change
│       └── archive/          # Completed changes
```

## Workflow

### 1. Propose a Change
```
/opsx:propose "add markdown export feature"
```
This creates a new change folder with:
- `proposal.md` - What we're building and why
- `design.md` - Technical approach
- `tasks.md` - Implementation checklist
- `specs/` - Delta specs (changes to existing specs)

### 2. Implement the Change
```
/opsx:apply
```
Claude works through the tasks checklist, marking each complete.

### 3. Archive the Change
```
/opsx:archive
```
- Moves change to `openspec/changes/archive/`
- Optionally merges delta specs into `openspec/specs/`
- Updates stable specs in `specs/` as needed

### 4. Explore Before Proposing
```
/opsx:explore
```
Have a conversation about what to build before creating a formal proposal.

## Integration with Existing Specs

### Two-Tier Spec System

| Directory | Purpose | Status |
|-----------|---------|--------|
| `specs/` | Stable, approved specifications | Single Source of Truth |
| `openspec/specs/` | Delta specs from active changes | Working drafts |

### When to Update specs/

1. **New feature** → Create change in `openspec/changes/`, implement, then merge relevant specs
2. **Bug fix** → Small changes may not need spec updates
3. **Architecture change** → Update RFCs in `specs/rfc/` after implementation

### Referencing Existing Specs

When proposing changes, Claude can reference:
- `specs/product/note-sync-system.md` - Product requirements
- `specs/rfc/0001-core-architecture.md` - System architecture
- `specs/api/websocket-api.yaml` - API definitions
- `specs/db/schema-v1.dbml` - Database schema
- `specs/testing/test-strategy.md` - Testing requirements

## Available Commands

| Command | Description |
|---------|-------------|
| `/opsx:propose` | Create a new change with all artifacts |
| `/opsx:explore` | Explore ideas before committing |
| `/opsx:apply` | Implement tasks from a change |
| `/opsx:archive` | Archive a completed change |

## Best Practices

1. **Reference existing specs** when proposing changes
2. **Update specs/** only after implementation is verified
3. **Use `/opsx:explore`** for complex decisions before proposing
4. **Keep changes focused** - one feature per change
5. **Archive promptly** after implementation

## Example: Adding a New Feature

```bash
# 1. Start exploring
/opsx:explore
> I want to add a markdown export feature for notes

# 2. Create proposal
/opsx:propose "add-markdown-export"

# 3. Review generated files
# - openspec/changes/add-markdown-export/proposal.md
# - openspec/changes/add-markdown-export/design.md
# - openspec/changes/add-markdown-export/tasks.md

# 4. Implement
/opsx:apply

# 5. Archive when done
/opsx:archive
```

## CLI Commands

```bash
# List active changes
openspec list

# View a specific change
openspec show <change-name>

# Check artifact status
openspec status --change <change-name>

# View available schemas
openspec schemas
```
