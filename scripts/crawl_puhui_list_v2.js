const { chromium } = require('playwright');
const fs = require('fs');

const PROJECT_ID = 'CF6DA5CB5BE8C843FE37526843D3E126';
const URL = `https://www.pressplay.cc/member/learning/projects/${PROJECT_ID}/articles`;
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
  await page.goto(URL, { waitUntil: 'networkidle' });

  let articles = [];
  let lastCount = 0;
  
  for (let i = 0; i < 50; i++) {
    const newArticles = await page.evaluate(() => {
      // Improved selector for PressPlay articles
      const links = Array.from(document.querySelectorAll('a[href*="/articles/"]'));
      return links.map(item => {
        const id = item.href.split('/').pop().split('?')[0];
        const title = item.innerText.trim().split('\n')[0];
        return { id, title };
      }).filter(a => a.id.length > 20);
    });

    newArticles.forEach(a => {
      if (!articles.find(exist => exist.id === a.id)) articles.push(a);
    });

    console.log(`Step ${i}: Found ${articles.length} articles.`);
    
    if (articles.length === lastCount && i > 5) {
       // Try clicking the last article to focus or scroll it
       await page.evaluate(() => {
          const els = document.querySelectorAll('a[href*="/articles/"]');
          if (els.length > 0) els[els.length - 1].scrollIntoView();
          window.scrollBy(0, 500);
       });
    } else {
       await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
    
    await page.waitForTimeout(2000);
    lastCount = articles.length;
  }

  fs.writeFileSync('data/puhui_urls_full.json', JSON.stringify(articles, null, 2));
  await browser.close();
}

main().catch(console.error);
