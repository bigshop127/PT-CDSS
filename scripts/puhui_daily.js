/**
 * puhui_daily.js — 浦惠投顧每日摘要自動化
 *
 * 流程：
 *   1. 檢查今日 Obsidian 筆記是否已存在 → 存在即退出
 *   2. 測試 Google OAuth 健康狀態 → 失敗則 Telegram 告警
 *   3. 搜尋 Gmail 取得今日每日摘要郵件
 *   4. 若無郵件 → 從通知信取 PressPlay URL → Playwright 無頭抓取
 *   5. 用 Groq (llama-3.3-70b) 摘要文章，Gemini 作為 fallback
 *   6. 格式化為 Obsidian Markdown
 *   7. 寫入 Obsidian
 *   8. Telegram 通知
 *
 * 執行：node scripts/puhui_daily.js [YYYY-MM-DD]（無參數則用今天）
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const https = require('https');
const path = require('path');

// ── 設定 ────────────────────────────────────────────────
const TARGET_DATE = process.argv[2] || new Date().toISOString().slice(0, 10);
const [Y, M, D] = TARGET_DATE.split('-');
const DATE_DISPLAY = `${Y}/${M}/${D}`;

const OBSIDIAN_DIR = 'C:\\obsidian\\儲存庫\\浦惠投顧報告整理';
const NOTE_PATH = path.join(OBSIDIAN_DIR, `${TARGET_DATE}.md`);
const COOKIES_PATH = path.join(__dirname, '..', 'data', 'pressplay_cookies.json');
const LOG_PATH = path.join(__dirname, '..', 'data', 'puhui_daily.log');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'a4980678@gmail.com';

// Gmail token 在 OAuth 成功後填入，供 sendEmail 使用
let _gmailToken = null;

// ── 工具函式 ────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
}

function httpsPost(hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const b = typeof body === 'string' ? body : new URLSearchParams(body).toString();
    const req = https.request(
      { hostname, path, method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(b), ...headers } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } }); }
    );
    req.on('error', reject); req.write(b); req.end();
  });
}

function httpsPostJson(hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const b = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b), ...headers } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } }); }
    );
    req.on('error', reject); req.write(b); req.end();
  });
}

function httpsGet(hostname, path, token) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: 'GET', headers: { Authorization: `Bearer ${token}` } },
      res => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } }); }
    );
    req.on('error', reject); req.end();
  });
}

function decodeBase64(s) {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractTextFromPayload(payload) {
  function walk(p) {
    if (!p) return '';
    if (p.mimeType === 'text/plain' && p.body?.data) return decodeBase64(p.body.data);
    if (p.mimeType === 'text/html' && p.body?.data) {
      return decodeBase64(p.body.data)
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ').trim();
    }
    if (p.parts) { for (const pt of p.parts) { const t = walk(pt); if (t) return t; } }
    return '';
  }
  return walk(payload);
}

// ── 通知：Telegram + Email ────────────────────────────────
async function sendTelegram(text) {
  try {
    await httpsPostJson('api.telegram.org',
      `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }
    );
  } catch (e) {
    log(`Telegram 發送失敗: ${e.message}`);
  }
}

async function sendEmail(subject, body) {
  if (!_gmailToken) return; // OAuth 尚未成功，跳過
  try {
    const raw = [
      `From: ${NOTIFY_EMAIL}`,
      `To: ${NOTIFY_EMAIL}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\r\n');
    const encoded = Buffer.from(raw).toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await new Promise((resolve, reject) => {
      const b = JSON.stringify({ raw: encoded });
      const req = https.request(
        { hostname: 'gmail.googleapis.com', path: '/gmail/v1/users/me/messages/send',
          method: 'POST', headers: { Authorization: `Bearer ${_gmailToken}`,
          'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) } },
        res => { res.resume(); res.on('end', resolve); }
      );
      req.on('error', reject); req.write(b); req.end();
    });
  } catch (e) {
    log(`Email 發送失敗: ${e.message}`);
  }
}

async function notify(subject, text) {
  await Promise.all([
    sendTelegram(text),
    sendEmail(`[浦惠自動化] ${subject}`, text.replace(/\*/g, '').replace(/_/g, '')),
  ]);
}

// ── Google OAuth ──────────────────────────────────────────
async function getAccessToken() {
  const r = await httpsPost('oauth2.googleapis.com', '/token', {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });
  if (r.error) throw new Error(`OAuth: ${r.error} - ${r.error_description}`);
  return r.access_token;
}

// ── Gmail ─────────────────────────────────────────────────
async function searchGmail(token, query, max = 10) {
  const q = encodeURIComponent(query);
  return httpsGet('gmail.googleapis.com', `/gmail/v1/users/me/messages?maxResults=${max}&q=${q}`, token);
}

async function getEmail(token, id) {
  return httpsGet('gmail.googleapis.com', `/gmail/v1/users/me/messages/${id}?format=full`, token);
}

