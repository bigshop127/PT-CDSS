const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const COOKIE = process.env.PP_COOKIE || `JAccessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzcwMjM1OTAsImV4cCI6MTc3OTYxNTU5MCwiZGF0YSI6eyJhY2Nlc3NUb2tlbiI6IjZkZjgzMzljYjE3MjY1Mjg2MjA0MmRhZTk1ZGU2M2Q0NzZiYzM5YTAiLCJtZW1iZXJfaWQiOiI5NkMwRjY4RUIzNjg1NTA4NUM2RjdEQTczMDM3OUQ2MCJ9fQ.UZuRkUcGGUOTVAZlBv92ufssawOe3DIGKuMGErb5-wE; PHPSESSID=568jb4qoda7bj7faqb51ps019r; pp_identify=72dff85f0f6c397867acca3c2995457d; salt=19dbedb80df223f-07f45531a5719c8-26061e51-1a298c-19dbedb80e0284b`;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const DATED_JSON_PATH = path.join(__dirname, '../data/puhui_urls_paginated_dated.json');
const RAW_DIR = path.join(__dirname, '../data/puhui_raw');
const ANALYSIS_DIR = path.join(__dirname, '../data/puhui_analysis');

const TOTAL_BATCHES = 4;
const batchArg = process.argv.find(a => a.startsWith('--batch='));
const BATCH_NUM = batchArg ? parseInt(batchArg.split('=')[1]) : 0;
const modelArg = process.argv.find(a => a.startsWith('--model='));
const MODEL_NAME = modelArg ? modelArg.split('=')[1] : 'qwen2.5:7b';
const halfArg = process.argv.find(a => a.startsWith('--half='));
const HALF_NUM = halfArg ? parseInt(halfArg.split('=')[1]) : 0;
let STOP_PROCESSING = false;

function loadArticles() {
  const all = JSON.parse(fs.readFileSync(DATED_JSON_PATH, 'utf-8'));
  const done = new Set();
  fs.readdirSync(ANALYSIS_DIR).forEach(f => {
    if (!f.endsWith('.json')) return;
    const m = f.match(/_([A-F0-9]{8})/i);
    if (!m) return;
    const content = JSON.parse(fs.readFileSync(path.join(ANALYSIS_DIR, f), 'utf-8'));
    // If it has parse_error, don't mark as done so we can retry
    if (content.analysis && !content.analysis.parse_error) {
      done.add(m[1].toUpperCase());
    }
  });

  // Slice by fixed index range so batches never overlap regardless of done count
  let pool = all;
  if (BATCH_NUM >= 1 && BATCH_NUM <= TOTAL_BATCHES) {
    const size = Math.ceil(all.length / TOTAL_BATCHES);
    pool = all.slice((BATCH_NUM - 1) * size, BATCH_NUM * size);
  } else if (HALF_NUM >= 1 && HALF_NUM <= 2) {
    const mid = Math.ceil(all.length / 2);
    pool = HALF_NUM === 1 ? all.slice(0, mid) : all.slice(mid);
  }
  const pending = pool.filter(a => a.id && !done.has(a.id.substring(0, 8).toUpperCase()));
  const label = BATCH_NUM ? `Batch ${BATCH_NUM}/${TOTAL_BATCHES}` : HALF_NUM ? `Half ${HALF_NUM}/2` : 'All';
  console.log(`[${label}] Pool: ${pool.length} | Done in pool: ${pool.length - pending.length} | Pending: ${pending.length}`);
  return pending;
}

const ARTICLES = loadArticles();

function mkdir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

let browser = null;
let pageContext = null;

async function initBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
    const cookiesArr = COOKIE.split(';').map(c => {
      const parts = c.trim().split('=');
      const name = parts[0];
      const value = parts.slice(1).join('=');
      return { name, value, domain: '.pressplay.cc', path: '/' };
    });
    pageContext = await browser.newContext();
    await pageContext.addCookies(cookiesArr);
  }
  return pageContext;
}

async function fetchPageWithPlaywright(url, retryCount = 0) {
  const context = await initBrowser();
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(3000);
    const html = await page.content();
    const pageTitle = (await page.title()).split(' | ')[0];
    return { html, pageTitle };
  } catch (err) {
    if (retryCount < 2) {
      console.log(`⚠️ Fetch failed, retrying (${retryCount + 1}/2)... ${err.message}`);
      await page.close();
      await new Promise(r => setTimeout(r, 5000));
      return fetchPageWithPlaywright(url, retryCount + 1);
    }
    throw err;
  } finally {
    if (!page.isClosed()) await page.close();
  }
}

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{3,}/g, '\n\n').trim();
}

