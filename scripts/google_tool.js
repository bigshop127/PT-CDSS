const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });
const docs = google.docs({ version: 'v1', auth: oauth2Client });

// 讀取 Google Doc 文字內容
async function getDocContent(documentId) {
    const res = await docs.documents.get({ documentId });
    let text = '';
    res.data.body.content.forEach(value => {
        if (value.paragraph) {
            value.paragraph.elements.forEach(el => {
                if (el.textRun) text += el.textRun.content;
            });
        }
    });
    return text;
}

// 尋找或建立資料夾
async function getOrCreateFolder(folderName, parentId = null) {
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) query += ` and '${parentId}' in parents`;
    
    const res = await drive.files.list({ q: query, fields: 'files(id, name)' });
    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    }
    
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : []
    };
    const folder = await drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    });
    return folder.data.id;
}

// 上傳檔案
async function uploadFile(localPath, folderId) {
    const fileName = path.basename(localPath);
    const fileMetadata = {
        name: fileName,
        parents: [folderId]
    };
    const media = {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(localPath)
    };
    const res = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    });
    return res.data.id;
}

const action = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

(async () => {
    try {
        if (action === 'read-doc') {
            const content = await getDocContent(arg1);
            console.log(content);
        } else if (action === 'get-folder') {
            const id = await getOrCreateFolder(arg1, arg2);
            console.log(id);
        } else if (action === 'upload') {
            const id = await uploadFile(arg1, arg2);
            console.log(id);
        }
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
})();
