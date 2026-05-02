@echo off
cd "C:\CC AI Agent"
node scripts/puhui_pipeline.js --batch=1 --model=deepseek-r1:14b
if %errorlevel% neq 0 exit /b %errorlevel%
node scripts/puhui_pipeline.js --batch=2 --model=deepseek-r1:14b
if %errorlevel% neq 0 exit /b %errorlevel%
node scripts/puhui_pipeline.js --batch=3 --model=deepseek-r1:14b
if %errorlevel% neq 0 exit /b %errorlevel%
node scripts/puhui_pipeline.js --batch=4 --model=deepseek-r1:14b
if %errorlevel% neq 0 exit /b %errorlevel%
node scripts/puhui_synthesize.js
if %errorlevel% neq 0 exit /b %errorlevel%
node scripts/sync_to_obsidian.js
if %errorlevel% neq 0 exit /b %errorlevel%
curl -s -X POST http://localhost:3000/api/finance/update -H "Content-Type: application/json" -d "{\"id\":\"puhui_synthesize\",\"status\":\"completed\",\"message\":\"All done\"}"
