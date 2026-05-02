# 物理治療臨床思維共做平台 (PT Clinical Decision Support System)

## 1. 系統定位與核心目標
本系統是一個專為物理治療師設計的「雙人 + 雙 AI」臨床決策共做平台。將 22 本原文書結構化為 5 步驟臨床思維，並透過 React Flow 提供視覺化的決策樹繪製、AI 實時協作與紅旗警示防護，最終可導出具備醫療專業排版的靜態圖卡。

## 2. 技術棧 (Tech Stack)
* **前端:** React, React Flow, Zustand (狀態管理), Tailwind CSS, shadcn/ui.
* **後端與資料庫:** Firebase Firestore, Firebase Callable Functions (2nd Gen), App Check.
* **版本控制與同步:** GitHub (`https://github.com/bigshop127/PT-CDSS.git`)。所有更動需定期提交並推送到 GitHub 確保雲端與本地同步。
* **微服務 (影像導出):** Google Cloud Run (Docker), Node.js, Puppeteer, Handlebars.
* **AI 引擎:** Gemini 1.5 Flash (意圖路由), Gemini 3.1 Pro (臨床推演與畫布驅動).

## 3. 核心架構與模組規範

### A. 資料庫架構 (Firestore + RBAC)
* **雙層架構:** `knowledge_base` (知識庫，僅管理員寫入/全域唯讀) 與 `projects` (協作專案，依成員名單讀寫)。
* **版本控制:** 採用「主文件 + `versions` 子集合」儲存完整 JSON 快照，主文件僅保留最新狀態。
* **決策日誌:** `decision_log` 記錄每一次的防呆核准理由與 AI 草圖選擇，確保臨床溯源。

### B. 前端視覺與協作機制 (React Flow)
* **紅旗防護 (Red Flags):** 具備 [紅旗] 標籤的節點使用 Tailwind `animate-pulse` 特效。定案時，系統強制檢查未轉診/排除的紅旗，並透過 shadcn/ui Dialog 攔截，要求輸入至少 15 字排除理由。
* **權限移交:** 採用「建立者預設擔任 Session Owner」機制，支援一鍵 Request Control 移交寫入權限。
* **語義壓縮器 (Semantic Compressor):** 前端攔截高頻拖曳事件 (Debounce)，壓縮成單一語義系統訊息再發送給 AI，保護 Context Window。

### C. AI 通訊與路由 (3-Tier Pipeline)
* **Layer 1 (前端):** Regex 與長度過濾。
* **Layer 2 (Gemini Flash):** 意圖分類器，純輸出 JSON `{ "intent": "CANVAS_EDIT" | "KNOWLEDGE_QUERY" | "CHIT_CHAT" }`。
* **Layer 3 (Gemini Pro):** 根據意圖動態載入 Prompt。若為 CANVAS_EDIT，則輸出 JSON 以驅動 Ghost Node (半透明建議節點)。衝突時在畫布並列顯示，由 Owner 抉擇。

### D. 影像導出微服務 (Cloud Run)
* **資料流:** 前端透過 Callable Function 傳遞 `{projectId, chartId, version}`，後端透過 ADC (Application Default Credentials) 讀取 Firestore，不傳送龐大 Payload。
* **渲染引擎:** 1. Node.js `TreeBuilder` 使用 DFS 將平面 JSON 轉換為樹狀階層。
    2. Handlebars 渲染白底黑字、高對比的 HTML (包含 QR Code 與文獻清單)。
    3. Puppeteer 截圖並上傳至 Firebase Storage，回傳 URL。
* **效能防護:** Docker 必須配置 `--disable-dev-shm-usage`，Node.js 需使用 `p-limit` 控制並發佇列，防止 OOM。