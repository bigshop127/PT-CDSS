/**
 * puhui_synthesize.js
 * 讀取 data/puhui_analysis 中的所有 JSON 結果，
 * 並使用本地 DeepSeek 總結老王的選股條件，
 * 與我們現有的 RSI+MA+三陽開泰 策略做比較，提出改善建議。
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ANALYSIS_DIR = path.join(__dirname, '../data/puhui_analysis');

function ollamaSynthesize(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'qwen2.5:7b',
      prompt,
      stream: false,
      options: { temperature: 0.2, num_ctx: 16384 }
    });

    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.response || '');
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function topN(counter, n) {
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k}(${v})`);
}

function buildAggregated(reports) {
  const regimeCount = { BULL: 0, BEAR: 0, NEUTRAL: 0 };
  const stockCount = {};
  const entryCount = {};
  const exitCount = {};
  const macroCount = {};
  const sectorCount = {};
  const insightSamples = [];
  const regimeTimeline = [];

  for (const r of reports) {
    const regime = (r.market_regime || 'NEUTRAL').toUpperCase();
    regimeCount[regime] = (regimeCount[regime] || 0) + 1;
    regimeTimeline.push({ date: r.date, regime, reason: (r.market_regime_reason || '').slice(0, 60) });

    for (const s of r.mentioned_stocks) {
      const name = typeof s === 'object' ? (s.stock_name || s.name || JSON.stringify(s)).slice(0, 20) : String(s).slice(0, 20);
      if (name) stockCount[name] = (stockCount[name] || 0) + 1;
    }
    for (const e of r.entry_conditions_mentioned) {
      const key = String(e).slice(0, 50);
      entryCount[key] = (entryCount[key] || 0) + 1;
    }
    for (const e of r.exit_conditions_mentioned) {
      const key = String(e).slice(0, 50);
      exitCount[key] = (exitCount[key] || 0) + 1;
    }
    for (const m of r.global_macro) {
      const key = String(m).slice(0, 50);
      macroCount[key] = (macroCount[key] || 0) + 1;
    }
    for (const s of r.sector_special_reports) {
      const key = String(s).slice(0, 50);
      sectorCount[key] = (sectorCount[key] || 0) + 1;
    }
    if (r.strategy_insights && insightSamples.length < 40) {
      insightSamples.push(r.strategy_insights.slice(0, 120));
    }
  }

  // Sort timeline newest first, keep 20 samples spread across range
  const step = Math.max(1, Math.floor(regimeTimeline.length / 20));
  const timelineSample = regimeTimeline.filter((_, i) => i % step === 0).slice(0, 20);

  return {
    totalReports: reports.length,
    regimeCount,
    timelineSample,
    top30Stocks: topN(stockCount, 30),
    top20Entry: topN(entryCount, 20),
    top20Exit: topN(exitCount, 20),
    top20Macro: topN(macroCount, 20),
    top20Sector: topN(sectorCount, 20),
    insightSamples,
  };
}

async function main() {
  const files = fs.readdirSync(ANALYSIS_DIR).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log("No analysis JSON files found. Run puhui_pipeline.js first.");
    return;
  }

  const reports = [];
  let skipped = 0;
  for (const f of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(ANALYSIS_DIR, f), 'utf-8'));
      const a = content.analysis;
      if (!a || a.parse_error || !a.market_regime) { skipped++; continue; }
      reports.push({
        date: content.pubDate || 'unknown',
        market_regime:              a.market_regime            || 'NEUTRAL',
        market_regime_reason:       a.market_regime_reason     || '',
        global_macro:               Array.isArray(a.global_macro) ? a.global_macro : [],
        index_0050_observation:     a.index_0050_observation   || '',
        volume_signal:              a.volume_signal            || '',
        mentioned_stocks:           Array.isArray(a.mentioned_stocks) ? a.mentioned_stocks : [],
        sector_special_reports:     Array.isArray(a.sector_special_reports) ? a.sector_special_reports : [],
        entry_conditions_mentioned: Array.isArray(a.entry_conditions_mentioned) ? a.entry_conditions_mentioned : [],
        exit_conditions_mentioned:  Array.isArray(a.exit_conditions_mentioned) ? a.exit_conditions_mentioned : [],
        strategy_insights:          a.strategy_insights        || '',
      });
    } catch (e) {
      console.warn(`Skipping ${f}: ${e.message}`);
      skipped++;
    }
  }
  if (skipped > 0) console.log(`Skipped ${skipped} malformed records (parse_error / missing fields).`);

  const agg = buildAggregated(reports);
  console.log(`Aggregated ${agg.totalReports} reports → condensed stats, est. prompt ~3k tokens`);

  const prompt = `你是台股量化策略分析師。以下是「浦惠投顧老王」共 ${agg.totalReports} 篇文章的統計彙整（已預先聚合），請根據這份彙整報告，深入分析老王的選股邏輯並提出策略優化建議。

## 市場趨勢統計（${agg.totalReports} 篇）
- BULL: ${agg.regimeCount.BULL || 0} 篇，BEAR: ${agg.regimeCount.BEAR || 0} 篇，NEUTRAL: ${agg.regimeCount.NEUTRAL || 0} 篇

## 市場趨勢時間軸（抽樣 20 筆）
${agg.timelineSample.map(t => `${t.date} → ${t.regime}（${t.reason}）`).join('\n')}

## Top 30 最常提及個股（次數）
${agg.top30Stocks.join('、')}

## Top 20 最常提及進場條件
${agg.top20Entry.join('、')}

## Top 20 最常提及出場條件
${agg.top20Exit.join('、')}

## Top 20 全球總經主題
${agg.top20Macro.join('、')}

## Top 20 產業/族群主題
${agg.top20Sector.join('、')}

## 策略洞察精選（40 則）
${agg.insightSamples.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

我們現有的量化策略 (RSI+MA+三陽開泰) 條件：
1. 趨勢：Close > MA5 > MA10 > MA20 > MA60
2. 動能：RSI14 >= 50
3. 量能：Volume > 1.2 × VolMA20
4. 型態：三陽開泰，回檔 ≤ 3 天
5. 乖離率：(Close/MA10-1) < 8%
6. 大盤：0050 > MA60

七維度權重模型（待整合）：
- 技術指標 25%、鯨魚動向 16%、資金費率 15%、新聞情緒 11%、盤口流向 10%、恐懼貪婪 5%

---

請以 Markdown 格式回答：
1. **老王核心邏輯與市場洞察總結**（趨勢判斷邏輯、關鍵族群偏好、進出場習慣）
2. **七維度模型實作建議**（3~5 個可量化計算公式）
3. **現有策略進階優化計畫**（如何加入老王邏輯？優先建議 2~3 個具體條件）
4. **推薦關注族群與個股**（依頻率排序，列出 Top 10）
`;

  console.log(`Analyzing ${reports.length} reports to generate synthesis...`);
  const result = await ollamaSynthesize(prompt);
  
  // Clean think tags from deepseek r1 response
  const cleanResult = result.replace(/<think>[\s\S]*?<\/think>\n?/g, '');
  
  const outputPath = path.join(__dirname, '../data/puhui_synthesis.md');
  fs.writeFileSync(outputPath, cleanResult, 'utf-8');
  console.log(`Synthesis complete! Saved to ${outputPath}`);
}

main().catch(console.error);