// ── Schema normalization: maps any model output to the canonical schema ──────
function normalizeSignal(s) {
  if (!s) return 'WATCH';
  const u = String(s).toUpperCase();
  if (u.includes('BUY') || u.includes('買') || u.includes('多') || u.includes('看多')) return 'BUY';
  if (u.includes('SELL') || u.includes('賣') || u.includes('空') || u.includes('看空')) return 'SELL';
  return 'WATCH';
}

function normalizeStocks(raw) {
  const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return arr.map(s => {
    if (typeof s === 'string') return { code: '', name: s, signal: 'WATCH', reason: '' };
    return {
      code: String(s.code || s.stock_code || s.stockCode || s['代號'] || ''),
      name: String(s.name || s.stock_name || s.stockName || s['名稱'] || s.code || ''),
      signal: normalizeSignal(s.signal || s.operation || s.recommendation || s.action || s['操作']),
      reason: String(s.reason || s.analysis || s.comment || s.note || s['理由'] || ''),
    };
  }).filter(s => s.name || s.code);
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
    market_regime:            getStr(r, 'market_regime', 'marketRegime', 'regime', 'market_condition', '市場狀態') || 'NEUTRAL',
    market_regime_reason:     getStr(r, 'market_regime_reason', 'marketRegimeReason', 'regime_reason', 'reason', '評等理由'),
    global_macro:             getArr(r, 'global_macro', 'globalMacro', 'macro', 'international', '全球宏觀'),
    index_0050_observation:   getStr(r, 'index_0050_observation', 'index_observation', 'market_observation', 'taiwan_market', '大盤觀察'),
    volume_signal:            getStr(r, 'volume_signal', 'volumeSignal', 'volume', '量能'),
    mentioned_stocks:         normalizeStocks(r.mentioned_stocks || r.mentionedStocks || r.stocks || r['個股']),
    sector_special_reports:   getArr(r, 'sector_special_reports', 'sectorReports', 'sectors', 'sector_reports', '產業報告'),
    entry_conditions_mentioned: getArr(r, 'entry_conditions_mentioned', 'entryConditions', 'entry_conditions', '進場條件'),
    exit_conditions_mentioned:  getArr(r, 'exit_conditions_mentioned', 'exitConditions', 'exit_conditions', '出場條件'),
    strategy_insights:        getStr(r, 'strategy_insights', 'strategyInsights', 'strategy', 'insights', '策略洞察'),
  };
}

const SCHEMA_HINT = `必須嚴格回傳以下 JSON 格式，不可加說明文字：
{
  "market_regime": "BULL|BEAR|NEUTRAL",
  "market_regime_reason": "string",
  "global_macro": ["string", ...],
  "index_0050_observation": "string",
  "volume_signal": "string",
  "mentioned_stocks": [{"code":"4位數字","name":"公司名","signal":"BUY|SELL|WATCH","reason":"string"},...],
  "sector_special_reports": [{"sector":"產業名","content":"string"},...],
  "entry_conditions_mentioned": ["string",...],
  "exit_conditions_mentioned": ["string",...],
  "strategy_insights": "string"
}`;

function ollamaAnalyze(text, title, date) {
  const prompt = `你是台股量化策略分析師。請分析以下報告並用 JSON 回應。\n文章標題：${title}\n日期：${date}\n內容：${text.substring(0, 6000)}\n\n${SCHEMA_HINT}`;
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL_NAME,
      prompt,
      stream: false,
      options: { temperature: 0.1 }
    });
    const req = http.request({ hostname: 'localhost', port: 11434, path: '/api/generate', method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const clean = (parsed.response || '').replace(/<think>[\s\S]*?<\/think>/g, '');
          const jsonMatch = clean.match(/\{[\s\S]*\}/);
          const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          const normalized = raw ? normalizeAnalysis(raw) : null;
          resolve(normalized || { parse_error: true, raw_response: clean.substring(0, 500) });
        } catch (e) { resolve({ parse_error: true, error: e.message }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function geminiAnalyze(text, title, date, retryCount = 0) {
  const prompt = `你是台股量化策略分析師。請分析以下報告並用 JSON 回應。\n文章標題：${title}\n日期：${date}\n內容：${text.substring(0, 12000)}\n\n${SCHEMA_HINT}`;
  let model = MODEL_NAME.trim();
  // Map gemini-1.5-flash to flash-lite for higher quota in 2026
  if (model.includes('gemini-1.5-flash')) {
    model = 'gemini-2.0-flash-lite';
  }
  
  if (retryCount === 0) console.log(`[Gemini] Calling ${model} for ${title.substring(0, 30)}...`);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    
    if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
      return { parse_error: true, error: 'Empty response from Gemini', details: response.data };
    }
    
    const clean = response.data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { parse_error: true, error: 'No JSON found in response', raw_response: clean.substring(0, 500) };
    }
    const raw = JSON.parse(jsonMatch[0]);
    const normalized = normalizeAnalysis(raw);
    return normalized || { parse_error: true, error: 'Normalization failed', raw_response: clean.substring(0, 500) };
  } catch (e) {
    if (e.response && e.response.status === 429 && retryCount < 3) {
      const wait = 30000 * (retryCount + 1);
      console.log(`⚠️ Quota exceeded (429). Waiting ${wait/1000}s to retry...`);
      await new Promise(r => setTimeout(r, wait));
      return geminiAnalyze(text, title, date, retryCount + 1);
    }
    return { parse_error: true, error: e.message, details: e.response?.data };
  }
}

