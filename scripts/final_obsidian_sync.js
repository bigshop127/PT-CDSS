const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Defined paths from user input
const src = "C:\\obsidian\\儲存庫\\gemini\\PT_Clinical_Decision_Support_System.md";
const out = "C:\\obsidian\\儲存庫\\gemini 執行的各項專案說明存放處\\PT_Clinical_Decision_Support_System";

console.log(`Source: ${src}`);
console.log(`Output: ${out}`);

if (!fs.existsSync(src)) {
    console.error(`Error: Source file not found at ${src}`);
    process.exit(1);
}

if (!fs.existsSync(out)) {
    console.log(`Creating output directory: ${out}`);
    fs.mkdirSync(out, { recursive: true });
}

try {
    // Execute the refactor script with absolute paths
    execSync(`npx ts-node scripts/obsidian_refactor.ts "${src}" "${out}"`, { stdio: 'inherit' });
    console.log('\nSUCCESS: Files have been refactored into the target Obsidian directory.');
} catch (err) {
    console.error('\nERROR: Execution failed:', err.message);
}
