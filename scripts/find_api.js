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
  
  console.log("Monitoring API traffic...");
  page.on('request', req => {
    if (request_filter(req.url())) {
        console.log(`[REQ] ${req.url()}`);
    }
  });

  function request_filter(url) {
      return url.includes('api') && !url.includes('google') && !url.includes('facebook');
  }

  await page.goto(URL, { waitUntil: 'networkidle' });
  
  // Try to click "View More" or scroll
  for (let i = 0; i < 10; i++) {
      console.log(`Scroll attempt ${i}...`);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(3000);
      
      // Look for any specific buttons
      const hasButton = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, span, div')).filter(el => 
              el.innerText.includes('更多') || el.innerText.includes('載入')
          );
          if (btns.length > 0) {
              btns[0].click();
              return true;
          }
          return false;
      });
      if (hasButton) console.log("Clicked a 'More' button.");
  }

  await browser.close();
}

main().catch(console.error);
