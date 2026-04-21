# Project Philosophy: Spec-Driven Development (SDD)

This project strictly follows the **Spec-Driven Development (SDD)** paradigm. All code implementations must use the specification documents in the `/specs` directory as the Single Source of Truth.

## Directory Context

- `/specs/product/`: Product feature definitions and acceptance criteria
- `/specs/rfc/`: Technical design documents (Architecture RFCs)
- `/specs/api/`: API interface definitions (WebSocket and REST APIs)
- `/specs/db/`: Database model and schema definitions
- `/specs/testing/`: Testing strategy and correctness properties

## AI Agent Workflow Instructions

When you (the AI) are asked to develop a new feature, modify an existing feature, or fix a bug, **you must strictly follow this workflow without skipping any steps**:

### Step 1: Review Specs

- Before writing any code, first read the relevant documents in the `/specs` directory (product specs, RFCs, and API definitions).
- If the user's request conflicts with the existing specs, **immediately stop coding** and point out the conflict, asking the user whether to update the specs first.

### Step 2: Spec-First Update

- If this is a new feature, or if it requires changes to existing interfaces/database structures, **you must first propose modifying or creating the corresponding spec documents** (e.g., `openapi.yaml` or RFC documents).
- Wait for user confirmation of the spec modifications before proceeding to the code implementation phase.

### Step 3: Implementation

- When writing code, **100% comply with the spec definitions** (including variable naming, API paths, data types, status codes, etc.).
- **Do not add features not defined in the specs** (No Gold-Plating).

### Step 4: Test against Spec

- Write unit tests and integration tests based on the acceptance criteria in the `/specs` directory.
- Ensure test cases cover all boundary conditions described in the specs.
- Verify correctness properties defined in `/specs/testing/test-strategy.md`.

## Code Generation Rules

- Any API changes exposed externally must synchronize modifications to `/specs/api/websocket-api.yaml`.
- Any database schema changes must synchronize modifications to `/specs/db/schema-v1.dbml`.
- If uncertain about technical details, consult the architectural conventions in `/specs/rfc/`. Do not invent design patterns on your own.
- All new features must have corresponding product spec in `/specs/product/`.

## Why This Declaration?

1. **Prevent AI Hallucinations**: AI tends to "freely improvise" without context. Forcing it to read `/specs` in the first step anchors its thinking scope.
2. **Constrain Modification Path**: Declaring "modify specs before modifying code" ensures documentation and code stay synchronized (Document-Code Synchronization).
3. **Improve PR Quality**: When AI helps generate Pull Requests, the implementation will be highly aligned with business logic because it's developed based on the acceptance criteria you defined in the specs.

---

## Project-Specific Conventions

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| State Management | Zustand |
| Editor | CodeMirror 6 |
| Backend | Node.js + Express + Socket.IO |
| Storage | Redis / SQLite / IndexedDB |
| Testing | Vitest + Jest + fast-check |

### Code Style

- JavaScript (not TypeScript) for current implementation
- Use JSDoc comments for function documentation
- Follow ESLint configuration in project root
- Use `async/await` for asynchronous operations

### Naming Conventions

- Files: kebab-case (e.g., `useSocket.js`, `persistence-manager.js`)
- Functions: camelCase (e.g., `joinChain`, `pushUpdate`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_CHUNK_SIZE`)
- Classes: PascalCase (e.g., `PersistenceManager`)

### Error Handling

- Use structured error objects with `type`, `message`, `code`, and `recoverable` fields
- Follow error types defined in architecture spec
- Never expose encryption keys or sensitive data in error messages

---

## Quick Reference

### Key Files

- Client entry: `apps/web/src/App.jsx`
- Socket hook: `apps/web/src/hooks/useSocket.js`
- State store: `apps/web/src/store/useStore.js`
- Crypto module: `apps/web/src/utils/crypto`
- Server entry: `apps/api/index.js`
- Persistence manager: `apps/api/src/persistence/PersistenceManager.js`

### Important Specs

- [Product Requirements](./specs/product/note-sync-system.md)
- [Core Architecture](./specs/rfc/0001-core-architecture.md)
- [API Specification](./specs/api/websocket-api.yaml)
- [Database Schema](./specs/db/schema-v1.dbml)
- [Testing Strategy](./specs/testing/test-strategy.md)
