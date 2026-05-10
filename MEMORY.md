# Task Memory Log

## [2026-05-10]
### BUGFIX: Firebase Auth Configuration Error
- **Issue**: Live site `pt-cdss.web.app` reported `auth/configuration-not-found`.
- **Root Cause**: `.env.local` contained dummy values (`pt-cdss-dummy`), which were baked into the production build during deployment.
- **Fix**: Updated `.env.local` with real credentials retrieved via `firebase apps:sdkconfig`. Verified build success.
- **Action Required**: User needs to run `npm run deploy` to update the live site and ensure GitHub Secrets match these values.
- **Status**: Completed (Local Fix), Pending (Live Deploy).

## [2026-05-09]
### DIRECTIVE H1: Handover Documentation
- **H1**: 生成完整專案交接報告書 `HANDOVER_REPORT.md`，涵蓋已完成功能、待辦事項及未來優化方向。
- **H1-DOC**: 同步更新至結構化文檔目錄 `data/PT-CDSS_Refactored/.../7. 專案交接 (Handover).md`。
- **Status**: Completed.

## [2026-05-06]
### DIRECTIVE C2: User Onboarding & Google Auth
- **C2**: 實作 Google 登入與新手引導流程，強制新用戶連結個人 API Key。
- **C2-STORE**: 建立 `useUserStore.ts` 實現 API Key 的本地持久化儲存 (Privacy-First)。
- **C2-UI**: 新增 `Onboarding` 組件與 `Card` UI 基礎。
- **Status**: Completed, Verified (via `npm run build`), and Pushed to GitHub.

### DIRECTIVE C1: CI/CD Deployment & Hosting
- **C1**: 實作 Firebase Hosting 與 GitHub Actions 自動化部署流程。
- **C1-INFRA**: 配置 `firebase.json` 與 `.firebaserc`，並在 GitHub Secrets 設定環境變數。
- **C1-FIX**: 修復 `AppSidebar.tsx` 重複 import 導致的編譯錯誤。
- **Status**: Completed, Verified (via `npm run deploy`), and Pushed to GitHub.
- **URL**: [https://pt-cdss.web.app](https://pt-cdss.web.app)

### DIRECTIVE B10: Ribbon Toolbar & Header Refinement
- **B10**: 實作 Microsoft Word 風格的 Ribbon 工具列，支援底線、對齊、螢光筆等多項功能。
- **B10-UI**: 將 Header 的資料夾圖示放大 2 倍，並將編輯器內容清空為空白畫布。
- **Status**: Completed, Verified (via `npm run build`), and Pushed to GitHub.

### DIRECTIVE B9: UI/UX Premium Beautification
- **B9**: 全面升級為 Refined Hybrid 視覺風格。實作 Header 玻璃擬物化 (Glassmorphism)、深邃側邊欄 (Slate-950)、紙張感編輯器與 AI 對話區視覺強化。
- **Status**: Completed, Verified (via `npm run build`), and Pushed to GitHub.
- **Commit**: (Pending push)

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

