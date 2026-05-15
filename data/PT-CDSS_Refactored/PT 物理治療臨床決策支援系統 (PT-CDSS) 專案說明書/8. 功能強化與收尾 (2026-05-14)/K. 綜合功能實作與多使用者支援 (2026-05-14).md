# K. 綜合功能實作與多使用者支援 (2026-05-14)

## 1. 執行目標
因應使用者回饋，針對 PT-CDSS 進行了八項核心功能的強化與實作，並修正了部署過程中的 CI 建置錯誤，完成階段性收尾。

## 2. 實作重點
### A. NotebookLM 與多使用者登入 (Auth & Library)
- **多使用者隔離**：升級 `useUserStore`，將使用者的 API Key、姓名、職稱與模型偏好 (如 `gemini-2.0-flash`) 透過 Firebase Firestore 進行雙向同步，確保不同醫師登入時的資料隔離與持久化。
- **NotebookLM 整合**：將筆記本狀態移至 `useLibraryStore`，並在側邊欄支援一鍵開啟外部 NotebookLM 網址。

### B. 資料夾導覽與 Google Doc 風格編輯器 (Editor & Navigation)
- **多層級導覽列**：實作頂部下拉選單 (DropdownMenu)，可動態讀取 `useLibraryStore` 內容，支援無限層級的資料夾展開，並能直接導向 Google Drive 雲端連結。
- **資料夾強化**：支援自定義顏色標籤與「加入對話分析」關聯功能。
- **編輯器強化**：導入 `@tiptap/react/menus` 的 `BubbleMenu` 實現選取文字後彈出的快捷格式選單；並將原有的單純備註升級為具備「回覆」與「解決 (Resolve)」功能的臨床討論系統。

### C. 互動式心智圖 (Interactive Mind Map)
- 將 `InsightPane` 的靜態畫布全面升級為 `ReactFlow`。
- 支援手動新增節點、拖拉佈局、縮小地圖 (MiniMap) 導覽，並與 AI 生成的 Ghost Nodes 完美整合。
- 支援一鍵匯出為 Mermaid 流程圖代碼，方便記錄臨床決策路徑。

## 3. 異常修復紀錄 (CI Build Fix)
- **問題描述**：推送到 GitHub Actions 後，因 TypeScript 型別檢查與套件匯入錯誤導致 `build` 失敗。
- **修復內容**：
  1. 修正 `BubbleMenu` 的匯入路徑為 `@tiptap/react/menus` 並移除不支援的 `tippyOptions` 屬性。
  2. 修正 `RedFlagNode` 的預設匯出 (default export) 引用錯誤。
  3. 補上 `lucide-react` 中缺失的 `Cpu` 圖示匯入。
- **結果**：本地 `npm run build` 成功，並已推送至 `master`，CI 燈號轉綠。

## 4. 結語
此階段大幅提升了 PT-CDSS 的實用性與專業感，使其不僅具備 AI 決策支援能力，更能作為日常物理治療病歷撰寫、團隊討論與知識管理的強大平台。
