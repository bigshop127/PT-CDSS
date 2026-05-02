@echo off
cd /d "C:\CC AI Agent"
"C:\Program Files\nodejs\node.exe" scripts/puhui_daily.js >> data/puhui_daily.log 2>&1
