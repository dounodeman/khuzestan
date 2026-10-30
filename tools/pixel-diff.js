// Pixel diff of two renders (Playwright screenshots, lab exports): `npm run pixel-diff -- a.png b.png [diff.png]`.
// Prints the number and share of differing pixels and writes a diff image when a third path is given.
// Dev only (pixelmatch and pngjs are devDependencies); never imported by the game.
import fs from 'node:fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const args = process.argv.slice(2);
const ti = args.indexOf('--threshold');
const threshold = ti >= 0 ? Number(args.splice(ti, 2)[1]) : 0.1;
const [a, b, out] = args;
if (!a || !b) {
  console.error('usage: npm run pixel-diff -- a.png b.png [diff.png] [--threshold 0.1]');
  process.exit(2);
}
const A = PNG.sync.read(fs.readFileSync(a));
const B = PNG.sync.read(fs.readFileSync(b));
if (A.width !== B.width || A.height !== B.height) {
  console.error(`size differs: ${A.width}x${A.height} vs ${B.width}x${B.height}`);
  process.exit(1);
}
const diff = new PNG({ width: A.width, height: A.height });
const n = pixelmatch(A.data, B.data, diff.data, A.width, A.height, { threshold });
if (out) fs.writeFileSync(out, PNG.sync.write(diff));
console.log(`${n} differing pixels (${((100 * n) / (A.width * A.height)).toFixed(3)}%)${out ? `, diff written to ${out}` : ''}`);
