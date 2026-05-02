const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const LOCAL_ROOT = 'C:\\Users\\bigsh\\OneDrive\\桌面\\全部所需 原文書';
const DRIVE_ROOT_ID = '1OslCCU-8tY3y9p084hWJeO78o7HKIYug';

async function getOrCreateFolder(folderName, parentId) {
    // 1. 嘗試完全匹配
    let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
    let res = await drive.files.list({ q: query, fields: 'files(id, name)' });
    
    if (res.data.files.length > 0) return res.data.files[0].id;

    // 2. 嘗試模糊匹配（處理名稱不完整的情況）
    // 例如：本機叫 "01_基礎評估"，雲端叫 "基礎評估"
    const simpleName = folderName.replace(/^\d+_/, ''); // 去除編號前綴
    query = `name contains '${simpleName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
    res = await drive.files.list({ q: query, fields: 'files(id, name)' });

    if (res.data.files.length > 0) {
        const existingFolder = res.data.files[0];
        console.log(`[Rename Folder] ${existingFolder.name} -> ${folderName}`);
        await drive.files.update({
            fileId: existingFolder.id,
            resource: { name: folderName }
        });
        return existingFolder.id;
    }

    // 3. 建立新資料夾
    const folder = await drive.files.create({
        resource: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
        fields: 'id'
    });
    return folder.data.id;
}

async function uploadOrRenameFile(localPath, folderId) {
    const fileName = path.basename(localPath);
    const simpleName = fileName.replace(/^\d+_/, '').replace(/\.pdf$/i, '');

    // 1. 檢查完全匹配
    let query = `name = '${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`;
    let res = await drive.files.list({ q: query, fields: 'files(id, name)' });
    
    if (res.data.files.length > 0) {
        // console.log(`[Skip] ${fileName} exists.`);
        return;
    }

    // 2. 檢查模糊匹配並更名
    query = `name contains '${simpleName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`;
    res = await drive.files.list({ q: query, fields: 'files(id, name)' });

    if (res.data.files.length > 0) {
        const existingFile = res.data.files[0];
        console.log(`[Rename File] ${existingFile.name} -> ${fileName}`);
        await drive.files.update({
            fileId: existingFile.id,
            resource: { name: fileName }
        });
        return;
    }

    // 3. 上傳新檔案
    console.log(`[Upload] Sending: ${fileName}`);
    await drive.files.create({
        resource: { name: fileName, parents: [folderId] },
        media: { mimeType: 'application/pdf', body: fs.createReadStream(localPath) },
        fields: 'id'
    });
}

async function syncDirectory(localDir, driveParentId) {
    const entries = fs.readdirSync(localDir, { withFileTypes: true });
    const hasSplitChapters = entries.some(e => e.isFile() && e.name.toLowerCase().includes('chapter'));
    
    for (const entry of entries) {
        const fullPath = path.join(localDir, entry.name);
        
        if (entry.isDirectory()) {
            const newFolderId = await getOrCreateFolder(entry.name, driveParentId);
            await syncDirectory(fullPath, newFolderId);
        } else if (entry.isFile()) {
            if (hasSplitChapters && entry.name.toLowerCase().endsWith('.pdf') && !entry.name.toLowerCase().includes('chapter')) {
                continue;
            }
            if (entry.name.toLowerCase().endsWith('.pdf')) {
                await uploadOrRenameFile(fullPath, driveParentId);
            }
        }
    }
}

(async () => {
    console.log('Starting sync and rename process...');
    try {
        await syncDirectory(LOCAL_ROOT, DRIVE_ROOT_ID);
        console.log('Sync and rename completed!');
    } catch (err) {
        console.error('Task failed:', err.message);
    }
})();
