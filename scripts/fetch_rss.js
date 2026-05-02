const { chromium } = require('playwright');
const fs = require('fs');

const RSS_URL = 'https://www.pressplay.cc/rss/project/CF6DA5CB5BE8C843FE37526843D3E126';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log(`Fetching RSS: ${RSS_URL}`);
  await page.goto(RSS_URL, { waitUntil: 'networkidle' });
  const content = await page.content();
  
  // Extract items from XML
  const items = content.match(/<item>[\s\S]*?<\/item>/g) || [];
  console.log(`Found ${items.length} items in RSS.`);
  
  const articles = items.map(item => {
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    
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
