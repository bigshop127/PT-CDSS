# Task Memory Log

## [2026-05-03]
### DIRECTIVE B5: Knowledge Query (RAG)
- **B5a**: Created isolated ingestion pipeline in `scripts/` using PDF-to-Vector (768-dim) logic.
- **B5b**: Implemented `KNOWLEDGE_QUERY` in Firebase Functions with Firestore Vector Search (`findNearest`). Updated UI to display citation cards in `ChatArea`.
### DIRECTIVE B4 & B6: Security & Backend Proxy
- **B6**: Implemented Firebase Functions proxy (`geminiProxy`) to handle Gemini API requests. Removed `@google/generative-ai` from frontend.
- **B4**: Shortened export signed URL expiration to 7 days and added `expiresAt` to response.
- **Status**: Completed, Verified, and Pushed to GitHub.
- **Cleanup**: Updated `firebase.json` to include both function codebases and removed `@google/generative-ai` from root `package.json`.
- **Commit**: `f20f87c` (Log), `de0d988` (Implementation)
### DIRECTIVE B1-SEC: Production Loading Fix & Console Cleanup
- **B1-SEC**: Fixed production loading hang in `App.tsx` by ensuring `isReady` state transitions even when no user session is found. Improved loading message to be environment-aware.
- **Cleanup**: Systematically removed `console.log` statements from `src/App.tsx`, `src/hooks/useProjectSync.ts`, `src/lib/firebase.ts`, and `src/store/useFlowStore.ts` to prepare for production.
- **Status**: Completed, Verified.
- **Commit**: `[PENDING]`

