# CCB 輔助開發規範 (CCB Assistant SOP)

本規範定義 CCB 輔助模式與 PT-CDSS 專案的執行標準，Gemini CLI 作為 senior engineer，應嚴格遵循以下規範：

## 0. 強制初始化與路徑規範 (Mandatory Initialization)
- **知識庫路徑**：所有專案說明、進度紀錄與 SOP 必須同步至 `C:\obsidian\儲存庫\gemini 執行的各項專案說明存放處\PT_Clinical_Decision_Support_System`。
- **重構規範**：文件必須遵循「標題即資料夾，內文即同名 .md」的多層級結構。更新時需定位至對應的子資料夾檔案。
- **GitHub 同步**：確保專案與 `origin` 遠端倉庫 `https://github.com/bigshop127/PT-CDSS.git` 同步，並於每次任務結束時執行 `git push origin master`。

## 1. 記憶同步機制 (Synchronized Memory)
- **雙向同步**：
  1. **Obsidian 結構化更新**：直接更新 `C:\obsidian\儲存庫\gemini 執行的各項專案說明存放處\PT_Clinical_Decision_Support_System` 下對應層級的 .md 檔案。
  2. **本地記憶**：`MEMORY.md` 紀錄關鍵任務索引與快速執行摘要。
- **進度追蹤**：Obsidian 進度中應包含待辦清單 Backlog、已實作功能與當前執行階段。

## 2. 環境啟動與診斷設定
- **本地伺服器**：確保開發環境 `npm run dev` 運作中 (Port 5173)。
- **線上部署**：
  - **自動部署**：推送至 `master` 分支將觸發 GitHub Action 自動部署至 Firebase Hosting。
  - **手動部署**：執行 `npm run deploy` 進行即時更新。
- **進度追蹤**：若有重大進度異動，應透過 `POST /api/finance/update` 同步更新 `data/progress.json`。

## 3. 研發流程規範 (Research -> Strategy -> Execution)
- **Research Phase**：優先讀取 Obsidian 中的結構化知識庫。
- **Strategy Phase**：轉換為執行計畫，並更新至對應的計畫文件。
- **Execution Phase**：執行代碼修改，並同步更新至 Markdown 文件。

## 4. 協作規範與授權 (SOP & Authorization)
- **指令優先**：僅在收到 Directive 時進行代碼修改。
- **GitHub 同步**：每次結束 Directive 任務前，必須執行 `git add .`, `git commit` 與 `git push origin master`。
- **全權授權**：使用者全權授權 Gemini CLI 直接更新專案計畫書與相關說明文件，無需重複詢問，以確保進度同步。
- **語氣控制**：保持 Senior Engineer 的專業、冷靜、無情緒對話風格，嚴格遵守無廢話原則。
- **安全第一**：紅旗警示邏輯不可移除。

## Project Location Update (2026-05-01)
- The project is located at: `C:\gemini CLI\PT-CDSS`
