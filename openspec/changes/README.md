# OpenSpec Changes

This directory contains **active change proposals** and **archived changes**.

## Directory Structure

```
openspec/changes/
├── <active-change>/       # Change currently being worked on
│   ├── .openspec.yaml     # Change metadata
│   ├── proposal.md        # What & Why
│   ├── design.md          # How (technical approach)
│   ├── tasks.md           # Implementation checklist
│   └── specs/             # Delta specs for this change
│
└── archive/               # Completed changes
    └── YYYY-MM-DD-<change-name>/
```

## Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OpenSpec Change Workflow                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /opsx:explore          /opsx:propose        /opsx:apply            │
│       │                      │                    │                  │
│       ▼                      ▼                    ▼                  │
│  ┌─────────┐           ┌──────────┐         ┌──────────┐           │
│  │ Explore │ ───────▶  │ Propose  │ ─────▶  │  Apply   │           │
│  │ Ideas   │           │  Change  │         │  Tasks   │           │
│  └─────────┘           └──────────┘         └──────────┘           │
│                              │                    │                  │
│                              │                    │                  │
│                              ▼                    ▼                  │
│                        ┌──────────┐         ┌──────────┐           │
│                        │ proposal │         │  Code    │           │
│                        │ specs/   │         │  Changes │           │
│                        │ design   │         └──────────┘           │
│                        │ tasks    │                                │
│                        └──────────┘                                │
│                                               │                     │
│                                               ▼                     │
│                                        ┌──────────┐                 │
│  /opsx:archive  ───────────────────▶  │  Archive │                 │
│                                       └──────────┘                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Commands

| Command | Purpose |
|---------|---------|
| `/opsx:explore` | Explore ideas before creating a proposal |
| `/opsx:propose "<name>"` | Create a new change proposal |
| `/opsx:apply` | Implement tasks from active change |
| `/opsx:archive` | Archive completed change |

## Change Files

### proposal.md
- **Why**: Problem or opportunity being addressed
- **What Changes**: Specific changes being made
- **Capabilities**: Affected capabilities (new/modified)
- **Impact**: Affected code, APIs, systems

### design.md
- **Context**: Background and constraints
- **Goals/Non-Goals**: What is and isn't in scope
- **Decisions**: Technical choices with rationale
- **Risks**: Known risks and mitigations

### tasks.md
- Grouped by phase/area
- Checkbox format: `- [ ] X.Y Task description`
- Tasks should be verifiable

### specs/
- Delta specs for this change
- `api-delta.yaml` for API changes
- `db-delta.dbml` for database changes
- Capability specs for new requirements

## Creating a Change

```bash
# Start exploring an idea
/opsx:explore
> I want to add markdown export for notes

# Create formal proposal
/opsx:propose "add-markdown-export"

# Implement
/opsx:apply

# Archive when complete
/opsx:archive
```

## CLI Commands

```bash
# List active changes
openspec list

# View change details
openspec show <change-name>

# Check change status
openspec status --change <change-name>
```
