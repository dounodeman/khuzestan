// Validator self-test: npm run check-sheets:selftest. Breaks a copy of each real sheet in known ways and checks the
// validator reports exactly that problem; also checks the top/side cross-check on synthetic lab marks.
import { crossCheck, loadSheets, validate, type PointsFile } from './sheets-lib';
import type { VehicleSheet } from '../src/sheets/schema';

type Mut = (s: VehicleSheet & Record<string, any>) => void;
const cases: Array<[string, Mut, RegExp, 'error' | 'warn']> = [
  ['missing conf', (s) => { delete (s.parts[0] as any).conf; }, /missing conf or src/, 'error'],
  ['empty src', (s) => { const k = Object.keys(s.dimensions)[0]; s.dimensions[k].src = ''; }, /missing conf or src/, 'error'],
  ['untagged outline point', (s) => { const o = Object.values(s.outlines)[0]; (o.points as any)[1] = [o.points[1][0], o.points[1][1]]; }, /missing or invalid conf tag/, 'error'],
  ['invalid conf letter', (s) => { (s.parts[0] as any).conf = 'D'; }, /is not A, B, C or X/, 'error'],
  ['half outline not closed', (s) => { const o = Object.values(s.outlines).find((x) => x.mirror === 'half')!; o.points.pop(); }, /start and end on the centreline/, 'error'],
  ['self-intersection (bow tie)', (s) => { s.outlines.bowtie = { frame: 'hull', mirror: 'full', role: 'deck', src: 'test', points: [[-1, -1, { conf: 'C' }], [1, 1, { conf: 'C' }], [1, -1, { conf: 'C' }], [-1, 1, { conf: 'C' }]] }; }, /bowtie: self-intersecting/, 'error'],
  ['asymmetric full outline', (s) => { const o = Object.values(s.outlines).find((x) => x.mirror === 'full')!; o.points[0] = [o.points[0][0], o.points[0][1] + 0.4, o.points[0][2]]; }, /not symmetric/, 'error'],
  ['part outside its outline', (s) => { const p = s.parts.find((x) => x.inside && x.pos)!; p.pos = [p.pos![0] + 20, p.pos![1]]; }, /fall outside outline/, 'error'],
  ['off-centre part without reason', (s) => { const p = s.parts.find((x) => x.offset_reason)!; delete p.offset_reason; }, /off the centreline/, 'error'],
  ['hull length off', (s) => { s.dimensions.hull_len.value *= 1.2; }, /hull_len: geometry measures/, 'error'],
  ['width off', (s) => { s.dimensions.width.value *= 1.2; }, /width: geometry measures/, 'error'],
  ['conf A without plan view', (s) => { s.parts[0].conf = 'A'; }, /conf A used but no calibrated/, 'error'],
  ['perspective value tagged B', (s) => { s.references = [{ file: 'side-photo.jpg', view: 'side', perspective: true, src: 'x', license: 'CC BY' }]; s.parts[0].conf = 'B'; s.parts[0].src = 'side-photo.jpg ratio'; }, /perspective values are conf C/, 'error'],
  ['reference without license', (s) => { s.references = [{ file: 'top.png', view: 'top', perspective: false, src: 'x', license: '' }]; }, /missing license/, 'error'],
  ['later mods, nothing excluded', (s) => { s.references = [{ file: 'top.png', view: 'top', perspective: false, src: 'x', license: 'CC', later_mods_visible: true }]; s.excluded_details = []; }, /later modifications but excluded_details is empty/, 'warn'],
  ['inventory says drawn, part missing', (s) => { const d = s.detail_inventory.find((x) => x.status === 'drawn' && s.parts.some((p) => p.id === (x.part ?? x.id)))!; s.parts = s.parts.filter((p) => p.id !== (d.part ?? d.id)); }, /marked drawn but no part/, 'error'],
  ['excluded detail still drawn', (s) => { const d = s.detail_inventory.find((x) => x.status === 'drawn' && s.parts.some((p) => p.id === (x.part ?? x.id)))!; d.status = 'excluded'; }, /excluded but still drawn/, 'error'],
  ['empty inventory', (s) => { s.detail_inventory = []; }, /detail_inventory is empty/, 'error'],
  ['helicopter without rotors', (s) => { s.kind = 'heli'; delete s.rotor; delete s.tail_rotor; delete s.rotor2; }, /without a main rotor/, 'error'],
];

let fails = 0;
for (const base of loadSheets()) {
  const clean = validate(base, null).map((i) => i.msg);
  for (const [name, mut, expect, level] of cases) {
    const s = JSON.parse(JSON.stringify(base));
    try { mut(s); } catch { console.log(`skip  ${base.id}: ${name} (sheet lacks the needed data)`); continue; }
    const got = validate(s, null).filter((i) => i.level === level && !clean.includes(i.msg));
    const ok = got.some((i) => expect.test(i.msg));
    if (!ok) fails++;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${base.id}: ${name}${ok ? '' : ` (got: ${got.map((i) => i.msg).join(' | ') || 'nothing new'})`}`);
  }
  // Cross-check: top and side marks that disagree by 5% on hull length must be flagged; 1% must not.
  const L = base.dimensions.hull_len?.value ?? 6;
  const pf = (view: string, len: number): PointsFile => ({ view, image: `${view}.png`, marks_px: {}, marks_m: { hull_front: [len / 2, 0], hull_rear: [-len / 2, 0], turret_pivot: [0.3, 0] } });
  const bad = crossCheck(base, [pf('top', L), pf('side', L * 1.05)]).some((i) => i.level === 'error' && /views disagree: hull length/.test(i.msg));
  const good = !crossCheck(base, [pf('top', L), pf('side', L * 1.01)]).some((i) => i.level === 'error');
  for (const [ok, name] of [[bad, 'top/side 5% disagreement flagged'], [good, 'top/side 1% difference accepted']] as const) { if (!ok) fails++; console.log(`${ok ? 'ok   ' : 'FAIL '} ${base.id}: ${name}`); }
}
console.log(fails ? `sheets-selftest: ${fails} FAILED` : 'sheets-selftest: all passed');
process.exit(fails ? 1 : 0);
