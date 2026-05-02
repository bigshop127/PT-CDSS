const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const ANALYSIS_DIR = path.join(__dirname, '../data/puhui_analysis');
const RAW_DIR = path.join(__dirname, '../data/puhui_raw');

const SCHEMA_HINT = `必須嚴格回傳以下 JSON 格式，不可加說明文字：
{
  "market_regime": "BULL|BEAR|NEUTRAL",
  "market_regime_reason": "string",
  "global_macro": ["string"],
  "index_0050_observation": "string",
  "volume_signal": "string",
  "mentioned_stocks": [{"code":"4位數字","name":"公司名","signal":"BUY|SELL|WATCH","reason":"string"}],
  "sector_special_reports": [{"sector":"產業名","content":"string"}],
  "entry_conditions_mentioned": ["string"],
  "exit_conditions_mentioned": ["string"],
  "strategy_insights": "string"
}`;

function normalizeSignal(s) {
  if (!s) return 'WATCH';
  const u = String(s).toUpperCase();
  if (u.includes('BUY') || u.includes('買') || u.includes('多')) return 'BUY';
  if (u.includes('SELL') || u.includes('賣') || u.includes('空')) return 'SELL';
  return 'WATCH';
}

function normalizeStocks(raw) {
  const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return arr.map(s => ({
    code: String(s.code || s.stock_code || ''),
    name: String(s.name || s.stock_name || s.code || ''),
    signal: normalizeSignal(s.signal || s.operation || s.recommendation),
    reason: String(s.reason || s.analysis || ''),
  })).filter(s => s.name || s.code);
}

function getStr(obj, ...keys) {
  for (const k of keys) if (obj[k] && typeof obj[k] === 'string') return obj[k];
  return '';
}
function getArr(obj, ...keys) {
  for (const k of keys) {
    if (Array.isArray(obj[k])) return obj[k];
    if (obj[k] && typeof obj[k] === 'string') return [obj[k]];
  }
  return [];
}

function normalizeAnalysis(raw) {
  if (!raw || typeof raw !== 'object' || raw.parse_error) return null;
  const r = raw.analysis || raw;
  return {
    market_regime: getStr(r, 'market_regime', 'marketRegime') || 'NEUTRAL',
    market_regime_reason: getStr(r, 'market_regime_reason', 'reason'),
    global_macro: getArr(r, 'global_macro', 'globalMacro', 'macro'),
    index_0050_observation: getStr(r, 'index_0050_observation', 'market_observation'),
    volume_signal: getStr(r, 'volume_signal', 'volume'),
    mentioned_stocks: normalizeStocks(r.mentioned_stocks || r.mentionedStocks || r.stocks || []),
    sector_special_reports: getArr(r, 'sector_special_reports', 'sectorReports', 'sectors'),
    entry_conditions_mentioned: getArr(r, 'entry_conditions_mentioned', 'entryConditions'),
    exit_conditions_mentioned: getArr(r, 'exit_conditions_mentioned', 'exitConditions'),
    strategy_insights: getStr(r, 'strategy_insights', 'strategyInsights', 'insights'),
  };
}

function geminiCliAnalyze(text, title, date) {
  const prompt = `你是台股量化策略分析師。請分析以下報告並用 JSON 回應。\n文章標題：${title}\n日期：${date}\n內容：${text.substring(0, 10000)}\n\n${SCHEMA_HINT}`;
  const tmpFile = path.join(os.tmpdir(), 'gprompt_fix_' + Date.now() + '.txt');
  fs.writeFileSync(tmpFile, prompt, 'utf8');
  console.log(`  [gemini-cli] calling...`);
  const result = spawnSync('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    `[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); gemini -p ([System.IO.File]::ReadAllText('${tmpFile}'))`
  ], { encoding: 'utf8', timeout: 180000 });
  try { fs.unlinkSync(tmpFile); } catch (e) {}
  const combined = (result.stdout || '') + (result.stderr || '');
  if (/quota|rate.?limit|resource.?exhausted|too many|exceeded/i.test(combined)) {
    return { parse_error: true, error: 'gemini-cli quota' };
  }
  if (result.error || result.status !== 0) {
    return { parse_error: true, error: result.error?.message || `exit ${result.status}`, stderr: combined.substring(0, 200) };
  }
  const clean = (result.stdout || '').replace(/```json/g, '').replace(/```/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  return normalizeAnalysis(raw) || { parse_error: true, raw_response: clean.substring(0, 300) };
}

// Find all parse_error files
const targets = [];
fs.readdirSync(ANALYSIS_DIR).forEach(f => {
  if (!f.endsWith('.json')) return;
  const d = JSON.parse(fs.readFileSync(path.join(ANALYSIS_DIR, f), 'utf8'));
  if (d.analysis && d.analysis.parse_error) targets.push({ file: f, id: d.id, title: d.title, pubDate: d.pubDate });
});

console.log(`Found ${targets.length} articles to fix`);

for (let i = 0; i < targets.length; i++) {
  const t = targets[i];
  const idShort = t.id.substring(0, 8);
  const rawFile = path.join(RAW_DIR, `${t.pubDate}_${idShort}.txt`);
  if (!fs.existsSync(rawFile)) {
    console.log(`[${i+1}/${targets.length}] ❌ Missing raw: ${rawFile}`);
    continue;
  }
  const text = fs.readFileSync(rawFile, 'utf8');
  console.log(`[${i+1}/${targets.length}] Analyzing: ${t.title.substring(0, 50)}...`);
  const analysis = geminiCliAnalyze(text, t.title, t.pubDate);
  const record = { id: t.id, title: t.title, pubDate: t.pubDate, model: 'gemini-cli', analysis };
  fs.writeFileSync(path.join(ANALYSIS_DIR, t.file), JSON.stringify(record, null, 2));
  const status = analysis.parse_error ? '⚠️ parse_error' : '✅';
  console.log(`  ${status} Done`);
  if (i < targets.length - 1) {
    console.log('  Waiting 5s...');
    const wait = spawnSync('powershell', ['-Command', 'Start-Sleep -Seconds 5'], { timeout: 10000 });
  }
}

console.log('\n=== Complete ===');
const remaining = fs.readdirSync(ANALYSIS_DIR).filter(f => {
  const d = JSON.parse(fs.readFileSync(path.join(ANALYSIS_DIR, f), 'utf8'));
  return d.analysis && d.analysis.parse_error;
}).length;
console.log(`Remaining parse_error: ${remaining}`);
