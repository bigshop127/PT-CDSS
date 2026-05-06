# 🔐 PT-CDSS 使用者登入與 AI 連結實作紀錄 (2026-05-06)

## 1. 任務目標
實現多使用者支援，要求新用戶登入 Google 並配置個人 AI API Key 才能進入系統，同時確保金鑰安全性。

## 2. 已完成工作項目
- [x] **身份驗證整合**：
  - 接入 Firebase Google Authentication。
  - 實作 `src/components/auth/Onboarding.tsx` 引導組件。
- [x] **用戶狀態管理**：
  - 建立 `src/store/useUserStore.ts` (Zustand + Persist)。
  - 支援 `openaiKey` 與 `geminiKey` 的本地安全儲存。
- [x] **安全性強化**：
  - 金鑰僅儲存於用戶瀏覽器 (localStorage)，伺服器端不留存。
  - 強制執行登入後訪問 (Auth Guard)。
- [x] **基礎組件擴充**：
  - 新增 `Card` UI 組件並修正 `DropdownMenu` 匯出錯誤。
- [x] **自動化更新**：
  - 程式碼已通過編譯驗證並推送到 GitHub 正式環境。

## 3. 變更檔案清單
- `src/App.tsx`: 整合 Auth Guard 邏輯。
- `src/components/auth/Onboarding.tsx`: 新手引導 UI。
- `src/store/useUserStore.ts`: 用戶設定持久化 Store。
- `src/components/ui/card.tsx`: 新增卡片組件。
- `src/components/ui/dropdown-menu.tsx`: 修正匯出問題。

## 4. 下一步計畫
- [ ] 將前端 AI 請求邏輯改為優先讀取 `useUserStore` 中的用戶 Key。
- [ ] 實作個人化設定頁面，允許用戶隨時更新 Key。
