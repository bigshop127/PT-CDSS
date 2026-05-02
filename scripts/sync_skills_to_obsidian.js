const fs = require('fs');
const path = require('path');

const SKILLS_DIR = 'C:\\Users\\bigsh\\.gemini\\skills';
const OBSIDIAN_SKILLS_DIR = 'C:\\obsidian\\儲存庫\\CC\\skills嚗極謚哨蝛';

function syncSkills() {
    console.log('--- 開始同步技能清單至 Obsidian ---');
    
    if (!fs.existsSync(SKILLS_DIR)) {
        console.error('找不到系統技能目錄');
        return;
    }

    const skills = fs.readdirSync(SKILLS_DIR).filter(file => {
        const fullPath = path.join(SKILLS_DIR, file);
        return fs.statSync(fullPath).isDirectory();
    });

    let indexMd = "# 🧠 Gemini 技能大腦清單\n\n";
    indexMd += "此文件由系統自動生成，記錄目前 Gemini CLI 已掛載的所有技能（與 Obsidian 同步中）。\n\n";
    indexMd += "| 技能名稱 | 說明 | 狀態 |\n";
    indexMd += "| --- | --- | --- |\n";

    skills.forEach(skillName => {
        const skillPath = path.join(SKILLS_DIR, skillName);
        const skillMdPath = path.join(skillPath, 'SKILL.md');
        let description = '無說明';

        if (fs.existsSync(skillMdPath)) {
            const content = fs.readFileSync(skillMdPath, 'utf-8');
            const match = content.match(/description:\s*(.*)/);
            if (match && match[1]) {
                description = match[1].trim();
            }
        }

        indexMd += "| [[" + skillName + "/SKILL.md|" + skillName + "]] | " + description + " | ✅ 已同步 |\n";
    });

    indexMd += "\n\n---\n*最後更新時間: " + new Date().toLocaleString() + "*";

    const outputPath = path.join(OBSIDIAN_SKILLS_DIR, '00_技能索引.md');
    fs.writeFileSync(outputPath, indexMd, 'utf-8');
    
    console.log(`同步完成！已更新索引至: ${outputPath}`);
}

syncSkills();
