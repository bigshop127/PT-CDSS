const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findFile(dir, target) {
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                const found = findFile(fullPath, target);
                if (found) return found;
            } else if (file === target) {
                return fullPath;
            }
        }
    } catch (e) {}
    return null;
}

const targetName = 'PT_Clinical_Decision_Support_System.md';
const src = findFile('C:\\obsidian', targetName);

if (src) {
    const out = path.join(path.dirname(src), 'PT_CDSS_Restructured');
    console.log(`Found Source: ${src}`);
    console.log(`Target Output: ${out}`);
    
    try {
        // Run the refactor script
        execSync(`npx ts-node scripts/obsidian_refactor.ts "${src}" "${out}"`, { stdio: 'inherit' });
        console.log('Successfully refactored inside Obsidian vault.');
    } catch (err) {
        console.error('Execution failed:', err.message);
    }
} else {
    console.error('Could not find the target Markdown file in C:\\obsidian');
}
