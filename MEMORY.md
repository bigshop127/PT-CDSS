# Task Memory Log

## [2026-05-05]
### DIRECTIVE B8: InsightPane Mermaid 流程圖匯出
- **B8**: Implemented Mermaid flowchart export functionality (`nodesToMermaid`) in `src/lib/mermaidExport.ts` mapping Zustand store `nodes`/`edges` to a formatted `.mmd` string strictly adhering to export styling rules. Updated `InsightPane.tsx` with a live visualizer (stats mapping) and an export button to trigger browser download of `PT-CDSS.mmd`.
- **Status**: Completed, Verified (via `tsc --noEmit`), and Pushed to GitHub.
- **Commit**: `23432cb`

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
### DIRECTIVE B3-SEC: Ghost Node Style Cleanup
- **B3-SEC**: Updated `acceptAllGhostNodes` in `useFlowStore` to clear `borderStyle: dashed` by resetting `style` to `{ opacity: 1, border: undefined }`. Removed style spread to ensure clean state transition.
- **Status**: Completed, Verified, and Pushed to GitHub.
- **Commit**: `6807b8b`

