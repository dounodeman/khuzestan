// Reference intake: npm run refs-inventory. Lists what is in refs/<vehicle_id>/ for every vehicle in the game and
// which required views are missing. The view comes from the file name (top, side, rear, front, detail-<what>) or, for
// other names, from the vehicle sheet's references list. Only non-perspective images satisfy a required view.
import fs from 'node:fs';
import path from 'node:path';
import { UNITS } from '../src/data/units';
import { REFS_DIR, SHEET_DIR } from './sheets-lib';
import type { VehicleSheet } from '../src/sheets/schema';

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
  const sheetPath = path.join(SHEET_DIR, `${u.id}.json`);
  const refs = fs.existsSync(sheetPath) ? (JSON.parse(fs.readFileSync(sheetPath, 'utf8')) as VehicleSheet).references : [];
  const byView: Record<string, string[]> = {}; // true (non-perspective) views
  const photos: Record<string, string[]> = {}; // perspective photos, by view
  const unclear: string[] = [];
  for (const f of images) {
    const r = refs.find((x) => x.file === f);
    const v = viewOf(f) ?? r?.view;
    if (!v) unclear.push(f);
    else if (r?.perspective) (photos[v] ??= []).push(f);
    else (byView[v] ??= []).push(f);
  }
  const sk = u.sprite.kind;
  const kind = u.moveClass === 'air' ? (u.category === 'drone' ? 'drone' : 'heli')
    : u.moveClass === 'foot' ? 'towed' : sk === 'wheeled' || sk === 'jeep' ? 'wheeled' : 'tracked';
  const need = required(kind).filter((v) => v === 'rear or detail-engine-deck'
    ? !(byView.rear || images.some((f) => /^detail-.*(deck|engine)/i.test(f)) || refs.some((r) => !r.perspective && r.view === 'detail' && /deck|engine/i.test(r.detail_of ?? '')))
    : !byView[v]).map((v) => (photos[v.split(' ')[0]] ? `${v} (perspective photos only)` : v));
  if (kind === 'wheeled' && !byView.side && !images.some((f) => /^detail-.*axle/i.test(f))) need.push('axle positions (side or detail-axles)');
  const sheet = fs.existsSync(sheetPath) ? 'sheet' : 'no sheet';
  if (!need.length && !unclear.length) ready++;
  lines.push(`${u.id.padEnd(14)} ${u.name.padEnd(22)} ${sheet.padEnd(8)} ` +
    `${images.length ? `${images.length} images` : 'no images'}` +
    `${Object.keys(byView).length ? `\n${' '.repeat(15)}views: ${Object.entries(byView).map(([v, fs_]) => `${v}: ${fs_.join(', ')}`).join('; ')}` : ''}` +
    `${Object.keys(photos).length ? `\n${' '.repeat(15)}perspective photos: ${Object.entries(photos).map(([v, fs_]) => `${v} ${fs_.length}`).join(', ')}` : ''}` +
    `${need.length ? `\n${' '.repeat(15)}MISSING: ${need.join(', ')}` : ''}` +
    `${unclear.length ? `\n${' '.repeat(15)}UNCLASSIFIED (${unclear.length}; name the view or list them in the sheet): ${unclear.slice(0, 4).join(', ')}${unclear.length > 4 ? ', ...' : ''}` : ''}`);
}
console.log(lines.join('\n'));
console.log(`refs-inventory: ${vehicles.length} vehicles, ${ready} with every required view`);
