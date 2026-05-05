import * as fs from 'fs';
import * as path from 'path';

/**
 * Refactors a single Markdown file into a nested directory structure.
 * Logic:
 * 1. Headings (#, ##, ###) define directory depth.
 * 2. Each heading creates a folder.
 * 3. Content under a heading (before the next heading) goes into <heading>.md inside that folder.
 * 4. Empty sections (no content, only subheadings) do not get a .md file.
 */

function findFile(dir: string, target: string): string | null {
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
const foundSource = findFile('C:\\obsidian', targetName);
const sourceFile = process.argv[2] || foundSource || '';
const outputDir = process.argv[3] || 'C:\\gemini CLI\\PT-CDSS\\data\\PT-CDSS_Refactored';

function sanitize(name: string): string {
    return name.trim().replace(/[<>:"/\\|?*]/g, '_');
}

function refactor() {
    console.log(`Reading from: ${sourceFile}`);
    console.log(`Outputting to: ${outputDir}`);

    if (!fs.existsSync(sourceFile)) {
        console.error('Source file not found.');
        return;
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const content = fs.readFileSync(sourceFile, 'utf8');
    const lines = content.split('\n');

    let currentPathStack: { level: number; name: string; fullPath: string }[] = [];
    let currentSectionContent: string[] = [];
    let lastHeading: { level: number; name: string; fullPath: string } | null = null;

    function finalizeSection() {
        if (!lastHeading) return;

        const sectionContent = currentSectionContent.join('\n').trim();
        if (sectionContent) {
            const fileName = `${lastHeading.name}.md`;
            const filePath = path.join(lastHeading.fullPath, fileName);
            fs.writeFileSync(filePath, sectionContent);
            console.log(`Created: ${filePath}`);
        }
        currentSectionContent = [];
    }

    for (const line of lines) {
        const headingMatch = line.match(/^(#+)\s+(.+)$/);
        if (headingMatch) {
            // Finalize previous section
            finalizeSection();

            const level = headingMatch[1].length;
            const rawName = headingMatch[2].trim();
            const name = sanitize(rawName);

            // Adjust stack: pop until we find the parent level
            while (currentPathStack.length > 0 && currentPathStack[currentPathStack.length - 1].level >= level) {
                currentPathStack.pop();
            }

            const parentPath = currentPathStack.length > 0 
                ? currentPathStack[currentPathStack.length - 1].fullPath 
                : outputDir;
            
            const fullPath = path.join(parentPath, name);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }

            const newNode = { level, name, fullPath };
            currentPathStack.push(newNode);
            lastHeading = newNode;
        } else {
            currentSectionContent.push(line);
        }
    }

    // Finalize the last section
    finalizeSection();

    console.log('Refactor complete.');
}

refactor();
