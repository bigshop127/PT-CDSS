/**
 * inspect_email.js — 列出指定郵件的所有超連結
 * Usage: node inspect_email.js <message_id>
 */
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

function httpsPost(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function httpsGet(url, token) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { Authorization: `Bearer ${token}` } }, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function getAccessToken() {
    const body = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token'
    }).toString();
    const res = await httpsPost({
        hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, body);
    return res.access_token;
}

function decodeBase64Url(str) {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractHtml(payload) {
    if (payload.body?.data) return decodeBase64Url(payload.body.data);
    for (const part of (payload.parts || [])) {
        if (part.mimeType === 'text/html' && part.body?.data) return decodeBase64Url(part.body.data);
        for (const sub of (part.parts || [])) {
            if (sub.mimeType === 'text/html' && sub.body?.data) return decodeBase64Url(sub.body.data);
        }
    }
    return '';
}

async function main() {
    const msgId = process.argv[2];
    if (!msgId) { console.error('Usage: node inspect_email.js <message_id>'); process.exit(1); }

    const token = await getAccessToken();
    const detail = await httpsGet(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`, token);

    const html = extractHtml(detail.payload);

    // Extract all href links
    const hrefs = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
    const pressplayLinks = hrefs.filter(u => u.includes('pressplay'));
    const otherLinks = hrefs.filter(u => !u.includes('pressplay')).slice(0, 10);

    console.log('=== PressPlay links ===');
    pressplayLinks.forEach(u => console.log(u));
    console.log('\n=== Other links (first 10) ===');
    otherLinks.forEach(u => console.log(u));

    // Also save raw html for inspection
    require('fs').writeFileSync('/tmp/email_debug.html', html);
    console.log('\nFull HTML saved to /tmp/email_debug.html');
}

main().catch(e => { console.error(e.message); process.exit(1); });
