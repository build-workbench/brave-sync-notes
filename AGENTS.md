# Project Philosophy: Spec-Driven Development with OpenSpec

This project follows **Spec-Driven Development (SDD)** powered by **OpenSpec** for change management. All code implementations must use the specification documents in `/specs` as the Single Source of Truth.

## Directory Context

### Tier 1: Stable Specifications (`/specs/`)
- `/specs/product/` - Product feature definitions and acceptance criteria
- `/specs/rfc/` - Technical design documents (Architecture RFCs)
- `/specs/api/` - API interface definitions (WebSocket and REST APIs)
- `/specs/db/` - Database model and schema definitions
- `/specs/testing/` - Testing strategy and correctness properties

### Tier 2: Change Management (`/openspec/`)
- `/openspec/changes/` - Active change proposals
- `/openspec/specs/` - Delta specs during development
- `/openspec/schemas/` - Custom schema definitions

## AI Agent Workflow Instructions

When you (the AI) are asked to develop a new feature, modify an existing feature, or fix a bug, **follow the appropriate workflow below**:

### Workflow A: New Feature or Significant Change

Use OpenSpec to manage the change through its full lifecycle:

#### 1. Explore (Optional)
If requirements are unclear, use exploration mode:
```
/opsx:explore
```
Have a conversation to clarify requirements before creating a formal proposal.

#### 2. Propose the Change
```
/opsx:propose "<change-name>"
```
This creates a structured change proposal with:
- `proposal.md` - What & Why
- `design.md` - How (technical approach)
- `tasks.md` - Implementation checklist
- `specs/` - Delta specs for this change

#### 3. Review References
Check `proposal.md` for related specs. Read referenced specs in `/specs/` before designing.

#### 4. Implement
```
/opsx:apply
```
Work through tasks in `tasks.md`, marking each complete as you progress.

#### 5. Archive
```
/opsx:archive
```
- Moves change to `openspec/changes/archive/`
- Merges verified delta specs into stable specs

### Workflow B: Bug Fix or Minor Change

For small fixes that don't require full change management:

1. **Review relevant specs** in `/specs/` first
2. **If interface changes needed** → Use Workflow A
3. **If code-only fix** → Implement and verify tests pass
4. **Update spec** if the fix reveals spec was incorrect

### Workflow C: Spec Conflict Resolution

If user's request conflicts with existing specs:

1. **Stop coding immediately**
2. Point out the conflict with specific spec references
3. Ask user whether to:
   - Update specs first (use Workflow A)
   - Modify the request to comply with specs
   - Proceed with explicit spec exception

## Spec Reference Quick Guide

| What You're Building | Primary Spec | Related Specs |
|---------------------|--------------|---------------|
| New user feature | `/specs/product/note-sync-system.md` | Related RFC |
| API endpoint/event | `/specs/api/websocket-api.yaml` | RFC, DB schema |
| Database changes | `/specs/db/schema-v1.dbml` | API spec |
| Test requirements | `/specs/testing/test-strategy.md` | Product specs |
| Architecture guidance | `/specs/rfc/0001-core-architecture.md` | All specs |

## Capabilities

This project is organized into capabilities, each referencing multiple specs:

| Capability | Product Req | RFC | API | Tests |
|------------|-------------|-----|-----|-------|
| sync-core | Req 1 | RFC 0001 | websocket-api.yaml | Props 1-2 |
| conflict-resolution | Req 2 | RFC 0001 §2 | - | Props 3-4 |
| multi-notebook | Req 3 | RFC 0002 §4 | - | Prop 5 |
| offline-mode | Req 4 | RFC 0002 §3 | - | Prop 4 |
| version-history | Req 5 | RFC 0002 §5 | - | Props 6-10 |
| encryption | - | RFC 0001 | - | Props |
| storage | Req 1 | - | - | schema-v1.dbml |

See `/openspec/specs/capabilities/` for detailed capability specs.

## Delta Specs Format

When proposing changes that affect existing specs, use delta format:

### API Changes (`specs/api-delta.yaml`)
```yaml
base: specs/api/websocket-api.yaml
change_type: extend  # extend | modify | deprecate

additions:
  events:
    client:
      - name: new-event-name
        payload: { field: type }
    server:
      - name: server-event-name
        payload: { field: type }
```

### Database Changes (`specs/db-delta.dbml`)
```dbml
// Base: specs/db/schema-v1.dbml

Table new_table {
  id varchar [pk]
  field type
  created_at timestamp
}
```

## Code Generation Rules

1. **Reference specs before coding** - Always read related specs first
2. **100% spec compliance** - Follow interface definitions exactly
3. **No gold-plating** - Don't add features not in specs
4. **Test against properties** - Verify correctness properties in `/specs/testing/`
5. **Update specs when design changes** - Keep specs and code synchronized
6. **Use RFC 2119 keywords** - SHALL, MUST, SHOULD, MAY in specs

## Project Conventions

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State Management | Zustand |
| Editor | CodeMirror 6 |
| Backend | Node.js + Express 5 + Socket.IO 4 |
| Storage | Redis / SQLite / IndexedDB |
| Testing | Vitest + Jest + fast-check |

### Code Style
- JavaScript (not TypeScript) for current implementation
- Use JSDoc comments for function documentation
- Follow ESLint configuration in project root
- Use `async/await` for asynchronous operations

### Naming Conventions
- Files: `kebab-case.js`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Classes: `PascalCase`

### Error Handling
- Use structured error objects: `{ type, message, code, recoverable }`
- Never expose encryption keys in error messages
- Follow error types defined in architecture spec

## OpenSpec Commands

| Command | Purpose |
|---------|---------|
| `/opsx:propose <name>` | Create new change proposal |
| `/opsx:explore` | Explore ideas before proposing |
| `/opsx:apply` | Implement tasks from active change |
| `/opsx:archive` | Archive completed change |

## Key Files

| Purpose | File |
|---------|------|
| Client entry | `apps/web/src/App.jsx` |
| Socket hook | `apps/web/src/hooks/useSocket.js` |
| State store | `apps/web/src/store/useStore.js` |
| Crypto module | `apps/web/src/utils/crypto` |
| Server entry | `apps/api/index.js` |
| Persistence | `apps/api/src/persistence/PersistenceManager.js` |

## Important Specs

- [Product Requirements](./specs/product/note-sync-system.md)
- [Core Architecture](./specs/rfc/0001-core-architecture.md)
- [API Specification](./specs/api/websocket-api.yaml)
- [Database Schema](./specs/db/schema-v1.dbml)
- [Testing Strategy](./specs/testing/test-strategy.md)

## Why This Declaration?

1. **Prevent AI Hallucinations**: Forcing AI to read `/specs` first anchors its thinking scope
2. **Constrain Modification Path**: "Modify specs before code" ensures documentation-code synchronization
3. **Improve PR Quality**: Implementation aligns with business logic defined in specs
4. **Change Tracking**: OpenSpec provides audit trail of all changes
