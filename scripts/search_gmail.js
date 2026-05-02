/**
 * search_gmail.js — 搜尋 Gmail，列出主旨與寄件者
 * Usage: node search_gmail.js "搜尋詞"
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
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token'
    }).toString();
    const res = await httpsPost({
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }, body);
    return res.access_token;
}

function getHeader(headers, name) {
    const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
}

async function main() {
    const query = process.argv[2] || '浦惠';
    const token = await getAccessToken();

    const q = encodeURIComponent(query);
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=50`;
    const listRes = await httpsGet(listUrl, token);
    const messages = listRes.messages || [];

    console.log(`Found ${messages.length} messages for query: "${query}"\n`);

    for (const msg of messages) {
        const detail = await httpsGet(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            token
        );
        const h = detail.payload.headers || [];
        console.log(`Date: ${getHeader(h,'date')}`);
        console.log(`From: ${getHeader(h,'from')}`);
        console.log(`Subject: ${getHeader(h,'subject')}`);
        console.log('---');
    }
}

main().catch(e => { console.error(e.message); process.exit(1); });
