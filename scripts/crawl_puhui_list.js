const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'CF6DA5CB5BE8C843FE37526843D3E126';
const URL = `https://www.pressplay.cc/member/learning/projects/${PROJECT_ID}/articles`;
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
  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle' });

  let articles = [];
  let lastCount = 0;
  let scrollAttempts = 0;
  const maxScrolls = 1000; 
  let reachedTargetDate = false;

  console.log("Starting deep scroll for history...");

  for (let s = 0; s < maxScrolls; s++) {
    const newArticles = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/articles/"]'));
      return links.map(item => {
        const href = item.getAttribute('href');
        const id = href.split('/').pop().split('?')[0];
        const container = item.closest('div') || item.parentElement;
        const text = container ? container.innerText : '';
        const dateMatch = text.match(/\d{4}\/\d{2}\/\d{2}/) || text.match(/\d{4}-\d{2}-\d{2}/);
        const pubDate = dateMatch ? dateMatch[0] : '';
        const titleElement = item.querySelector('h1, h2, h3, h4, .title') || item;
        const title = titleElement.innerText.trim();
        return { id, title, pubDate };
      }).filter(a => a.id && a.id.length > 20);
    });

    newArticles.forEach(a => {
      if (!articles.find(exist => exist.id === a.id)) {
        articles.push(a);
        if (a.pubDate && (a.pubDate.startsWith('2024/01') || a.pubDate.startsWith('2023'))) {
          reachedTargetDate = true;
        }
      }
    });

    if (s % 10 === 0) {
        console.log(`Scroll ${s}: Found ${articles.length} articles. Latest date: ${articles[articles.length-1]?.pubDate}`);
    }

    if (reachedTargetDate) {
      console.log("Reached target date. Stopping scroll.");
      break;
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    if (articles.length === lastCount) {
        scrollAttempts++;
        if (scrollAttempts > 30) break;
    } else {
        scrollAttempts = 0;
    }
    lastCount = articles.length;
  }

  console.log(`Total articles found: ${articles.length}`);
  fs.writeFileSync('data/puhui_urls_full.json', JSON.stringify(articles, null, 2), 'utf-8');
  await browser.close();
}

main().catch(console.error);
