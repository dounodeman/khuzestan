// Reference intake: npm run refs-inventory. Lists what is in refs/<vehicle_id>/ for every vehicle in the game and
// which required views are missing. File names must say the view: top, side, rear, front, detail-<what>.
import fs from 'node:fs';
import path from 'node:path';
import { UNITS } from '../src/data/units';
import { REFS_DIR, SHEET_DIR } from './sheets-lib';

const SIDECAR = /\.(calib\.json|mask\.png|mask\.json|points\.json|compare\.json)$/;
const IMAGE = /\.(png|jpe?g|gif|webp|svg|tiff?)$/i;

export function viewOf(file: string): string | null {
  const base = file.toLowerCase();
  const m = base.match(/^(top|side|rear|front)(?=[-_. ]|\d|$)/) ?? base.match(/^(detail)-[a-z0-9]/);
  return m ? m[1] : null;
}

function required(kind: string): string[] {
  if (kind === 'heli' || kind === 'drone' || kind === 'towed') return ['top', 'side'];
  return ['top', 'side', 'rear or detail-engine-deck'];
}

const vehicles = Object.values(UNITS).filter((u) => u.category !== 'infantry');
const lines: string[] = [];
let ready = 0;
for (const u of vehicles) {
  const dir = path.join(REFS_DIR, u.id);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => !SIDECAR.test(f)) : [];
  const images = files.filter((f) => IMAGE.test(f));
  const byView: Record<string, string[]> = {};
  const unclear: string[] = [];
  for (const f of images) { const v = viewOf(f); if (v) (byView[v] ??= []).push(f); else unclear.push(f); }
  const sk = u.sprite.kind;
  const kind = u.moveClass === 'air' ? (u.category === 'drone' ? 'drone' : 'heli')
    : u.moveClass === 'foot' ? 'towed' : sk === 'wheeled' || sk === 'jeep' ? 'wheeled' : 'tracked';
  const need = required(kind).filter((v) => v === 'rear or detail-engine-deck'
    ? !(byView.rear || images.some((f) => /^detail-.*(deck|engine)/i.test(f)))
    : !byView[v]);
  if (kind === 'wheeled' && !byView.side && !images.some((f) => /^detail-.*axle/i.test(f))) need.push('axle positions (side or detail-axles)');
  const sheet = fs.existsSync(path.join(SHEET_DIR, `${u.id}.json`)) ? 'sheet' : 'no sheet';
  if (!need.length && !unclear.length) ready++;
  lines.push(`${u.id.padEnd(14)} ${u.name.padEnd(22)} ${sheet.padEnd(8)} ` +
    `${images.length ? Object.entries(byView).map(([v, fs_]) => `${v}: ${fs_.join(', ')}`).join('; ') : 'no images'}` +
    `${need.length ? `\n${' '.repeat(15)}MISSING: ${need.join(', ')}` : ''}` +
    `${unclear.length ? `\n${' '.repeat(15)}UNCLEAR NAMES (ask which view): ${unclear.join(', ')}` : ''}`);
}
console.log(lines.join('\n'));
console.log(`refs-inventory: ${vehicles.length} vehicles, ${ready} with every required view`);
