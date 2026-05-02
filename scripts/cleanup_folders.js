const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const DRIVE_ROOT_ID = '1OslCCU-8tY3y9p084hWJeO78o7HKIYug';

async function listFolders(parentId) {
    const query = `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
    const res = await drive.files.list({ q: query, fields: 'files(id, name)' });
    return res.data.files;
}

async function moveFile(fileId, oldParentId, newParentId) {
    await drive.files.update({
        fileId: fileId,
        addParents: newParentId,
        removeParents: oldParentId,
        fields: 'id, parents'
    });
}

(async () => {
    const rootFolders = await listFolders(DRIVE_ROOT_ID);
    
    const targets = {}; // 存放 01, 02, 03... 的 ID
    const toMove = [];  // 存放要搬移的資料夾 ID

    rootFolders.forEach(f => {
        if (f.name.startsWith('01_')) targets['01'] = f.id;
        if (f.name.startsWith('02_')) targets['02'] = f.id;
        if (f.name.startsWith('03_')) targets['03'] = f.id;
        if (f.name.startsWith('07_')) targets['07'] = f.id;

        if (f.name === "Dutton's Orthopaedic") toMove.push({ id: f.id, name: f.name, target: '01' });
        if (f.name === "Assessment and Treatment of Muscle Imbalance") toMove.push({ id: f.id, name: f.name, target: '01' });
        if (f.name === "Diagnosis and Treatment of Movement Impairment Syndromes") toMove.push({ id: f.id, name: f.name, target: '02' });
        if (f.name === "Orthopedic Physical Examination Tests") toMove.push({ id: f.id, name: f.name, target: '02' });
        if (f.name === "Human Extremities") toMove.push({ id: f.id, name: f.name, target: '03' });
        if (f.name === "lumbar") toMove.push({ id: f.id, name: f.name, target: '03' });
        if (f.name === "cervical") toMove.push({ id: f.id, name: f.name, target: '03' });
        if (f.name === "Therapeutic Exercise") toMove.push({ id: f.id, name: f.name, target: '07' });
    });

    for (const item of toMove) {
        const targetId = targets[item.target];
        if (targetId) {
            console.log(`[Move] ${item.name} -> Target ${item.target}`);
            await moveFile(item.id, DRIVE_ROOT_ID, targetId);
        } else {
            console.log(`[Error] Target folder ${item.target} not found.`);
        }
    }
    console.log('Final cleanup completed!');
})();
