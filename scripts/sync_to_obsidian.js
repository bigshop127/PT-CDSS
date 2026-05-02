const fs = require('fs');
const path = require('path');

// 設定路徑
const ANALYSIS_DIR = path.join(__dirname, '../data/puhui_analysis');
const DATED_JSON_PATH = path.join(__dirname, '../data/puhui_urls_paginated_dated.json');
const OBSIDIAN_DIR = 'C:\\obsidian\\儲存庫\\浦惠投顧報告整理';

// 確保目錄存在
if (!fs.existsSync(OBSIDIAN_DIR)) {
    fs.mkdirSync(OBSIDIAN_DIR, { recursive: true });
}

function loadDateMap() {
    try {
        const data = JSON.parse(fs.readFileSync(DATED_JSON_PATH, 'utf-8'));
        const map = {};
        data.forEach(item => {
            if (item.id) map[item.id] = item.absolute_date;
        });
        return map;
    } catch (e) {
        return {};
    }
}

// 通用的文字解構函數：防止 [object Object]
function stringify(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        // 優先取常見的內容欄位
        return val.observation || val.content || val.condition || val.warning || val.reason || JSON.stringify(val);
    }
    return String(val);
}

function formatMarkdown(json, absoluteDate) {
    const { title, analysis, id } = json;
    const dateStr = absoluteDate || json.pubDate || '未知日期';
    const displayDate = dateStr.replace(/-/g, '/');
    
    // 投資評等與水位圖示
    const regimeIcon = analysis.market_regime === 'BULL' ? '🐂 BULL' : (analysis.market_regime === 'BEAR' ? '🐻 BEAR' : '⚖️ NEUTRAL');
    const levelColor = (analysis.strategy_insights || '').includes('七成') ? 'red' : 'inherit';

    // 1. YAML Properties
    let md = `---\n`;
    md += `date: ${dateStr}\n`;
    md += `regime: ${analysis.market_regime}\n`;
    md += `tags: [浦惠投顧, 老王, 每日摘要]\n`;
    if (analysis.sector_themes) {
        md += `sectors: [${analysis.sector_themes.join(', ')}]\n`;
    }
    md += `---\n\n`;

    // 2. Title
    md += `# 📊 浦惠投顧每日摘要 — ${displayDate}\n\n`;
    md += `> [!abstract] ${title}\n\n`;

    // 3. 操盤中心
    md += `## 📈 操盤中心\n`;
    md += `> [!summary] **建議策略：<span style="color: ${levelColor}">${stringify(analysis.strategy_insights) || '按訊號操作'}</span>**\n`;
    md += `> - **AI 投資評等**: ${regimeIcon}\n`;
    md += `> - **評等理由**: ${stringify(analysis.market_regime_reason) || '無'}\n`;
    md += `> - **台股量能**: ${stringify(analysis.volume_signal) || '無資料'}\n`;
    md += `\n`;

    // 4. 全球觀測站
    if (analysis.global_macro && analysis.global_macro.length > 0) {
        md += `## 🌎 全球觀測站\n`;
        md += `> [!globe] 國際情勢與美股動向\n`;
        analysis.global_macro.forEach(item => {
            md += `> - ${stringify(item)}\n`;
        });
        md += `\n`;
    }

    // 5. 產業專題分析
    if (analysis.sector_special_reports && analysis.sector_special_reports.length > 0) {
        md += `## 🔍 產業專題分析\n`;
        analysis.sector_special_reports.forEach(report => {
            md += `> [!briefing] ${report.sector}\n`;
            md += `> ${stringify(report)}\n\n`;
        });
    }

    // 6. 大盤觀察
    md += `## 台股盤勢觀察\n`;
    md += `- ${stringify(analysis.index_0050_observation) || '無資料'}\n\n`;

    // 7. 今日個股表格
    md += `## 📌 今日提到個股\n\n`;
    md += `| 代號 | 名稱 | 操作建議 |\n`;
    md += `|------|------|----------|\n`;
    if (analysis.mentioned_stocks && analysis.mentioned_stocks.length > 0) {
        const signalOrder = { 'BUY': 0, 'WATCH': 1, 'HOLD': 1, 'SELL': 2 };
        const sortedStocks = [...analysis.mentioned_stocks].sort((a, b) =>
            (signalOrder[a.signal] ?? 1) - (signalOrder[b.signal] ?? 1)
        );
        sortedStocks.forEach(s => {
            const signalEmoji = s.signal === 'BUY' ? '🟢' : (s.signal === 'SELL' ? '🔴' : '🟡');
            const stockName = s.code ? `[[${s.code} ${s.name}]]` : s.name;
            md += `| ${s.code || '—'} | ${stockName} | ${signalEmoji} ${s.reason} |\n`;
        });
    } else {
        md += `| — | 無 | 無 |\n`;
    }
    md += `\n`;

    // 8. 交易紀律
    md += `## 🛠 交易紀律\n`;
    md += `- **進場參考**: ${analysis.entry_conditions_mentioned?.map(c => stringify(c)).join('、') || '按訊號操作'}\n`;
    md += `- **出場參考**: ${analysis.exit_conditions_mentioned?.map(c => stringify(c)).join('、') || '按訊號操作'}\n`;
    if (analysis.risk_warnings) {
        md += `> [!warning] 風險提示\n`;
        if (Array.isArray(analysis.risk_warnings)) {
            analysis.risk_warnings.forEach(w => md += `> - ${stringify(w)}\n`);
        } else {
            md += `> ${stringify(analysis.risk_warnings)}\n`;
        }
    }
    md += `\n`;

    md += `---\n`;
    md += `🔗 [閱讀原文](https://www.pressplay.cc/project/CF6DA5CB5BE8C843FE37526843D3E126/articles/${id})\n`;

    return md;
}

async function sync() {
    const dateMap = loadDateMap();
    const files = fs.readdirSync(ANALYSIS_DIR).filter(f => f.endsWith('.json'));
    
    console.log(`開始同步 ${files.length} 份報告至 Obsidian (修正 [object Object] 問題)...`);
    
    let successCount = 0;
    for (const file of files) {
        try {
            const content = JSON.parse(fs.readFileSync(path.join(ANALYSIS_DIR, file), 'utf-8'));
            const absDate = dateMap[content.id] || content.pubDate;
            
            if (!absDate) continue;

            const mdContent = formatMarkdown(content, absDate);
            const fileName = `${absDate}.md`;
            const outputPath = path.join(OBSIDIAN_DIR, fileName);
            
            fs.writeFileSync(outputPath, mdContent, 'utf-8');
            successCount++;
        } catch (e) {
            console.error(`處理 ${file} 時發生錯誤:`, e.message);
        }
    }
    
    console.log(`同步完成！共成功轉換 ${successCount} 份檔案。`);
}

sync().catch(console.error);
