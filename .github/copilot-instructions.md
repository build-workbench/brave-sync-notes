# GitHub Copilot Instructions for Note Sync Now

## Project Overview

This is an end-to-end encrypted note synchronization system with real-time sync, offline support, and multi-device collaboration. The project follows **Spec-Driven Development** using OpenSpec.

## Technology Stack

- **Frontend**: React 18 + Vite 5 + Tailwind CSS + Zustand + CodeMirror 6
- **Backend**: Node.js 20 + Express 5 + Socket.IO 4
- **Storage**: Redis / SQLite (server), IndexedDB / LocalStorage (client)
- **Testing**: Vitest (frontend), Jest (backend), fast-check (property-based)
- **Documentation**: VitePress

## Code Conventions

### Language
- JavaScript (ES2022+), not TypeScript
- JSDoc comments for documentation
- `async/await` for async operations

### Naming
- Files: `kebab-case.js`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Classes/Components: `PascalCase`

### File Organization
```
apps/
├── web/               # Frontend (React + Vite)
│   └── src/
│       ├── components/   # React components
│       ├── hooks/        # Custom hooks
│       ├── store/        # Zustand store
│       └── utils/        # Utility functions
└── api/               # Backend (Express + Socket.IO)
    ├── index.js          # Server entry
    └── src/
        └── persistence/  # Storage adapters
```

## Key Patterns

### State Management (Zustand)
```javascript
// useStore.js pattern
import { create } from 'zustand';

const useStore = create((set, get) => ({
  // State
  data: null,
  // Actions
  setData: (data) => set({ data }),
  // Computed
  getData: () => get().data,
}));
```

### Socket Events
- Client → Server: `join-chain`, `push-update`, `request-sync`
- Server → Client: `sync-update`, `sync-request`, `error`

### Encryption
- AES-256-GCM for content encryption
- PBKDF2 (100,000 iterations) for key derivation
- 12-word BIP39 mnemonic for key recovery

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Property-based tests
npm run test:property
```

## Important Files

| File | Purpose |
|------|---------|
| `apps/web/src/App.jsx` | Main React component |
| `apps/web/src/hooks/useSocket.js` | WebSocket connection |
| `apps/web/src/store/useStore.js` | Global state |
| `apps/web/src/utils/crypto.js` | Encryption utilities |
| `apps/api/index.js` | Server entry point |

## Spec-Driven Development

Before implementing new features, check the specs in `/specs/`:
- Product requirements: `/specs/product/`
- API definitions: `/specs/api/`
- Architecture: `/specs/rfc/`

For changes, use OpenSpec workflow:
1. `/opsx:propose <name>` - Create proposal
2. `/opsx:apply` - Implement tasks
3. `/opsx:archive` - Archive completed change

## Error Handling

Use structured error objects:
```javascript
{
  type: 'ERROR_TYPE',
  message: 'Human-readable message',
  code: 'ERROR_CODE',
  recoverable: true/false
}
```

Never expose encryption keys in error messages.