async function groqAnalyze(text, title, date, retryCount = 0) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const prompt = `你是台股量化策略分析師。請分析以下報告並用 JSON 回應。\n文章標題：${title}\n日期：${date}\n內容：${text.substring(0, 3500)}\n\n${SCHEMA_HINT}`;
  if (retryCount === 0) console.log(`[Groq] Analyzing: ${title.substring(0, 40)}...`);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 1000 })
    });
    if (response.status === 429 && retryCount < 3) {
      const wait = 30000 * (retryCount + 1);
      console.log(`⚠️ Groq rate limit. Waiting ${wait/1000}s...`);
      await new Promise(r => setTimeout(r, wait));
      return groqAnalyze(text, title, date, retryCount + 1);
    }
    if (!response.ok) return { parse_error: true, error: `HTTP ${response.status}` };
    const data = await response.json();
    const clean = (data.choices[0].message.content || '').replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { parse_error: true, error: 'No JSON found', raw_response: clean.substring(0, 300) };
    const raw = JSON.parse(jsonMatch[0]);
    return normalizeAnalysis(raw) || { parse_error: true, error: 'Normalization failed' };
  } catch (e) {
    return { parse_error: true, error: e.message };
  }
}

async function claudeCliAnalyze(text, title, date, retryCount = 0) {
  const prompt = `你是台股量化策略分析師。請分析以下報告並用 JSON 回應。\n文章標題：${title}\n日期：${date}\n內容：${text.substring(0, 10000)}\n\n${SCHEMA_HINT}`;
  const result = spawnSync('claude', ['-p', prompt], {
    encoding: 'utf8',
    timeout: 180000,
  });
  const combined = (result.stdout || '') + (result.stderr || '');
  if (/usage limit|rate limit|limit reached|exceeded.*limit/i.test(combined)) {
    STOP_PROCESSING = true;
    return { usage_limit: true, error: 'Claude Pro usage limit reached' };
  }
  if (result.error?.code === 'ETIMEDOUT' && retryCount < 2) {
    console.log(`⏱️ Claude CLI timeout (attempt ${retryCount + 1}/3), retrying in 10s...`);
    await new Promise(r => setTimeout(r, 10000));
    return claudeCliAnalyze(text, title, date, retryCount + 1);
  }
  if (result.error || result.status !== 0) {
    return { parse_error: true, error: result.error?.message || `exit ${result.status}`, stderr: combined.substring(0, 300) };
  }
  try {
    const clean = (result.stdout || '').replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return normalizeAnalysis(raw) || { parse_error: true, raw_response: clean.substring(0, 500) };
  } catch (e) {
    return { parse_error: true, error: e.message };
  }
}

