const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const STRAY_ID = '1bERHnzt7Fyv6STLXjHReZKJK2J8M4gK_'; // 帶空格的資料夾
const FOLDER_07_ID = '1z39zozHpEE83PLt4BztXIl9QTcSJz0Hq'; // 07 資料夾

(async () => {
    try {
        // 1. 找 07 裡的 Foundational Science
        const res07 = await drive.files.list({ q: `'${FOLDER_07_ID}' in parents and trashed = false` });
        const folderFS = res07.data.files.find(f => f.name.includes('Foundational Science'));

        // 2. 找 FS 裡的正確 Therapeutic Exercise
        const resFS = await drive.files.list({ q: `'${folderFS.id}' in parents and trashed = false` });
        const correctTE = resFS.data.files.find(f => f.name === 'Therapeutic Exercise');

        console.log(`Merging ${STRAY_ID} into ${correctTE.id}`);
        
        // 3. 搬移檔案
        const resFiles = await drive.files.list({ q: `'${STRAY_ID}' in parents and trashed = false` });
        for (const file of resFiles.data.files) {
            console.log(`  Moving: ${file.name}`);
            await drive.files.update({
                fileId: file.id,
                addParents: correctTE.id,
                removeParents: STRAY_ID
            });
        }

        // 4. 刪除多餘資料夾
        await drive.files.update({ fileId: STRAY_ID, resource: { trashed: true } });
        console.log('Success! Stray Therapeutic Exercise folder merged and removed.');

    } catch (err) {
        console.error('Error:', err.message);
    }
})();
