const { chromium } = require('playwright');
const fs = require('fs');

const PROJECT_ID = 'CF6DA5CB5BE8C843FE37526843D3E126';
const RSS_URL = `https://www.pressplay.cc/rss/project/${PROJECT_ID}`;
const COOKIE = process.env.PP_COOKIE || `JAccessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzcwMjM1OTAsImV4cCI6MTc3OTYxNTU5MCwiZGF0YSI6eyJhY2Nlc3NUb2tlbiI6IjZkZjgzMzljYjE3MjY1Mjg2MjA0MmRhZTk1ZGU2M2Q0NzZiYzM5YTAiLCJtZW1iZXJfaWQiOiI5NkMwRjY4RUIzNjg1NTA4NUM2RjdEQTczMDM3OUQ2MCJ9fQ.UZuRkUcGGUOTVAZlBv92ufssawOe3DIGKuMGErb5-wE; PHPSESSID=568jb4qoda7bj7faqb51ps019r; pp_identify=72dff85f0f6c397867acca3c2995457d; salt=19dbedb80df223f-07f45531a5719c8-26061e51-1a298c-19dbedb80e0284b`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const cookiesArr = [];
  COOKIE.split(';').forEach(c => {
    const parts = c.trim().split('=');
    if (parts.length >= 2) cookiesArr.push({ name: parts[0], value: parts.slice(1).join('='), domain: '.pressplay.cc', path: '/' });
  });
  await context.addCookies(cookiesArr);

  const page = await context.newPage();
  console.log(`Fetching RSS with cookies: ${RSS_URL}`);
  await page.goto(RSS_URL, { waitUntil: 'networkidle' });
  const content = await page.content();
  
  // Extract items from XML
  const items = content.match(/&lt;item&gt;[\s\S]*?&lt;\/item&gt;/g) || content.match(/<item>[\s\S]*?<\/item>/g) || [];
  console.log(`Found ${items.length} items in RSS.`);
  
  const articles = items.map(item => {
    // Decode HTML entities if necessary
    const decoded = item.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const titleMatch = decoded.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || decoded.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = decoded.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = decoded.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    
    const title = titleMatch ? titleMatch[1] : '';
    const link = linkMatch ? linkMatch[1] : '';
    const id = link.split('/').pop().split('?')[0];
    const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString().slice(0, 10) : '';
    
    return { id, title, pubDate };
  });

  fs.writeFileSync('data/puhui_urls_rss.json', JSON.stringify(articles, null, 2));
  console.log(`Saved ${articles.length} articles from RSS.`);
  await browser.close();
}

main().catch(console.error);
