const { chromium } = require('playwright');
const fs = require('fs');

const PROJECT_ID = 'CF6DA5CB5BE8C843FE37526843D3E126';
const URL = `https://www.pressplay.cc/project/${PROJECT_ID}/articles?type=all`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(URL, { waitUntil: 'networkidle' });

  let articles = [];
  let lastCount = 0;
  
  for (let i = 0; i < 50; i++) {
    const newArticles = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('a[href*="/articles/"]'));
      return items.map(item => {
        const id = item.href.split('/').pop().split('?')[0];
        const title = item.innerText.trim();
        return { id, title };
      }).filter(a => a.id.length > 20);
    });

    newArticles.forEach(a => {
      if (!articles.find(exist => exist.id === a.id)) articles.push(a);
    });

    console.log(`Scroll ${i}: Total ${articles.length} articles.`);
    
    // PressPlay public articles often load on scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    if (articles.length === lastCount && i > 10) break;
    lastCount = articles.length;
  }

  fs.writeFileSync('data/puhui_urls_public.json', JSON.stringify(articles, null, 2));
  console.log(`Saved ${articles.length} articles to puhui_urls_public.json`);
  await browser.close();
}

main().catch(console.error);