function extractPressPlayLinks(payload) {
  function walk(p) {
    if (!p) return '';
    if (p.mimeType === 'text/html' && p.body?.data) return decodeBase64(p.body.data);
    if (p.parts) return p.parts.map(walk).join('');
    return '';
  }
  const html = walk(payload);
  const links = [];
  const re = /href="([^"]+pressplay\.cc\/project\/[^"]+\/articles\/[^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) links.push(m[1]);
  return [...new Set(links)];
}

// ── Playwright 無頭抓取 ────────────────────────────────────
async function fetchPressPlayArticle(url) {
  const { chromium } = require('playwright-core');
  // 使用 MS Playwright 已安裝的 Chromium
  const execPath = process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    'C:\\Users\\bigsh\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win\\chrome.exe';

  const browser = await chromium.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext();

    // 載入已儲存的 cookies
    if (fs.existsSync(COOKIES_PATH)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
      await context.addCookies(cookies);
      log(`已載入 ${cookies.length} 個 PressPlay cookies`);
    }

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // 擷取文章正文
    const content = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll('p');
      return Array.from(paragraphs)
        .map(p => p.innerText.trim())
        .filter(t => t.length > 10)
        .join('\n\n');
    });

    const title = await page.title();
    return { title: title.replace(' - PressPlay', '').trim(), content };
  } finally {
    await browser.close();
  }
}

// ── Groq 摘要 ─────────────────────────────────────────────
async function summarizeWithGroq(articleTitle, rawContent) {
  const prompt = `你是台股投資分析助手。請將以下浦惠投顧老王的每日分析文章，整理成繁體中文的 Obsidian Markdown 筆記。

格式要求：
- 第一行：# 📊 浦惠投顧每日摘要 — ${DATE_DISPLAY}
- 接著 > 引用句（用文章標題）
- ## 整體操作水位（持股水位，用紅色 span 標記）
- ## 大盤與美股觀察（要點列表）
- 族群分析章節（依文章內容動態決定）
- ## 📌 今日提到個股（Markdown 表格，欄位：代號、名稱、操作建議）
- 最後 🔗 [閱讀原文](${rawContent.url || ''})

文章標題：${articleTitle}

文章內容：
${rawContent.content.substring(0, 8000)}

請直接輸出 Markdown 內容，不要任何前言或解釋。`;

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 3000,
    temperature: 0.3
  };

  const r = await httpsPostJson('api.groq.com', '/openai/v1/chat/completions', body, {
    Authorization: `Bearer ${GROQ_API_KEY}`
  });

  if (r.error) throw new Error(`Groq: ${r.error.message}`);
  return r.choices[0].message.content;
}

// ── Gemini fallback ───────────────────────────────────────
async function summarizeWithGemini(articleTitle, rawContent) {
  const prompt = `你是台股投資分析助手。請將以下浦惠投顧老王的每日分析文章，整理成繁體中文的 Obsidian Markdown 筆記。

格式要求：
- # 📊 浦惠投顧每日摘要 — ${DATE_DISPLAY}
- > 引用標題
- ## 整體操作水位
- ## 大盤與美股觀察
- 族群章節（依內容）
- ## 📌 今日提到個股（表格）

文章標題：${articleTitle}
文章內容：${rawContent.content.substring(0, 8000)}

請直接輸出 Markdown 內容。`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const { default: fetch } = await import('node-fetch');
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await r.json();
  if (data.error) throw new Error(`Gemini: ${data.error.message}`);
  return data.candidates[0].content.parts[0].text;
}