async function geminiCliAnalyze(text, title, date, retryCount = 0) {
  const os = require('os');
  const prompt = `你是台股量化策略分析師。請分析以下報告並用 JSON 回應。\n文章標題：${title}\n日期：${date}\n內容：${text.substring(0, 12000)}\n\n${SCHEMA_HINT}`;
  const tmpFile = path.join(os.tmpdir(), 'gprompt_' + Date.now() + '.txt');
  fs.writeFileSync(tmpFile, prompt, 'utf8');
  const result = spawnSync('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    `[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); gemini -p ([System.IO.File]::ReadAllText('${tmpFile}'))`
  ], { encoding: 'utf8', timeout: 180000 });
  try { fs.unlinkSync(tmpFile); } catch (e) {}
  const combined = (result.stdout || '') + (result.stderr || '');
  if (/quota|rate.?limit|resource.?exhausted|too many requests|limit.*exceeded|exceeded.*limit/i.test(combined)) {
    STOP_PROCESSING = true;
    return { usage_limit: true, error: 'Gemini CLI usage limit reached' };
  }
  if (result.error?.code === 'ETIMEDOUT' && retryCount < 2) {
    console.log(`⏱️ Gemini CLI timeout (attempt ${retryCount + 1}/3), retrying in 10s...`);
    await new Promise(r => setTimeout(r, 10000));
    return geminiCliAnalyze(text, title, date, retryCount + 1);
  }
  if (result.error || result.status !== 0) {
    return { parse_error: true, error: result.error?.message || `exit ${result.status}`, stderr: combined.substring(0, 300) };
  }
  try {
    const clean = (result.stdout || '').replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    const raw = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return normalizeAnalysis(raw) || { parse_error: true, raw_response: clean.substring(0, 500) };
  } catch (e) {
    return { parse_error: true, error: e.message };
  }
}

async function main() {
  mkdir(RAW_DIR); mkdir(ANALYSIS_DIR);
  const isGeminiCli = MODEL_NAME.toLowerCase() === 'gemini-cli';
  const isGemini = !isGeminiCli && MODEL_NAME.toLowerCase().includes('gemini');
  const isClaude = MODEL_NAME.toLowerCase() === 'claude';
  const isGroq = MODEL_NAME.toLowerCase() === 'groq';
  let sessionCount = 0;

  for (let i = 0; i < ARTICLES.length; i++) {
    if (STOP_PROCESSING) {
      console.log(`\n🛑 Claude usage limit hit. Stopped before article ${i+1}/${ARTICLES.length}.`);
      console.log(`✅ This session processed ${sessionCount} articles. All JSONs saved to ${ANALYSIS_DIR}`);
      break;
    }
    const art = ARTICLES[i];
    try {
      const dateLabel = art.absolute_date || art.pubDate || 'unknown';
      const rawFile = path.join(RAW_DIR, `${dateLabel}_${art.id.substring(0,8)}.txt`);
      let text, pageTitle;
      if (fs.existsSync(rawFile)) {
        text = fs.readFileSync(rawFile, 'utf8');
        pageTitle = art.title || art.id;
      } else {
        const fetched = await fetchPageWithPlaywright(`https://www.pressplay.cc/project/CF6DA5CB5BE8C843FE37526843D3E126/articles/${art.id}`);
        text = stripHtml(fetched.html);
        pageTitle = fetched.pageTitle;
        fs.writeFileSync(rawFile, text);
      }

      const analysis = isClaude
        ? await claudeCliAnalyze(text, pageTitle, dateLabel)
        : isGeminiCli
          ? await geminiCliAnalyze(text, pageTitle, dateLabel)
          : isGemini
            ? await geminiAnalyze(text, pageTitle, dateLabel)
            : isGroq
              ? await groqAnalyze(text, pageTitle, dateLabel)
              : await ollamaAnalyze(text, pageTitle, dateLabel);

      if (analysis.usage_limit) {
        console.log(`\n🛑 Usage limit hit at article ${i+1}/${ARTICLES.length}.`);
        console.log(`✅ This session processed ${sessionCount} articles. All JSONs saved to ${ANALYSIS_DIR}`);
        break;
      }

      const record = { id: art.id, title: pageTitle, pubDate: dateLabel, model: MODEL_NAME, analysis };
      fs.writeFileSync(path.join(ANALYSIS_DIR, `${dateLabel}_${art.id.substring(0,8)}.json`), JSON.stringify(record, null, 2));
      sessionCount++;
      const status = analysis.parse_error ? '⚠️ parse_error' : '✅';
      console.log(`[${i+1}/${ARTICLES.length}] ${status} Analyzed: ${pageTitle} (${dateLabel})`);

      if (i < ARTICLES.length - 1) {
        await new Promise(r => setTimeout(r, (isClaude || isGeminiCli) ? 3000 : isGroq ? 10000 : 10000));
      }
    } catch (err) {
      console.error(`[${i+1}/${ARTICLES.length}] ❌ Error processing ${art.id}: ${err.message}`);
    }
  }
  if (browser) await browser.close();
}
main().catch(console.error);
