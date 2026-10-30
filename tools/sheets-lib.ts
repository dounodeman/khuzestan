/** Node-side helpers for vehicle sheets: loading, the generated markdown, and the validator's checks. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Conf, Outline, SheetPart, Tagged, VehicleSheet } from '../src/sheets/schema';
import { distToPolygon, loop, pointInPolygon, polygonsOf, samplePolygon, selfIntersections } from '../src/sheets/outline';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SHEET_DIR = path.join(ROOT, 'data/vehicle_sheets');
export const DOC_PATH = path.join(ROOT, 'docs/vehicle_sheets.md');
export const REFS_DIR = path.join(ROOT, 'refs');

export function loadSheets(): VehicleSheet[] {
  return fs.readdirSync(SHEET_DIR).filter((f) => f.endsWith('.json')).sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(SHEET_DIR, f), 'utf8')) as VehicleSheet);
}

const CONFS: Conf[] = ['A', 'B', 'C', 'X'];
type P = [number, number];
const f2 = (n: number) => (Math.round(n * 1000) / 1000).toString();
const pt = (p: P) => `[${f2(p[0])}, ${f2(p[1])}]`;

// ---------------------------------------------------------------- markdown
export function renderDoc(sheets: VehicleSheet[]): string {
  const out: string[] = [
    '# Vehicle sheets (generated)',
    '',
    '<!-- GENERATED from data/vehicle_sheets/*.json by `npm run sheets-doc`. Do not edit by hand; edit the JSON. -->',
    '',
    'Measured top-view geometry for every vehicle sprite. Units are metres; +x is the front, +y the vehicle\'s right,',
    'origin the hull centre. Turret parts are relative to the turret pivot.',
    '',
    'Confidence: **A** calibrated plan view agreeing with a published spec within 3%; **B** calibrated plan view or clean',
    'side view, no second source; **C** estimated from perspective photos, the old approximate sheet, or a spec number',
    'not yet checked on an image; **X** unknown (the source note says what would settle it).',
    '',
    `Vehicles with a measured sheet: ${sheets.map((s) => s.id).join(', ') || 'none'}. All other vehicles are still in the legacy draft,`,
    '`docs/vehicle_sheets_draft.md`. Reference sources and their license notes: `docs/reference_sources.md`.',
    '',
  ];
  for (const s of sheets) out.push(...renderSheet(s));
  return out.join('\n') + '\n';
}

function confCounts(s: VehicleSheet): Record<Conf, number> {
  const c: Record<Conf, number> = { A: 0, B: 0, C: 0, X: 0 };
  walkTags(s, (conf) => { c[conf]++; });
  return c;
}

function renderSheet(s: VehicleSheet): string[] {
  const o: string[] = [];
  const c = confCounts(s);
  o.push(`## ${s.name} (\`${s.id}\`)`, '', `- Variant: ${s.variant}`, `- Status: ${s.status}`,
    `- Confidence tags: A ${c.A}, B ${c.B}, C ${c.C}, X ${c.X}`, '');
  o.push('### References', '');
  if (!s.references.length) o.push('None measured yet.', '');
  else {
    o.push('| File | View | Perspective | Calibrated to | Source |', '|---|---|---|---|---|');
    for (const r of s.references) o.push(`| ${r.file} | ${r.view}${r.detail_of ? ` (${r.detail_of})` : ''} | ${r.perspective ? 'yes' : 'no'} | ${r.calibrated_to ?? '–'} | ${r.src} |`);
    o.push('');
  }
  o.push('### Dimensions', '', '| Dimension | Value | Conf | Source | Other sources | Reason |', '|---|---|---|---|---|---|');
  for (const [k, d] of Object.entries(s.dimensions)) {
    const alt = (d.alt ?? []).map((a) => `${a.value} (${a.src})`).join('; ') || '–';
    o.push(`| ${k} | ${d.value} | ${d.conf} | ${d.src} | ${alt} | ${d.reason ?? '–'} |`);
  }
  o.push('', '### Outlines', '');
  for (const [id, ol] of Object.entries(s.outlines)) {
    o.push(`- **${id}** (${ol.role}, ${ol.frame} frame, ${ol.mirror}): ${ol.points.map(([x, y, t]) => `${pt([x, y])}${t.conf}${t.smooth ? '~' : ''}`).join(' ')}`, `  - source: ${ol.src}`);
  }
  o.push('', '`~` marks a smooth (curved) point.', '');
  if (s.turret) o.push('### Turret', '', `- Pivot ${pt(s.turret.pivot)}${s.turret.ring_dia ? `, ring ${s.turret.ring_dia}` : ''} (${s.turret.conf}): ${s.turret.src}`, '');
  if (s.gun) {
    const g = s.gun;
    o.push('### Gun', '', `- ${g.calibre_mm} mm, barrel x ${g.from_x} to muzzle ${g.muzzle_x} (turret frame), diameter ${g.dia}, recoil ${g.recoil} (${g.conf}): ${g.src}`);
    for (const fi of g.fittings) o.push(`- ${fi.kind}: front end x ${fi.x}, length ${fi.len}, diameter ${fi.dia} (${fi.conf}): ${fi.src}`);
    o.push('');
  }
  o.push('### Running gear', '');
  const rg = s.running_gear;
  if (rg.tracks) o.push(`- Tracks: x ${rg.tracks.x_from} to ${rg.tracks.x_to}, centre y ±${rg.tracks.y_centre}, width ${rg.tracks.width}, link pitch ${rg.tracks.link_pitch} (${rg.tracks.conf}): ${rg.tracks.src}`);
  if (rg.road_wheels) {
    const w = rg.road_wheels;
    const gaps = w.x.slice(1).map((x, i) => f2(w.x[i] - x)).join(', ');
    o.push(`- Road wheels: x ${w.x.join(', ')} (gaps ${gaps}), centre y ±${w.y_centre}, diameter ${w.dia}, width ${w.width} (${w.conf}): ${w.src}`);
  }
  if (rg.axles) o.push(`- Axles: x ${rg.axles.x.join(', ')}, centre y ±${rg.axles.y_centre}, tyre ${rg.axles.tyre_dia} × ${rg.axles.tyre_width} (${rg.axles.conf}): ${rg.axles.src}`);
  o.push('', '### Parts', '', '| Part | Kind | Frame | Geometry | Conf | Source |', '|---|---|---|---|---|---|');
  for (const p of s.parts) o.push(`| ${p.id} | ${p.kind} | ${p.frame} | ${partGeom(p)} | ${p.conf} | ${p.src} |`);
  o.push('', '### Hooks', '');
  for (const [k, h] of Object.entries(s.hooks)) if (h) o.push(`- ${k}: ${h.value.map((p) => pt(p as P)).join(' ')} (${h.conf}): ${h.src}`);
  o.push('', '### Excluded details (post-1980 or unconfirmed for 1980)', '');
  o.push(...(s.excluded_details.length ? s.excluded_details.map((e) => `- ${e}`) : ['- none recorded']));
  o.push('', '### Open questions', '');
  o.push(...(s.open_questions.length ? s.open_questions.map((e) => `- ${e}`) : ['- none']));
  if (s.notes?.length) o.push('', '### Notes', '', ...s.notes.map((n) => `- ${n}`));
  o.push('');
  return o;
}

function partGeom(p: SheetPart): string {
  const bits: string[] = [];
  if (p.pos) bits.push(`pos ${pt(p.pos)}`);
  if (p.r !== undefined) bits.push(`r ${p.r}`);
  if (p.size) bits.push(`size ${p.size[0]} × ${p.size[1]}`);
  if (p.rot) bits.push(`rot ${p.rot}°`);
  if (p.points) bits.push(`points ${p.points.map(pt).join(' ')}`);
  if (p.repeat) bits.push('at' in p.repeat ? `copies at ${p.repeat.at.map(pt).join(' ')}` : `${p.repeat.count} × step ${pt(p.repeat.step)}`);
  if (p.mirror) bits.push('mirrored');
  return bits.join(', ');
}

// ---------------------------------------------------------------- validation
export interface Issue { level: 'error' | 'warn'; vehicle: string; msg: string }

/** Visit every confidence tag in a sheet. */
function walkTags(s: VehicleSheet, visit: (c: Conf) => void) {
  const fn = (c: Conf | undefined) => { if (c && CONFS.includes(c)) visit(c); };
  for (const d of Object.values(s.dimensions)) fn(d.conf);
  for (const ol of Object.values(s.outlines)) for (const p of ol.points) fn(p[2]?.conf);
  if (s.turret) fn(s.turret.conf);
  if (s.gun) { fn(s.gun.conf); for (const f of s.gun.fittings) fn(f.conf); }
  for (const g of Object.values(s.running_gear)) if (g) fn(g.conf);
  for (const p of s.parts) fn(p.conf);
  for (const h of Object.values(s.hooks)) if (h) fn(h.conf);
}

