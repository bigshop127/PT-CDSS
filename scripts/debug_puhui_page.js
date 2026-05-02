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
  await page.goto(URL, { waitUntil: 'networkidle' });
  
  console.log("Saving screenshot and HTML debug info...");
  await page.screenshot({ path: 'data/puhui_page_debug.png' });
  const html = await page.content();
  fs.writeFileSync('data/puhui_page_debug.html', html);
  
  // Look for buttons that might load more
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(b => ({
      text: b.innerText,
      tagName: b.tagName,
      className: b.className
    })).filter(b => b.text.includes('更多') || b.text.includes('載入') || b.text.includes('Load'));
  });
  console.log("Possible load more buttons:", buttons);

  await browser.close();
}

main().catch(console.error);
