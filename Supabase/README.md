# Supabase 設定資料夾

本資料夾用於存放 Supabase 相關設定與遷移腳本。

## 標準結構
- `migrations/`: SQL 遷移腳本。
- `config.json`: 專案設定資訊。
- `types.ts`: 由 Supabase CLI 生成的類型定義。

## 注意事項
敏感資訊（如 API Keys）應存放在根目錄的 `.env` 檔案中。
