// npm run vehicle-report -- <vehicle_id>: runs the Sprite Lab headless (needs `npm run dev`), collects the saved
// compare results and the 64 px confusability check, saves screenshots to refs/<id>/report/ (git-ignored),
// then writes docs/vehicle_reports/<id>.md via tools/sheet-report.ts. Uses the pre-installed Playwright.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
(async () => {
  const id = process.argv[2];
  if (!id) { console.error('usage: npm run vehicle-report -- <vehicle_id>'); process.exit(1); }
  const base = process.env.URL || 'http://localhost:5173';
  const root = path.resolve(__dirname, '..');
  const dir = path.join(root, 'refs', id), outDir = path.join(dir, 'report');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  await page.goto(`${base}/lab?v=${id}&ppm=75`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__labReady === true);
  const save = (name, url) => fs.writeFileSync(path.join(outDir, name), Buffer.from(url.split(',')[1], 'base64'));
  save('view.png', await page.evaluate(() => window.lab.view()));
  await page.evaluate(() => window.lab.set({ weak: true }));
  save('view_weak_markers.png', await page.evaluate(() => window.lab.view()));
  for (const [size, sil] of [[64, false], [64, true], [32, false], [32, true]]) save(`thumb${size}${sil ? '_sil' : ''}.png`, await page.evaluate(([s, k]) => window.lab.thumb(s, k), [size, sil]));
  save('contact_sheet.png', await page.evaluate(() => window.lab.contactSheet()));
  const confusable = await page.evaluate(() => window.lab.confusable(64));
  await browser.close();
  const compare = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.compare.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) : [];
  const labJson = path.join(outDir, 'lab-results.json');
  fs.writeFileSync(labJson, JSON.stringify({ id, confusable, compare }, null, 1));
  execFileSync('npx', ['tsx', path.join(root, 'tools/sheet-report.ts'), id, labJson], { stdio: 'inherit', cwd: root });
  console.log(`screenshots in ${outDir}`);
})();
