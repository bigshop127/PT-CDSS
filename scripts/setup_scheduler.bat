@echo off
chcp 65001 > nul

echo Setting up Puhui daily automation tasks...

:: Task 1: Daily summary at 18:30
schtasks /create ^
  /tn "PuhuiDaily_Summary" ^
  /tr "\"C:\Program Files\nodejs\node.exe\" \"C:\CC AI Agent\scripts\puhui_daily.js\"" ^
  /sc DAILY ^
  /st 18:30 ^
  /f
if %errorlevel% equ 0 (
  echo [OK] Task 1 PuhuiDaily_Summary @ 18:30 registered
) else (
  echo [FAIL] Task 1 failed - try running as Administrator
)

:: Task 2: OAuth health check at 08:00
schtasks /create ^
  /tn "PuhuiDaily_OAuthCheck" ^
  /tr "\"C:\Program Files\nodejs\node.exe\" \"C:\CC AI Agent\scripts\test_google_auth.js\"" ^
  /sc DAILY ^
  /st 08:00 ^
  /f
if %errorlevel% equ 0 (
  echo [OK] Task 2 PuhuiDaily_OAuthCheck @ 08:00 registered
) else (
  echo [FAIL] Task 2 failed - try running as Administrator
)

echo.
echo Verify with: schtasks /query /tn "PuhuiDaily*"
