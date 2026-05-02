const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const prompt = '請只回覆：OK';
const tmp = path.join(os.tmpdir(), 'gp_' + Date.now() + '.txt');
fs.writeFileSync(tmp, prompt, 'utf8');
const r = spawnSync('powershell', [
  '-NoProfile', '-NonInteractive', '-Command',
  "[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); gemini -p ([System.IO.File]::ReadAllText('" + tmp + "'))"
], { encoding: 'utf8', timeout: 30000 });
try { fs.unlinkSync(tmp); } catch (e) {}
console.log('status:', r.status);
console.log('out:', (r.stdout || '').substring(0, 200));
console.log('err:', (r.stderr || '').substring(0, 300));
console.log('error:', r.error && r.error.message);
