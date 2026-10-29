// Environment Lab screenshots: loads /envlab.html for a subject, saves the page and the contact sheet.
// usage: node tools/envlab-shots.cjs <outDir> [subject] [weather]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const out = process.argv[2] || 'envlab-shots';
  const subject = process.argv[3] || 'prop:date_palm';
  const weather = process.argv[4] || 'clear';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1980, height: 1300 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  const base = process.env.URL || 'http://localhost:5173/envlab.html';
  await page.goto(`${base}?subject=${subject}&weather=${weather}&animate=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.envlab && window.envlab.ready, null, { timeout: 120000 });
  await page.evaluate(() => window.envlab.redraw(1.5));
  const tag = `${subject.replace(':', '_')}_${weather}`;
  const data = await page.evaluate(() => window.envlab.exportPng());
  fs.writeFileSync(path.join(out, `sheet_${tag}.png`), Buffer.from(data.split(',')[1], 'base64'));
  const stats = await page.evaluate(() => window.envlab.stats());
  console.log(JSON.stringify(stats.map((s) => `${s.title} paint=${s.paintMs.toFixed(0)}ms frame=${s.frameMs.toFixed(1)}ms micro=${s.micro}`), null, 1));
  console.log(errors.length ? errors.join('\n') : 'NO CONSOLE ERRORS');
  await browser.close();
})();
