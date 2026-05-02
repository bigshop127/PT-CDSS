const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const DRIVE_ROOT_ID = '1OslCCU-8tY3y9p084hWJeO78o7HKIYug';

(async () => {
    const res = await drive.files.list({
        q: `'${DRIVE_ROOT_ID}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)'
    });
    console.log(JSON.stringify(res.data.files, null, 2));
})();
