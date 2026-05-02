const fs = require('fs');
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
async function poll() {
  while(true) {
    const files = fs.readdirSync('./data/puhui_analysis').length;
    console.log(`[poll] analyzed: ${files} / 360`);
    if(files >= 340) break;
    await wait(60000);
  }
}
poll().then(() => {
  const { execSync } = require('child_process');
  console.log('Starting synthesis...');
  execSync('node scripts/puhui_synthesize.js', { stdio: 'inherit' });
  console.log('Starting sync to Obsidian...');
  execSync('node scripts/sync_to_obsidian.js', { stdio: 'inherit' });
  console.log('All done!');
}).catch(err => {
  console.error('Error during poll/sync:', err);
});
