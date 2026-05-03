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
- **Obsidian**: Updated `PT_Clinical_Decision_Support_System.md`.