const META_KEYS = new Set(['id', 'name', 'variant', 'status', 'kind', 'units', 'axes', 'excluded_details', 'open_questions', 'notes', 'paint']);

/** Any number (or number array) must sit under an object carrying conf + src, or be an outline point with its own tag. */
function checkTags(s: VehicleSheet, issues: Issue[]) {
  const bad = (msg: string) => issues.push({ level: 'error', vehicle: s.id, msg });
  const isTag = (o: Record<string, unknown>) => typeof o.conf === 'string' && typeof o.src === 'string' && (o.src as string).trim() !== '';
  const walk = (v: unknown, at: string, tagged: boolean) => {
    if (typeof v === 'number') { if (!tagged) bad(`${at}: number without a conf tag and src`); return; }
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${at}[${i}]`, tagged)); return; }
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if ('conf' in o && !CONFS.includes(o.conf as Conf)) bad(`${at}: conf "${String(o.conf)}" is not A, B, C or X`);
      const here = tagged || isTag(o);
      for (const [k, x] of Object.entries(o)) walk(x, `${at}.${k}`, here || (k === 'alt'));
    }
  };
  for (const [k, v] of Object.entries(s)) {
    if (META_KEYS.has(k)) continue;
    if (k === 'references') {
      s.references.forEach((r, i) => { if (!r.src?.trim()) bad(`references[${i}] (${r.file}): missing src`); });
      continue;
    }
    if (k === 'outlines') {
      for (const [id, ol] of Object.entries(s.outlines)) {
        if (!ol.src?.trim()) bad(`outlines.${id}: missing src`);
        ol.points.forEach((p, i) => { if (!p[2] || !CONFS.includes(p[2].conf)) bad(`outlines.${id}.points[${i}]: missing or invalid conf tag`); });
      }
      continue;
    }
    if (k === 'dimensions') {
      for (const [id, d] of Object.entries(s.dimensions)) {
        if (!isTag(d as unknown as Record<string, unknown>)) bad(`dimensions.${id}: missing conf or src`);
        if (!CONFS.includes(d.conf)) bad(`dimensions.${id}: conf "${d.conf}" invalid`);
        (d.alt ?? []).forEach((a, i) => { if (!a.src?.trim()) bad(`dimensions.${id}.alt[${i}]: missing src`); });
      }
      continue;
    }
    if (k === 'parts') {
      s.parts.forEach((p) => { if (!isTag(p as unknown as Record<string, unknown>)) bad(`parts.${p.id}: missing conf or src`); walk(p, `parts.${p.id}`, true); });
      continue;
    }
    walk(v, k, false);
  }
}

function partPoints(p: SheetPart): P[] {
  const [x, y] = p.pos ?? [0, 0];
  let pts: P[] = [];
  if (p.shape === 'circle') for (let i = 0; i < 16; i++) pts.push([x + (p.r ?? 0) * Math.cos((i / 16) * 2 * Math.PI), y + (p.r ?? 0) * Math.sin((i / 16) * 2 * Math.PI)]);
  else if (p.shape === 'rect' || p.shape === 'ellipse') {
    const [w, h] = p.size ?? [0, 0];
    const a = ((p.rot ?? 0) * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
    const local: P[] = p.shape === 'rect' ? [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
      : Array.from({ length: 16 }, (_, i) => [(w / 2) * Math.cos((i / 16) * 2 * Math.PI), (h / 2) * Math.sin((i / 16) * 2 * Math.PI)] as P);
    pts = local.map(([u, v]) => [x + u * c - v * sn, y + u * sn + v * c]);
  } else pts = (p.points ?? []).map((q) => [q[0], q[1]]);
  let copies: P[] = [[0, 0]];
  const rep = p.repeat;
  if (rep) copies = 'at' in rep ? rep.at : Array.from({ length: rep.count }, (_, i) => [rep.step[0] * i, rep.step[1] * i] as P);
  const all = copies.flatMap(([dx, dy]) => pts.map(([px, py]) => [px + dx, py + dy] as P));
  return p.mirror ? [...all, ...all.map(([px, py]) => [px, -py] as P)] : all;
}

function extent(polys: P[][]) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const poly of polys) for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, x1, y0, y1 };
}

const pct = (a: number, b: number) => (Math.abs(a - b) / b) * 100;

export function validate(s: VehicleSheet, refsPresent: string[] | null): Issue[] {
  const issues: Issue[] = [];
  const err = (msg: string) => issues.push({ level: 'error', vehicle: s.id, msg });
  const warn = (msg: string) => issues.push({ level: 'warn', vehicle: s.id, msg });
  checkTags(s, issues);

  // Outlines: closed, simple, symmetric.
  const polys: Record<string, P[][]> = {};
  for (const [id, ol] of Object.entries(s.outlines)) {
    if (ol.points.length < 3) { err(`outline ${id}: fewer than 3 points, not a closed shape`); continue; }
    if (ol.mirror === 'half') {
      const a = ol.points[0], b = ol.points[ol.points.length - 1];
      if (Math.abs(a[1]) > 1e-6 || Math.abs(b[1]) > 1e-6) err(`outline ${id}: half outline must start and end on the centreline (y = 0) to close`);
      if (ol.points.some((p) => p[1] < -1e-6)) err(`outline ${id}: half outline has points with y < 0 (it must be the right half)`);
    }
    const poly = samplePolygon(loop(ol));
    const x = selfIntersections(poly);
    if (x.length) err(`outline ${id}: self-intersecting (${x.length} crossing edge pair${x.length > 1 ? 's' : ''})`);
    if (ol.mirror === 'full' && !ol.asymmetric_reason) {
      const worst = Math.max(...poly.map(([px, py]) => distToPolygon([px, -py], poly)));
      if (worst > 0.02) err(`outline ${id}: not symmetric (mirror error up to ${(worst * 100).toFixed(1)} cm); add asymmetric_reason if the real part is asymmetric`);
    }
    polys[id] = polygonsOf(ol);
  }

  // Parts inside their declared outline; off-centre parts need a reason.
  for (const p of s.parts) {
    const pts = partPoints(p);
    if (p.inside) {
      const ol: Outline | undefined = s.outlines[p.inside];
      if (!ol) err(`part ${p.id}: inside "${p.inside}" names no outline`);
      else if ((ol.frame === 'turret') !== (p.frame === 'turret')) err(`part ${p.id}: frame ${p.frame} differs from outline ${p.inside} frame ${ol.frame}`);
      else {
        const out = pts.filter((q) => !polys[p.inside!].some((poly) => pointInPolygon(q, poly) || distToPolygon(q, poly) <= 0.01));
        if (out.length) err(`part ${p.id}: ${out.length} of ${pts.length} sample points fall outside outline ${p.inside} (e.g. ${pt(out[0])})`);
      }
    } else if (['hatch', 'cupola', 'periscope', 'ventilator', 'grille', 'louvre'].includes(p.kind)) {
      warn(`part ${p.id}: no "inside" outline declared, containment not checked`);
    }
    const cy = pts.reduce((a, q) => a + q[1], 0) / Math.max(1, pts.length);
    if (!p.mirror && Math.abs(cy) > 0.02 && !p.offset_reason) err(`part ${p.id}: off the centreline (y ${cy.toFixed(2)}) and not mirrored; add offset_reason if that is real`);
  }

  // Hull length and width from the geometry against the stated real dimensions.
  const hullPolys: P[][] = [];
  for (const [id, ol] of Object.entries(s.outlines)) if (ol.frame === 'hull' && ['hull', 'fender', 'skirt'].includes(ol.role) && polys[id]) hullPolys.push(...polys[id]);
  const t = s.running_gear.tracks;
  if (t) for (const sgn of [1, -1]) hullPolys.push([[t.x_from, sgn * (t.y_centre - t.width / 2)], [t.x_to, sgn * (t.y_centre + t.width / 2)]]);
  const a = s.running_gear.axles;
  if (a) for (const sgn of [1, -1]) hullPolys.push(a.x.flatMap((x) => [[x - a.tyre_dia / 2, sgn * (a.y_centre - a.tyre_width / 2)], [x + a.tyre_dia / 2, sgn * (a.y_centre + a.tyre_width / 2)]] as P[]));
  const e = extent(hullPolys);
  const measured: Record<string, number> = { hull_len: e.x1 - e.x0, width: e.y1 - e.y0 };
  for (const k of ['hull_len', 'width']) {
    const d = s.dimensions[k];
    if (!d) { err(`dimensions.${k} missing`); continue; }
    if (!isFinite(measured[k])) { err(`${k}: no hull geometry to measure`); continue; }
    const dp = pct(measured[k], d.value);
    if (dp > 3) err(`${k}: geometry measures ${measured[k].toFixed(3)} m, stated ${d.value} m (${dp.toFixed(1)}% off, limit 3%)`);
  }
  if (s.gun && s.turret && s.dimensions.overall_len) {
    const turretPolys = Object.entries(s.outlines).filter(([, ol]) => ol.frame === 'turret').flatMap(([id]) => polys[id] ?? []);
    const tx = turretPolys.flat().map((q) => q[0] + s.turret!.pivot[0]);
    const overall = Math.max(s.turret.pivot[0] + s.gun.muzzle_x, e.x1, ...tx) - Math.min(e.x0, ...tx);
    const dp = pct(overall, s.dimensions.overall_len.value);
    if (dp > 3) warn(`overall_len: geometry measures ${overall.toFixed(3)} m, stated ${s.dimensions.overall_len.value} m (${dp.toFixed(1)}% off)`);
  }

  // Confidence A needs a calibrated plan view.
  const calibratedTop = s.references.some((r) => r.view === 'top' && !r.perspective && r.calibrated_to);
  let hasA = false; walkTags(s, (c) => { if (c === 'A') hasA = true; });
  if (hasA && !calibratedTop) err('conf A used but no calibrated, non-perspective top view is listed in references');

  // Later modifications visible but nothing excluded.
  if (s.references.some((r) => r.later_mods_visible) && !s.excluded_details.length) warn('a reference shows later modifications but excluded_details is empty');

  // Reference intake.
  const views = new Set(s.references.map((r) => r.view));
  const need = ['top', 'side', 'rear'];
  const missing = need.filter((v) => !views.has(v as never) && !(v === 'rear' && s.references.some((r) => r.view === 'detail' && /deck/i.test(r.detail_of ?? ''))));
  if (missing.length) warn(`references missing required views: ${missing.join(', ')} (rear may be an engine-deck detail)`);
  if (refsPresent) for (const r of s.references) if (!refsPresent.includes(r.file)) warn(`reference ${r.file} is listed but not in refs/${s.id}/ on this machine`);
  return issues;
}

export function confSummary(s: VehicleSheet) { return confCounts(s); }
export type { Tagged };
