# Security & Stability Refactoring

Date: 2026-03-09

## Security Fixes

### Server: Input validation and rate limiting on push-update (Critical)
- `push-update` handler accepted `encryptedData` without any size or type validation — a malicious client could send arbitrarily large payloads to exhaust server memory (DoS)
- Added validation: `encryptedData` must be a string, max 5MB
- Added per-socket rate limiting: max 30 updates per minute (generous for real-time editing, blocks abuse)
- Added `timestamp` type validation

### Client: PBKDF2 salt hardcoded (Breaking Change)
- PBKDF2 used a hardcoded salt `"brave-sync-demo-salt"` for ALL users — weakens resistance to rainbow table attacks
- Salt is now derived from the mnemonic itself: `SHA256("notesync-salt:" + mnemonic)`, giving each mnemonic a unique salt while remaining deterministic across devices
- Increased PBKDF2 iterations from 1,000 to 10,000 for stronger key stretching
- **Breaking change**: existing sync chains will need to re-create (old encrypted data won't be decryptable with the new key derivation)

## Stability Fixes

### Server: chainStore memory leak
- Room cleanup only ran every 60 minutes and only evicted rooms with no clients older than 24h
- Rooms with at least one connected client could grow unbounded, leading to memory exhaustion on long-running servers
- Added `MAX_MEMORY_ROOMS` hard cap (default 10,000, configurable via env)
- Two-phase cleanup: 1) evict expired clientless rooms, 2) evict oldest clientless rooms when over capacity
- Reduced cleanup interval from 60min to 30min

### Client: Socket event listener leak on rapid joinChain calls
- When `joinChain` was called rapidly (e.g., user switching chains), old socket async event handlers could fire after the new socket was created, causing stale state updates
- Fix: set `socketRef.current = null` BEFORE removing listeners on the old socket — prevents any async handlers from accessing the stale reference
- Cancel pending debounced pushes from previous session
- Clear pending chunk reassembly state from previous session

## Version
- Server: 1.0.0 → 2.0.0

### Files Modified
- `brave-sync-notes/server/index.js` — input validation, rate limiting, memory cap
- `brave-sync-notes/client/src/utils/crypto.js` — mnemonic-derived PBKDF2 salt, 10K iterations
- `brave-sync-notes/client/src/hooks/useSocket.js` — socket teardown race fix
- `brave-sync-notes/server/package.json` — version bump
