const { chromium } = require('playwright');
const fs = require('fs');

const PROJECT_ID = 'CF6DA5CB5BE8C843FE37526843D3E126';
const BASE_URL = `https://www.pressplay.cc/member/learning/projects/${PROJECT_ID}/articles`;
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
  
  let allArticles = [];

  for (let p = 31; p <= 115; p++) {
      const url = `${BASE_URL}?page=${p}`;
      console.log(`Navigating to Page ${p}: ${url}`);
      try {
          await page.goto(url, { waitUntil: 'load' });
          // Wait until the pagination highlights page 'p'
          await page.waitForSelector(`.pp-pagination-item.selected span`, { timeout: 10000 });
          const selectedPage = await page.evaluate(() => document.querySelector('.pp-pagination-item.selected').innerText.trim());
          
          if (selectedPage != p.toString()) {
              console.log(`Page mismatch: expected ${p}, got ${selectedPage}. Retrying with click...`);
              // Try to find the button for page 'p' and click it
              const pageBtn = await page.$(`.pp-pagination-item[data-type="number"]:has-text("${p}")`);
              if (pageBtn) {
                  await pageBtn.click();
                  await page.waitForTimeout(5000);
              }
          }

          const pageArticles = await page.evaluate(() => {
              const links = Array.from(document.querySelectorAll('a[href*="/articles/"]'));
              return links.map(item => {
                  const id = item.href.split('/').pop().split('?')[0];
                  const title = item.innerText.trim().split('\n')[0];
                  const card = item.closest('.article-card');
                  const dateEl = card ? (card.querySelector('[itemprop="datePublished"]') || card.querySelector('[data-type="time"]')) : null;
                  const date = dateEl ? (dateEl.content || dateEl.innerText) : '';
                  return { id, title, date };
              }).filter(a => a.id.length > 20);
          });
          
          if (pageArticles.length === 0) break;
          
          pageArticles.forEach(a => {
              if (!allArticles.find(exist => exist.id === a.id)) allArticles.push(a);
          });
          
          console.log(`Added ${pageArticles.length}. Total: ${allArticles.length}. Date: ${pageArticles[0].date}`);
          
          if (p % 10 === 0) {
              fs.writeFileSync(`data/puhui_urls_part_${p}.json`, JSON.stringify(allArticles, null, 2));
          }
      } catch (e) {
          console.error(`Error on page ${p}:`, e.message);
      }
  }

  fs.writeFileSync('data/puhui_urls_paginated_v2.json', JSON.stringify(allArticles, null, 2));
  await browser.close();
}

main().catch(console.error);
