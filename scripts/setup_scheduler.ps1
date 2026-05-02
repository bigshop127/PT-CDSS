# setup_scheduler.ps1 — 設定浦惠投顧自動化排程
# 執行方式（以系統管理員身分）：powershell -ExecutionPolicy Bypass -File "C:\CC AI Agent\scripts\setup_scheduler.ps1"

$NodePath = "C:\Program Files\nodejs\node.exe"
$ScriptDir = "C:\CC AI Agent\scripts"
$LogDir    = "C:\CC AI Agent\data"

# ── Task 1：每日 18:30 — 每日摘要自動產生 ────────────────────────────────
$action1 = New-ScheduledTaskAction `
    -Execute $NodePath `
    -Argument "`"$ScriptDir\puhui_daily.js`"" `
    -WorkingDirectory "C:\CC AI Agent"

$trigger1 = New-ScheduledTaskTrigger -Daily -At "18:30"

$settings1 = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 3) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "PuhuiDaily_Summary" `
    -Description "浦惠投顧每日摘要自動產生 (18:30)" `
    -Action $action1 `
    -Trigger $trigger1 `
    -Settings $settings1 `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host "[OK] Task 1 (PuhuiDaily_Summary @ 18:30) registered" -ForegroundColor Green

# ── Task 2：每日 08:00 — Google OAuth 健康檢查 ───────────────────────────
$action2 = New-ScheduledTaskAction `
    -Execute $NodePath `
    -Argument "`"$ScriptDir\test_google_auth.js`"" `
    -WorkingDirectory "C:\CC AI Agent"

$trigger2 = New-ScheduledTaskTrigger -Daily -At "08:00"

$settings2 = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -RestartCount 1 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName "PuhuiDaily_OAuthCheck" `
    -Description "Google OAuth 健康檢查 (08:00)，失敗即 Telegram 告警" `
    -Action $action2 `
    -Trigger $trigger2 `
    -Settings $settings2 `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host "[OK] Task 2 (PuhuiDaily_OAuthCheck @ 08:00) registered" -ForegroundColor Green
Write-Host ""
Write-Host "完成！使用以下指令確認排程：" -ForegroundColor Cyan
Write-Host "  Get-ScheduledTask -TaskName 'PuhuiDaily_*' | Select-Object TaskName, State"
