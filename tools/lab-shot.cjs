// Headless Sprite Lab capture (needs `npm run dev` running; uses the pre-installed Playwright, not a package dependency).
// usage: node tools/lab-shot.cjs <outPrefix> [query] [--contact] [--thumbs]
//   query: lab URL params, e.g. "v=iq_t55&ppm=90&turret=30&sil=1"
// Writes <outPrefix>_page.png (whole lab), <outPrefix>_view.png (canvas only), optional thumbs/contact sheet,
// and prints the spec report as JSON.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out = 'lab', query = ''] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
  const base = process.env.URL || 'http://localhost:5173';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  await page.goto(`${base}/lab?${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__labReady === true, null, { timeout: 15000 });
  await page.waitForTimeout(300);
  const save = (name, dataUrl) => fs.writeFileSync(name, Buffer.from(dataUrl.split(',')[1], 'base64'));
  await page.screenshot({ path: `${out}_page.png` });
  save(`${out}_view.png`, await page.evaluate(() => window.lab.view()));
  if (flags.has('--thumbs')) {
    for (const [size, sil] of [[64, false], [64, true], [32, false], [32, true]]) {
      save(`${out}_thumb${size}${sil ? '_sil' : ''}.png`, await page.evaluate(([s, k]) => window.lab.thumb(s, k), [size, sil]));
    }
  }
  if (flags.has('--contact')) save(`${out}_contact.png`, await page.evaluate(() => window.lab.contactSheet()));
  console.log(JSON.stringify(await page.evaluate(() => window.lab.report()), null, 1));
  console.log(errors.length ? errors.join('\n') : 'NO CONSOLE ERRORS');
  await browser.close();
})();
