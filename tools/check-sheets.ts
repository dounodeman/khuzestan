// Vehicle sheet validator: npm run check-sheets. Exits 1 on any error; warnings are reported but pass.
import fs from 'node:fs';
import path from 'node:path';
import { DOC_PATH, REFS_DIR, confSummary, loadSheets, renderDoc, validate, type Issue } from './sheets-lib';

const sheets = loadSheets();
const issues: Issue[] = [];
for (const s of sheets) {
  const dir = path.join(REFS_DIR, s.id);
  const present = fs.existsSync(dir) ? fs.readdirSync(dir) : null;
  issues.push(...validate(s, present));
}
const doc = renderDoc(sheets);
if (!fs.existsSync(DOC_PATH) || fs.readFileSync(DOC_PATH, 'utf8') !== doc) {
  issues.push({ level: 'error', vehicle: '*', msg: 'docs/vehicle_sheets.md is out of date with data/vehicle_sheets/*.json; run npm run sheets-doc' });
}

const lines: string[] = [];
for (const s of sheets) {
  const c = confSummary(s);
  const mine = issues.filter((i) => i.vehicle === s.id);
  const e = mine.filter((i) => i.level === 'error').length, w = mine.length - e;
  lines.push(`${s.id} (${s.status}): ${e ? `FAIL ${e} error${e > 1 ? 's' : ''}` : 'PASS'}, ${w} warning${w === 1 ? '' : 's'}; conf A ${c.A} B ${c.B} C ${c.C} X ${c.X}`);
  for (const i of mine) lines.push(`  ${i.level === 'error' ? 'ERROR' : 'warn '} ${i.msg}`);
}
for (const i of issues.filter((x) => x.vehicle === '*')) lines.push(`${i.level === 'error' ? 'ERROR' : 'warn '} ${i.msg}`);
const errors = issues.filter((i) => i.level === 'error').length;
lines.push(`check-sheets: ${sheets.length} sheet${sheets.length === 1 ? '' : 's'}, ${errors} error${errors === 1 ? '' : 's'}, ${issues.length - errors} warning${issues.length - errors === 1 ? '' : 's'}`);
console.log(lines.join('\n'));
process.exit(errors ? 1 : 0);
