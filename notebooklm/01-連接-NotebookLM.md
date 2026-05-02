---
title: 'Claude Code 連接 #01：連接 NotebookLM（本機實際設定）'
date: '2026-04-25'
type: 連接
version: v1.0
status: 已完成
tags:
  - Claude-Code
  - NotebookLM
  - notebooklm-py
  - yt-search
  - 已實裝
host: bigsh@Windows-11
---

# Claude Code 連接 #01：連接 Google NotebookLM（本機實裝版）

> ⚠️ 本檔案為 **本機實際設定** 紀錄，與 lazy-packs 上游版本（用 `nlm` CLI）路線**不同**。
> 本機採用 `notebooklm-py`（teng-lin/notebooklm-py），原因：上游 nlm 工具當時未穩定。
> 📅 設定完成日期：2026-04-24

---

## 🎯 用途總覽

- 程式化操作 Google NotebookLM（建筆記本、加來源、生成 Podcast/簡報/心智圖等）
- 與 YT Search 整合：搜尋 YouTube → 自動建 NLM 筆記本 → 批量匯入影片來源
- 透過 `/notebooklm` Skill 在 Claude Code 內呼叫

---

## 🔗 已安裝套件與工具

| 項目 | 版本 | 安裝指令 |
|------|------|---------|
| `notebooklm-py` | 0.3.4 | `pip install "notebooklm-py[browser]"` |
| Playwright Chromium | 1208 | `python -m playwright install chromium --force` |
| `yt-dlp` | 2026.3.17 | `pip install yt-dlp` |

> ⚠️ **PATH 注意**：`notebooklm.exe` 與 `yt-dlp.exe` **不在 PATH**，請一律用 `python -m notebooklm` / `python -m yt_dlp` 呼叫。

---

## 📁 檔案位置索引

| 用途 | 路徑 |
|------|------|
| 認證 session | `C:\Users\bigsh\.notebooklm\storage_state.json` |
| Playwright 瀏覽器 | `C:\Users\bigsh\AppData\Local\ms-playwright\chromium-1208\` |
| 全局 NotebookLM Skill | `~/.claude/skills/notebooklm/SKILL.md` |
| 全局 yt-dlp Skill | `~/.claude/skills/yt-dlp/SKILL.md` |
| 本專案 YT Search Skill | `C:\CC AI Agent\.claude\skills\yt-search\SKILL.md` |
| 純搜尋腳本 | `C:\CC AI Agent\.claude\skills\yt-search\yt_search.py` |
| 整合腳本（搜尋→NLM）| `C:\CC AI Agent\.claude\skills\yt-search\yt_to_notebooklm.py` |

---

## 🚦 使用方式

### A. 直接管理 NotebookLM

```bash
# 列出所有筆記本
python -m notebooklm list

# 建立筆記本
python -m notebooklm create "筆記本名稱"

# 重新登入（session 失效時）
python -m notebooklm login

# 生成 Audio Overview / Podcast
python -m notebooklm generate audio "請聚焦在策略要點" --notebook <筆記本ID>

# 下載生成內容
python -m notebooklm download audio ./podcast.mp3 -n <筆記本ID>
```

### B. 在 Claude Code 內呼叫

直接輸入 `/notebooklm` 或自然語言：「建一個叫 XX 的筆記本，把這幾個 URL 加進去」。

### C. YT Search → NotebookLM 完整流程

```bash
# 預設行為：搜尋 + 建 NLM + 批量加來源 + 列出可用工作室功能
python "C:\CC AI Agent\.claude\skills\yt-search\yt_to_notebooklm.py" "關鍵字" -n 30 -m 6

# 只搜尋不建 NLM
python "C:\CC AI Agent\.claude\skills\yt-search\yt_search.py" "關鍵字"
```

**觸發行為**：使用者說「搜尋 YouTube」/「幫我找 YT 影片」→ 自動跑完整流程。

---

## 📊 YT Search 功能設計

- 預設回傳 30 筆影片（可調 `-n N`）
- 預設回傳近 6 個月內（`-m M` 調整月份，`-m 0` 不限）
- 欄位：標題、頻道、訂閱數、觀看數、時長、上傳日期、連結
- 參與度指標：`觀看數 ÷ 訂閱數`（越高代表超出頻道平均表現）
- NLM 來源上限：Standard=50, Plus=100, Pro=300（`--max-sources` 控制）

---

## 🔍 已知問題與排除

| 問題 | 解決方式 |
|------|---------|
| `playwright install chromium` 靜默失敗 | 加 `--force` 重跑 |
| 登入時 `Chromium pre-flight check failed: [WinError 2]` | 警告可無視，不影響功能 |
| `notebooklm.exe` / `yt-dlp.exe` 找不到 | 用 `python -m notebooklm` / `python -m yt_dlp` |
| 部分影片訂閱數回傳 N/A | yt-dlp 限制；不影響核心流程 |
| NLM 生成功能（Podcast/影片）失敗 | Google rate limit；等 5-10 分鐘重試 |

---

## 🔐 帳號規避說明

> 用的是**備用 Gemini/Google 帳號**（非主要帳號），規避 Google ToS 對程式化存取的風險。

---

## 📚 相關連結

- notebooklm-py 上游：https://github.com/teng-lin/notebooklm-py
- lazy-packs 對應檔案（上游 nlm 路線）：https://github.com/mathruffian-dot/claude-code-lazy-packs
- yt-dlp：https://github.com/yt-dlp/yt-dlp

---

## 📝 版本歷史

| 日期 | 版本 | 變更 |
|------|------|------|
| 2026-04-24 | v1.0 初稿 | notebooklm-py 安裝完成、yt-search 整合腳本建立 |
| 2026-04-25 | v1.0 | 整合到 lazy-packs 結構，存放於 `C:\CC AI Agent\notebooklm\` |
