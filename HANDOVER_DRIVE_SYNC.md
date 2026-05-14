# PT-CDSS Google Drive 實時同步功能實作任務 (Handover)

## 當前進度摘要 (2026-05-14)
- **問題**：Library (知識庫) UI 顯示資料夾為 "(空)"，因為 `src/store/useLibraryStore.ts` 內使用的是硬編碼的 mock 資料，未與雲端同步。
- **目標**：實現真正的雙向同步。UI 必須反映 Google Drive 資料夾 `1OslCCU-8tY3y9p084hWJeO78o7HKIYug` 的真實結構與檔案連結。
- **環境**：React (Vite) + Tailwind + Zustand + Firebase (Functions/Firestore)。

## 指令集 (Directives for next session)

### 1. 後端 (Firebase Functions) 實作
- **目標**：建立 `fetchDriveContent` 雲端函數。
- **工具**：使用 `googleapis` (Google Drive API v3)。
- **邏輯**：
    - 遞歸遍歷根目錄 `1OslCCU-8tY3y9p084hWJeO78o7HKIYug`。
    - 提取 `id`, `name`, `mimeType`, `webViewLink`。
    - 將結果轉換為前端 `LibraryFolder` 格式。
- **權限**：確保 Service Account 有權限讀取該共用連結資料夾。

### 2. 前端 (Zustand Store) 串接
- **目標**：修改 `src/store/useLibraryStore.ts`。
- **變更**：
    - 新增 `fetchCloudLibrary()` 非同步 action。
    - 呼叫 Firebase HTTPS Callable function (`fetchDriveContent`)。
    - 更新 `libraryFolders` 狀態，用真實數據替換 `INITIAL_LIBRARY`。
- **持久化**：確保資料在重新整理後依然正確，或在 `App.tsx` 初始化時觸發同步。

### 3. UI 點擊事件綁定
- **目標**：修改 `src/components/layout/AppSidebar.tsx` 或 `Workspace.tsx`。
- **邏輯**：
    - 確保 `LibraryFile` 的 `url` 正確指向 Google Drive 的 `webViewLink`。
    - 點擊檔案時使用 `window.open(url, '_blank')`。

## 待確認事項
- 是否需要實施快取機制（例如存入 Firestore）以減少 API 呼叫次數。
- 是否需要前端「手動同步」按鈕。

---
**請依照此計畫，接續完成實時同步功能的代碼撰寫與部署。**
