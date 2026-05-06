# 🚀 PT-CDSS CI/CD 部署與自動化上線紀錄 (2026-05-06)

## 1. 任務目標
實現「一鍵/一網址」即可使用的線上平台，並建立基於 GitHub Actions 的自動化部署流程。

## 2. 已完成工作項目
- [x] **Firebase Hosting 配置**：
  - 設定 `firebase.json` 與 `.firebaserc`。
  - 將生產環境指向 `dist` 資料夾並支援 SPA 路由。
- [x] **CI/CD 自動化流程**：
  - 建立 `.github/workflows/firebase-hosting-merge.yml`。
  - 支援 `master` 分支推送後自動觸發編譯與部署。
- [x] **安全性與環境變數 (Secrets)**：
  - 在 GitHub Repository 中配置了 8 組關鍵密鑰：
    - `FIREBASE_SERVICE_ACCOUNT_PT_CDSS`: Firebase 部署權限金鑰。
    - `VITE_FIREBASE_*`: Firebase SDK 初始化變數。
    - `VITE_GEMINI_API_KEY`: AI 助手核心 API Key。
- [x] **SOP 與開發規範更新**：
  - 更新 `GEMINI.md` 以包含最新的部署指令與環境規範。

## 3. 系統訪問路徑
- **正式環境網址**：[https://pt-cdss.web.app](https://pt-cdss.web.app)
- **管理後台**：[Firebase Console](https://console.firebase.google.com/project/pt-cdss/overview)

## 4. 下一步計畫
- [ ] 持續優化 UI/UX Premium 視覺效果。
- [ ] 強化 RedFlag 紅旗警示邏輯與 AI 回饋深度。