// ── 主流程 ────────────────────────────────────────────────
async function main() {
  log(`===== puhui_daily 啟動 target=${TARGET_DATE} =====`);

  // 1. 檢查筆記是否已存在
  if (fs.existsSync(NOTE_PATH)) {
    log(`筆記已存在: ${NOTE_PATH} → 跳過`);
    return;
  }

  // 2. 測試 OAuth
  let token;
  try {
    token = await getAccessToken();
    _gmailToken = token;
    log('OAuth 正常');
  } catch (e) {
    log(`OAuth 失敗: ${e.message}`);
    // OAuth 失敗時無法用 Gmail 寄信，只能走 Telegram
    await sendTelegram(`⚠️ *浦惠投顧每日摘要* 失敗\n\nGoogle OAuth 異常，請重新授權：\n\`node scripts/get_refresh_token.js\`\n\n錯誤：${e.message}`);
    process.exit(1);
  }

  // 3. 搜尋今日每日摘要郵件
  const gmailDate = `${Y}/${M}/${D}`;
  const nextDate = new Date(TARGET_DATE);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextStr = nextDate.toISOString().slice(0, 10).replace(/-/g, '/');

  log(`搜尋每日摘要郵件 after:${gmailDate} before:${nextStr}`);
  let articleContent = null;
  let articleTitle = '';
  let articleUrl = '';

  const summaryList = await searchGmail(token, `浦惠 每日摘要 after:${gmailDate} before:${nextStr}`, 5);
  const summaryList2 = await searchGmail(token, `subject:[浦惠投顧] ${DATE_DISPLAY} after:${gmailDate} before:${nextStr}`, 5);
  const msgs = [...(summaryList.messages || []), ...(summaryList2.messages || [])];

  if (msgs.length > 0) {
    log(`找到 ${msgs.length} 封摘要郵件，使用第一封`);
    const email = await getEmail(token, msgs[0].id);
    const subjHeader = email.payload.headers.find(h => h.name === 'Subject');
    articleTitle = subjHeader?.value || DATE_DISPLAY;
    articleContent = { content: extractTextFromPayload(email.payload), url: '' };
  }

  // 4. 若無摘要郵件，從通知信取 URL
  if (!articleContent) {
    log('未找到摘要郵件，搜尋通知信...');
    const notifList = await searchGmail(token, `浦惠投顧方案最新動態通知 after:${gmailDate} before:${nextStr}`, 3);

    if (notifList.messages?.length > 0) {
      const email = await getEmail(token, notifList.messages[0].id);
      const links = extractPressPlayLinks(email.payload);
      articleUrl = links[0] || '';
      log(`取得文章 URL: ${articleUrl}`);

      // 從通知信標題中提取文章主旨
      const notifText = extractTextFromPayload(email.payload);
      const titleMatch = notifText.match(new RegExp(`${DATE_DISPLAY}[^若]+`));
      articleTitle = titleMatch ? titleMatch[0].trim() : DATE_DISPLAY;
    }

    if (articleUrl) {
      log('Playwright 無頭抓取文章...');
      try {
        const fetched = await fetchPressPlayArticle(articleUrl);
        articleTitle = fetched.title || articleTitle;
        articleContent = { content: fetched.content, url: articleUrl };
        log(`抓取成功，內容長度: ${fetched.content.length}`);
      } catch (e) {
        log(`Playwright 抓取失敗: ${e.message}`);
        await notify(`${DATE_DISPLAY} 文章抓取失敗`, `⚠️ 浦惠投顧 ${DATE_DISPLAY} 文章抓取失敗\n\n${e.message}\n\n請手動補建筆記：${articleUrl}`);
        process.exit(1);
      }
    } else {
      log(`今日（${DATE_DISPLAY}）無浦惠投顧郵件，可能未發文（週末/假日/請假）`);
      await notify(`${DATE_DISPLAY} 今日無發文`, `ℹ️ 浦惠投顧 ${DATE_DISPLAY}\n\n今日無發文（週末/假日/老王請假）`);
      return;
    }
  }

  // 5 & 6. AI 摘要（Groq → Gemini fallback）
  log('呼叫 Groq 進行摘要...');
  let markdown;
  try {
    markdown = await summarizeWithGroq(articleTitle, articleContent);
    log('Groq 摘要完成');
  } catch (e) {
    log(`Groq 失敗 (${e.message})，切換 Gemini...`);
    try {
      markdown = await summarizeWithGemini(articleTitle, articleContent);
      log('Gemini 摘要完成');
    } catch (e2) {
      log(`Gemini 也失敗: ${e2.message}`);
      await notify(`${DATE_DISPLAY} AI 摘要失敗`, `⚠️ 浦惠投顧 ${DATE_DISPLAY} AI 摘要失敗\n\nGroq: ${e.message}\nGemini: ${e2.message}`);
      process.exit(1);
    }
  }

  // 若 AI 沒有加原文連結，補上
  if (articleUrl && !markdown.includes(articleUrl)) {
    markdown += `\n\n---\n🔗 [閱讀原文](${articleUrl})`;
  }

  // 7. 寫入 Obsidian
  fs.mkdirSync(OBSIDIAN_DIR, { recursive: true });
  fs.writeFileSync(NOTE_PATH, markdown, 'utf-8');
  log(`筆記寫入完成: ${NOTE_PATH}`);

  // 8. Telegram 通知
  const preview = markdown.split('\n').slice(0, 6).join('\n');
  await notify(
    `${DATE_DISPLAY} 摘要完成 — ${articleTitle.substring(0, 30)}`,
    `✅ 浦惠投顧每日摘要自動完成\n\n📅 ${DATE_DISPLAY}\n📝 ${articleTitle}\n\n${preview.substring(0, 300)}...`
  );
  log('通知已發送（Telegram + Email）');
  log('===== puhui_daily 完成 =====');
}

main().catch(async e => {
  log(`未捕捉錯誤: ${e.message}\n${e.stack}`);
  await notify('puhui_daily 崩潰', `🚨 puhui_daily 崩潰\n\n${e.message}`);
  process.exit(1);
});
