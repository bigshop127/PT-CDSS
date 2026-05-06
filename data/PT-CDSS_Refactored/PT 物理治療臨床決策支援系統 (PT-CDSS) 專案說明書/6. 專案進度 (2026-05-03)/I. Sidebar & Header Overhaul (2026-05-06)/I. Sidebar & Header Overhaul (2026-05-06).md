# I. Sidebar & Header Overhaul (2026-05-06)

## 執行摘要 (Executive Summary)
因應使用者的緊急需求，我們修復了 CI/CD 建置時發生的套件引入錯誤 (`DropdownMenuLabel`)。並完成了以下三項核心功能升級，同時保存至 Obsidian 進行雙向同步。

## 實作細節 (Implementation Details)

### 1. 互動式深邃側邊欄 (Interactive Sidebar)
- **新增增刪功能**：針對「筆記本」、「GEM 資源」、「資料夾」與「對話紀錄」四大區塊，加入「新增」按鈕與「刪除 (Trash2)」浮動圖示。
- **GEM 專區**：將原有的 GEM 項目調整為專屬放置 `.md` 與 `SKILL` 等平台製作檔案的位置，並配上合適的圖示 (`FileCode`, `FileText`)。

### 2. Google 書籤式下拉選單 (Google Bookmark Style Dropdowns)
- **Radix UI 整合**：導入 `@radix-ui/react-dropdown-menu`。
- **雲端結構映射**：將頂部 Header 原本的按鈕改為下拉選單，點開後會展開類似 Google 書籤的階層。
- **目錄與檔案關聯**：選單內會展示對應資料夾內的代表性檔案，並附帶外部連結圖示 (`ExternalLink`)，點擊可直接開啟 Google 雲端硬碟。

### 3. 系統穩定度修復 (System Stability)
- 修正 `DropdownMenuLabel` 重複宣告的 TypeScript 錯誤，確保 `npm run build` 通過。

## 驗證結果 (Validation)
- **Build 測試**：執行 `npm run build` 完全通過，無 TypeScript 錯誤。
- **元件互動**：側邊欄的增刪操作能正確更新狀態；Header 下拉選單能正確展開。

## 下一步 (Next Steps)
- 待使用者休息完畢後，繼續進行 **Cervical/Lumbar 兩章節的文本轉 JSON 格式** 任務。