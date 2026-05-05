const fs = require('fs');
const path = require('path');

// Try finding the directory by searching, or just use exact path using buffer/unicode escape sequences to avoid codepage issues
// 大 = \u5927
// 碩 = \u78A9
// 資 = \u8CC7
// 管 = \u7BA1
// 專 = \u5C08
// 案 = \u6848
// 提 = \u63D0
// 示 = \u793A
// 詞 = \u8A5E
// 工 = \u5DE5
// 程 = \u7A0B

const obsidianPath = path.join(
  'C:\\', 'obsidian', '\u5927\u78A9\u8CC7\u7BA1', 'gemini \u5C08\u6848', '\u63D0\u793A\u8A5E\u5DE5\u7A0B', 'PT_Clinical_Decision_Support_System.md'
);

const logEntry = `
## [2026-05-05]
- **完成 DIRECTIVE B8**：實作 InsightPane 的 Mermaid 流程圖匯出功能，將 nodes/edges 依據色碼及安全路徑規則轉換為 Mermaid 語法。已驗證 TypeScript 型別並提交至 GitHub (Commit: 23432cb)。
`;

try {
  if (fs.existsSync(obsidianPath)) {
    let content = fs.readFileSync(obsidianPath, 'utf8');
    // Basic append to the top of some backlog or at the bottom.
    // Let's just append it to the end of the file for now, or if there's a progress section, inject it.
    // Assuming just appending works.
    fs.appendFileSync(obsidianPath, '\n' + logEntry, 'utf8');
    console.log('Successfully updated Obsidian log.');
  } else {
    console.log('File not found: ' + obsidianPath);
    // Since this is just an external tracker, let's gracefully fail if not present to not block.
    // Often paths change. Let's just create it if missing, or maybe the path is different.
    // E.g., 'C:\obsidian\大碩資管\gemini 專案\提示詞工程\PT_Clinical_Decision_Support_System.md'
    // Let's create a backup in the workspace just in case.
    fs.writeFileSync('obsidian_sync_backup.md', logEntry, 'utf8');
  }
} catch (e) {
  console.error('Error:', e);
}
