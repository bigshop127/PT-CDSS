/**
 * normalize_puhui_dates.js
 * 把 puhui_urls_paginated.json 的相對時間（"1小時前"/"1天前"/"1週前"/"1個月前"/"1年前"）
 * 轉成絕對日期 (YYYY-MM-DD)，新增 absolute_date 欄位（保留原 date 欄位）。
 *
 * 參考日期：檔案最後更新時間（2026-04-24 22:51）。
 *
 * 用法：node scripts/normalize_puhui_dates.js
 *   --in   <path>   (預設 data/puhui_urls_paginated.json)
 *   --out  <path>   (預設 data/puhui_urls_paginated_dated.json)
 *   --ref  <ISO>    (預設檔案 mtime)
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
    const args = process.argv.slice(2);
    const out = {
        in: 'data/puhui_urls_paginated.json',
        out: 'data/puhui_urls_paginated_dated.json',
        ref: null,
    };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--in') out.in = args[++i];
        else if (args[i] === '--out') out.out = args[++i];
        else if (args[i] === '--ref') out.ref = args[++i];
    }
    return out;
}

const PATTERNS = [
    { re: /^(\d+)\s*小時前$/, unit: 'hours' },
    { re: /^(\d+)\s*天前$/, unit: 'days' },
    { re: /^(\d+)\s*週前$/, unit: 'weeks' },
    { re: /^(\d+)\s*個月前$/, unit: 'months' },
    { re: /^(\d+)\s*年前$/, unit: 'years' },
];

function subtract(refDate, n, unit) {
    const d = new Date(refDate.getTime());
    switch (unit) {
        case 'hours':  d.setHours(d.getHours() - n); break;
        case 'days':   d.setDate(d.getDate() - n); break;
        case 'weeks':  d.setDate(d.getDate() - n * 7); break;
        case 'months': d.setMonth(d.getMonth() - n); break;
        case 'years':  d.setFullYear(d.getFullYear() - n); break;
    }
    return d;
}

function toYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function normalize(rel, refDate) {
    const s = String(rel).trim();
    for (const { re, unit } of PATTERNS) {
        const m = s.match(re);
        if (m) {
            return toYMD(subtract(refDate, parseInt(m[1], 10), unit));
        }
    }
    // 已是絕對日期 (YYYY-MM-DD or YYYY/MM/DD) → 標準化
    const abs = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (abs) {
        const [, y, mm, dd] = abs;
        return `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
    return null;
}

function main() {
    const { in: inPath, out: outPath, ref } = parseArgs();
    const inAbs = path.resolve(inPath);
    const outAbs = path.resolve(outPath);

    if (!fs.existsSync(inAbs)) {
        console.error(`[ERR] 找不到輸入: ${inAbs}`);
        process.exit(1);
    }

    const refDate = ref ? new Date(ref) : fs.statSync(inAbs).mtime;
    console.log(`[INFO] 參考日期：${refDate.toISOString()}`);
    console.log(`[INFO] 讀取：${inAbs}`);

    const data = JSON.parse(fs.readFileSync(inAbs, 'utf8'));
    if (!Array.isArray(data)) {
        console.error('[ERR] 輸入不是陣列');
        process.exit(1);
    }

    const stats = { total: data.length, ok: 0, fail: 0 };
    const failed = [];
    const out = data.map((item) => {
        const abs = normalize(item.date, refDate);
        if (abs) {
            stats.ok++;
            return { ...item, absolute_date: abs };
        }
        stats.fail++;
        failed.push(item.date);
        return { ...item, absolute_date: null };
    });

    fs.writeFileSync(outAbs, JSON.stringify(out, null, 2), 'utf8');
    console.log(`[INFO] 寫出：${outAbs}`);
    console.log(`[STATS] total=${stats.total}  ok=${stats.ok}  fail=${stats.fail}`);
    if (failed.length) {
        const uniq = [...new Set(failed)];
        console.log(`[STATS] 無法解析的格式：${JSON.stringify(uniq)}`);
    }
}

main();
