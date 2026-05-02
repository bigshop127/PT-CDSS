/**
 * fetch_puhui_urls.js
 * 從 Gmail 撈出所有浦惠投顧通知信，解析出 PressPlay 文章 URL + 標題 + 日期
 * 輸出 JSON 到 stdout
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

function extractPressPlayUrl(html) {
    // Find pressplay.cc article URLs in HTML
    const matches = html.match(/https?:\/\/[^"'\s]*pressplay\.cc[^"'\s]*/gi);
    if (!matches) return null;
    // Prefer article URLs
    const articleUrl = matches.find(u => u.includes('/articles/'));
    return articleUrl || matches[0];
}

function decodeBase64Url(str) {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

function extractHtmlFromPayload(payload) {
    if (!payload) return '';

    // Direct body
    if (payload.body && payload.body.data) {
        return decodeBase64Url(payload.body.data);
    }

    // Multi-part
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/html' && part.body && part.body.data) {
                return decodeBase64Url(part.body.data);
            }
            // Nested parts
            if (part.parts) {
                for (const subPart of part.parts) {
                    if (subPart.mimeType === 'text/html' && subPart.body && subPart.body.data) {
                        return decodeBase64Url(subPart.body.data);
                    }
                }
            }
        }
    }
    return '';
}

function getHeader(headers, name) {
    const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
}

async function main() {
    const token = await getAccessToken();

    // Search for all 浦惠 notification emails
    let articles = [];
    let pageToken = null;

    do {
        const q = encodeURIComponent('from:service@inclusion.com.tw 浦惠');
        const ptParam = pageToken ? `&pageToken=${pageToken}` : '';
        const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=100${ptParam}`;

        const listRes = await httpsGet(listUrl, token);
        const messages = listRes.messages || [];
        pageToken = listRes.nextPageToken || null;

        process.stderr.write(`Found ${messages.length} messages (total so far: ${articles.length + messages.length})\n`);

        for (const msg of messages) {
            const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`;
            const detail = await httpsGet(msgUrl, token);

            const headers = detail.payload.headers || [];
            const subject = getHeader(headers, 'subject');
            const date = getHeader(headers, 'date');

            const html = extractHtmlFromPayload(detail.payload);
            const url = extractPressPlayUrl(html);

            if (url) {
                articles.push({ subject, date, url, id: msg.id });
            }
        }

        // Rate limit protection
        if (pageToken) await new Promise(r => setTimeout(r, 500));

    } while (pageToken);

    // Deduplicate by URL
    const seen = new Set();
    const unique = articles.filter(a => {
        if (seen.has(a.url)) return false;
        seen.add(a.url);
        return true;
    });

    // Sort by date descending
    unique.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(JSON.stringify(unique, null, 2));
    process.stderr.write(`\nTotal unique articles: ${unique.length}\n`);
}

main().catch(e => {
    process.stderr.write(`Error: ${e.message}\n`);
    process.exit(1);
});
