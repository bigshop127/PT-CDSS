const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const DRIVE_ROOT_ID = '1OslCCU-8tY3y9p084hWJeO78o7HKIYug';

async function processFolder(folderId, folderName) {
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)'
    });
    const files = res.data.files;
    
    // 1. 識別是否有拆分章節 (含有 "Chapter" 的檔案)
    const chapterFiles = files.filter(f => f.name.toLowerCase().includes('chapter') && f.mimeType === 'application/pdf');
    const fullPdfs = files.filter(f => f.mimeType === 'application/pdf' && !f.name.toLowerCase().includes('chapter'));

    if (chapterFiles.length > 0) {
        for (const fullPdf of fullPdfs) {
            // 如果完整版 PDF 的名稱出現在章節檔名中，或是兩者名稱高度相關
            // 例如 "Dutton's.pdf" 和 "Dutton's - Chapter 1.pdf"
            const isDuplicate = chapterFiles.some(cf => cf.name.toLowerCase().includes(fullPdf.name.toLowerCase().replace('.pdf', '')));
            
            if (isDuplicate) {
                console.log(`[Delete Duplicate] Removing full version as chapters exist: ${fullPdf.name} in ${folderName}`);
                await drive.files.update({ fileId: fullPdf.id, resource: { trashed: true } });
            }
        }
    }

    // 2. 處理資料夾
    for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
            await processFolder(file.id, file.name);
        }
    }
}

(async () => {
    console.log('Searching and removing duplicates (Full vs Split)...');
    try {
        await processFolder(DRIVE_ROOT_ID, '原文書');
        console.log('Duplicate removal completed!');
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
