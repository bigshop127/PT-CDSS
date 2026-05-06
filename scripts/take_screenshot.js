import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  
  try {
    console.log('Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    
    // Wait for auth and components to settle
    await page.waitForTimeout(10000); 
    
    const path = 'ui-preview.png';
    await page.screenshot({ path });
    console.log(`Screenshot saved to ${path}`);
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    await browser.close();
  }
})();
