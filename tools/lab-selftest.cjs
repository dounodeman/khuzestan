// Sprite Lab compare self-test (needs `npm run dev`; uses the pre-installed Playwright).
// Builds a synthetic "reference" from the sprite's own hull+turret silhouette, shifted by a known amount,
// and checks that IoU, outline distance and part errors come out as expected. No real reference is used.
// usage: node tools/lab-selftest.cjs [vehicle_id] [outPrefix]
const { chromium } = require('playwright');
(async () => {
  const id = process.argv[2] || 'iq_t55';
  const out = process.argv[3];
  const base = process.env.URL || 'http://localhost:5173';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/lab?v=${id}&ppm=75&thumbs=0&bbox=0`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__labReady === true);
  const runs = [];
  for (const shiftCm of [0, 5, 12]) {
    const r = await page.evaluate(async (shift) => {
      const lab = window.lab;
      const PX = 50; // reference image px per metre
      const anchors = lab.anchors();
      lab.setRef({ show: false, showMask: false }); // keep any earlier reference out of the capture
      // Silhouette image from the lab's own 64-px machinery is too coarse; draw at PX px/m via a view export.
      lab.set({ ppm: PX, heading: 0, turret: 0, recoil: 0, panX: 0, panY: 0, sil: true, grid: false, bbox: false, weak: false,
        layers: { running: true, hull: true, hullDetail: true, turret: true, turretDetail: true, barrel: false, markings: false, damage: false, rotor: false } });
      const viewUrl = lab.view();
      const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = viewUrl; });
      // Turn the black silhouette on the lab background into a transparent-background mask/reference image.
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) { const dark = d.data[i] < 40 && d.data[i + 1] < 40 && d.data[i + 2] < 40; d.data[i] = d.data[i + 1] = d.data[i + 2] = dark ? 20 : 255; d.data[i + 3] = dark ? 255 : 0; }
      ctx.putImageData(d, 0, 0);
      const url = c.toDataURL('image/png');
      const dpr = window.devicePixelRatio || 1;
      const mPerPx = 1 / (PX * dpr);
      lab.set({ sil: false, layers: { running: true, hull: true, hullDetail: true, turret: true, turretDetail: true, barrel: true, markings: true, damage: true, rotor: true } });
      await lab.loadRefData(url, 'synthetic-selftest.png');
      // The view's centre is world (0,0); shift the reference by `shift` cm along +x.
      const ox = shift / 100;
      lab.setRef({ mPerPx, rot: 0, ox, oy: 0, calibratedTo: 'synthetic: view scale', show: true, showMask: true });
      await lab.setMaskData(url, true);
      // Marks at the true anchor positions (image px), so the reported part error must equal the shift.
      const w = img.width, h = img.height, marks = {};
      for (const a of anchors) marks[a.id] = [a.at[0] / mPerPx + w / 2, a.at[1] / mPerPx + h / 2];
      lab.setMarks(marks);
      const res = lab.compare();
      const partErr = res.parts.map((p) => p.errCm);
      return { shift, iou: res.iou, meanCm: res.meanCm, maxCm: res.maxCm, partMin: Math.min(...partErr), partMax: Math.max(...partErr), n: partErr.length, failures: res.failures };
    }, shiftCm);
    runs.push(r);
    if (out) await page.screenshot({ path: `${out}_shift${shiftCm}.png` });
  }
  // Side view: marks placed so the turret pivot sits 4 cm further from the hull front than the sprite says.
  const side = await page.evaluate(async () => {
    const lab = window.lab;
    const c = document.createElement('canvas'); c.width = 1000; c.height = 400;
    await lab.loadRefData(c.toDataURL('image/png'), 'side-selftest.png');
    lab.setRef({ mPerPx: 0.01, rot: 0, ox: 0, oy: 0 });
    const a = Object.fromEntries(lab.anchors().map((x) => [x.id, x.at]));
    const px = (x, y) => [x / 0.01 + 500, y / 0.01 + 200];
    lab.setMarks({ hull_front: px(a.hull_front[0], 0), turret_pivot: px(a.turret_pivot[0] - 0.04, 0), ground: px(0, 1.2), turret_top: px(0, -1.15) });
    const r = lab.compareSide();
    return { pivot: r.parts.find((p) => p.id === 'turret_pivot')?.errCm, height: r.heightM };
  });
  const sideOk = Math.abs(side.pivot - 4) < 0.01 && Math.abs(side.height - 2.35) < 0.001;
  console.log(`${sideOk ? 'PASS' : 'FAIL'} side view: turret pivot error ${side.pivot?.toFixed(2)} cm (expected 4.00), height ${side.height?.toFixed(3)} m (expected 2.350)`);
  let ok = sideOk;
  for (const r of runs) {
    const partOk = Math.abs(r.partMin - r.shift) < 0.6 && Math.abs(r.partMax - r.shift) < 0.6;
    const outlineOk = r.maxCm <= r.shift + 2.5 && (r.shift === 0 ? r.maxCm <= 2.5 : r.maxCm >= r.shift - 2.5);
    const iouOk = r.shift === 0 ? r.iou > 0.98 : r.iou < 1;
    const pass = partOk && outlineOk && iouOk;
    ok = ok && pass;
    console.log(`${pass ? 'PASS' : 'FAIL'} shift ${r.shift} cm: IoU ${r.iou.toFixed(4)}, outline mean ${r.meanCm.toFixed(1)} / max ${r.maxCm.toFixed(1)} cm, ` +
      `part error ${r.partMin.toFixed(2)}..${r.partMax.toFixed(2)} cm over ${r.n} parts; thresholds: ${r.failures.length ? r.failures.slice(0, 3).join('; ') + (r.failures.length > 3 ? ` (+${r.failures.length - 3} more)` : '') : 'all pass'}`);
  }
  if (errors.length) { ok = false; console.log(errors.join('\n')); }
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
