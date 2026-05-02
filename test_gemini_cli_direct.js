const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function geminiCliAnalyze(text, title, date) {
  const SCHEMA_HINT = `必須嚴格回傳以下 JSON 格式，不可加說明文字：
{
  "market_regime": "BULL|BEAR|NEUTRAL",
  "market_regime_reason": "string"
}`;
  const prompt = `你是台股量化策略分析師。請分析以下報告並用 JSON 回應。\n文章標題：${title}\n日期：${date}\n內容：${text}\n\n${SCHEMA_HINT}`;
  const tmpFile = path.join(os.tmpdir(), 'gprompt_test.txt');
  fs.writeFileSync(tmpFile, prompt, 'utf8');
  console.log('Spawning powershell with gemini...');
  const result = spawnSync('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    `[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); gemini -p ([System.IO.File]::ReadAllText('${tmpFile}'))`
  ], { encoding: 'utf8', timeout: 180000 });
  try { fs.unlinkSync(tmpFile); } catch (e) {}
  
  console.log('Status:', result.status);
  console.log('Error:', result.error);
  console.log('Stdout:', result.stdout);
  console.log('Stderr:', result.stderr);
}

geminiCliAnalyze('今天大盤漲了100點，表現不錯。', '今日盤勢分析', '2026-04-30');
