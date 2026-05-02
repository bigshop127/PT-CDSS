const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'CF6DA5CB5BE8C843FE37526843D3E126';
const COOKIE = process.env.PP_COOKIE || `JAccessToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NzcwMjM1OTAsImV4cCI6MTc3OTYxNTU5MCwiZGF0YSI6eyJhY2Nlc3NUb2tlbiI6IjZkZjgzMzljYjE3MjY1Mjg2MjA0MmRhZTk1ZGU2M2Q0NzZiYzM5YTAiLCJtZW1iZXJfaWQiOiI5NkMwRjY4RUIzNjg1NTA4NUM2RjdEQTczMDM3OUQ2MCJ9fQ.UZuRkUcGGUOTVAZlBv92ufssawOe3DIGKuMGErb5-wE; PHPSESSID=568jb4qoda7bj7faqb51ps019r; pp_identify=72dff85f0f6c397867acca3c2995457d; salt=19dbedb80df223f-07f45531a5719c8-26061e51-1a298c-19dbedb80e0284b`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const cookiesArr = [];
  COOKIE.split(';').forEach(c => {
    const parts = c.trim().split('=');
    if (parts.length >= 2) {
      cookiesArr.push({
        name: parts[0],
        value: parts.slice(1).join('='),
        domain: '.pressplay.cc',
        path: '/'
      });
    }
  });
  await context.addCookies(cookiesArr);

  const page = await context.newPage();
  
  let articleList = [];

  // Listen for API responses that might contain article lists
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api/project/articles') || url.includes('api/member/learning/projects')) {
      try {
        const data = await response.json();
        console.log(`Intercepted API: ${url}`);
        if (data && data.data && Array.isArray(data.data.articles)) {
          data.data.articles.forEach(a => {
            articleList.push({
              id: a.id || a.article_id,
              title: a.title,
              pubDate: a.published_at || a.date
            });
          });
        } else if (data && Array.isArray(data.data)) {
           data.data.forEach(a => {
             if (a.id) articleList.push({ id: a.id, title: a.title, pubDate: a.published_at });
           });
        }
      } catch (e) {
        // Not JSON or other error
      }
    }
  });

  const memberUrl = `https://www.pressplay.cc/member/learning/projects/${PROJECT_ID}/articles`;
  console.log(`Navigating to ${memberUrl}...`);
  await page.goto(memberUrl, { waitUntil: 'networkidle' });

  // Scroll a few times to trigger lazy loading
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    console.log(`Scrolled ${i+1} times, current count: ${articleList.length}`);
  }

  // Deduplicate
  const seen = new Set();
  const unique = [];
  articleList.forEach(a => {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      unique.push(a);
    }
  });

  console.log(`Total unique articles found via API: ${unique.length}`);
  fs.writeFileSync('data/puhui_urls_api.json', JSON.stringify(unique, null, 2), 'utf-8');

  await browser.close();
}

main().catch(console.error);
