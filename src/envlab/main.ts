/**
 * Environment Lab (dev only, /envlab.html): view any ground material or prop at every zoom level, lighting,
 * weather and destruction state, and export a contact sheet.
 * URL params: ?subject=prop:date_palm&weather=dust&seed=3&animate=0
 */
import './lab.css';
import { loadFonts } from '../ui/theme/fonts';
import { GROUNDS, DESERT_PLAIN } from '../data/environment/grounds';
import { PROPS } from '../data/environment/props';
import { LIGHTING, WEATHER, WIND_FROM_DEG } from '../data/environment/lighting';
import type { DestructionStateId, GroundMaterial, LightPreset, PropDef, WeatherPreset } from '../data/environment/types';
import { GroundPainter } from '../render/env/ground';
import { grade, windOf, type View } from '../render/env/light';
import { PropRenderer, makeProp, type PropInstance } from '../render/env/props';
import { hash2 } from '../render/env/noise';

interface Subject { id: string; label: string; ground: GroundMaterial; prop?: PropDef }
const SUBJECTS: Subject[] = [
  ...Object.values(GROUNDS).map((g) => ({ id: `ground:${g.id}`, label: `Ground · ${g.name}`, ground: g })),
  ...Object.values(PROPS).map((p) => ({ id: `prop:${p.id}`, label: `Prop · ${p.name}`, ground: DESERT_PLAIN, prop: p })),
];

/** Zoom levels in pixels per metre, matching Camera.zoom (game range 0.45 to 6). */
const ZOOMS = [
  { id: 'far', label: 'Far', zoom: 0.6 },
  { id: 'medium', label: 'Medium', zoom: 2 },
  { id: 'close', label: 'Close', zoom: 5 },
];
const PW = 380, PH = 250;
const CX = 1000, CY = 1000; // world point at the centre of every panel

const q = new URLSearchParams(location.search);
const state = {
  subject: SUBJECTS.find((s) => s.id === q.get('subject')) ?? SUBJECTS[0],
  weather: WEATHER.find((w) => w.id === q.get('weather')) ?? WEATHER[0],
  seed: Number(q.get('seed') ?? 1),
  animate: q.get('animate') !== '0',
  stripLight: LIGHTING.find((l) => l.id === q.get('light')) ?? LIGHTING[1],
};

interface Panel {
  canvas: HTMLCanvasElement;
  caption: HTMLElement;
  title: string;
  view: View;
  light: LightPreset;
  props: PropInstance[];
  ground: HTMLCanvasElement;
  paintMs: number;
  frameMs: number;
  micro: number;
}

const propRenderer = new PropRenderer();
let panels: Panel[] = [];
let painter = new GroundPainter(state.subject.ground, state.seed);

function viewFor(zoom: number, cx = CX, cy = CY): View {
  return { x0: cx - PW / zoom / 2, y0: cy - PH / zoom / 2, zoom, w: PW, h: PH };
}

/** A date-palm orchard in loose rows (§3: rows at about 8–10 m, verify) with a few gaps and stragglers. */
function orchard(def: PropDef, seed: number): PropInstance[] {
  const out: PropInstance[] = [];
  const sp = 9;
  let i = 0;
  for (let ry = -6; ry <= 6; ry++) {
    for (let rx = -9; rx <= 9; rx++) {
      i++;
      const r = hash2(rx, ry, seed);
      if (r < 0.08) continue;
      const x = CX + rx * sp + (hash2(rx, ry, seed + 1) - 0.5) * 1.6;
      const y = CY + ry * sp + (hash2(rx, ry, seed + 2) - 0.5) * 1.6;
      out.push(makeProp(def, x, y, seed * 1000 + i));
    }
  }
  // Stragglers outside the garden.
  for (let k = 0; k < 10; k++) {
    const a = hash2(k, 1, seed) * 6.283, d = 110 + hash2(k, 2, seed) * 120;
    out.push(makeProp(def, CX + Math.cos(a) * d, CY + Math.sin(a) * d * 0.7, seed * 1000 + 500 + k));
  }
  return out;
}

function makePanel(host: HTMLElement, title: string, view: View, light: LightPreset, props: PropInstance[]): Panel {
  const fig = document.createElement('figure');
  const canvas = document.createElement('canvas');
  canvas.width = view.w; canvas.height = view.h;
  const caption = document.createElement('figcaption');
  fig.append(canvas, caption);
  host.append(fig);
  const ground = document.createElement('canvas');
  ground.width = view.w; ground.height = view.h;
  const t0 = performance.now();
  painter.paint(ground.getContext('2d')!, view, light);
  return { canvas, caption, title, view, light, props, ground, paintMs: performance.now() - t0, frameMs: 0, micro: 0 };
}

function drawPanel(p: Panel, time: number, weather: WeatherPreset) {
  const t0 = performance.now();
  const ctx = p.canvas.getContext('2d')!;
  const wind = windOf(WIND_FROM_DEG, weather.windSpeed);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.drawImage(p.ground, 0, 0);
  p.micro = painter.drawMicro(ctx, p.view, p.light, time, wind, weather.shadowMul);
  if (p.props.length) {
    propRenderer.drawShadows(ctx, p.view, p.props, p.light, time, wind, weather.shadowMul);
    propRenderer.draw(ctx, p.view, p.props, p.light, time, wind);
  }
  grade(ctx, p.view, p.light, weather, time, wind);
  scaleBar(ctx, p.view);
  p.frameMs = performance.now() - t0;
  p.caption.textContent = `${p.title} · ${p.view.zoom} px/m · paint ${p.paintMs.toFixed(0)} ms · frame ${p.frameMs.toFixed(1)} ms · ${p.micro} details`;
}

function scaleBar(ctx: CanvasRenderingContext2D, view: View) {
  const metres = view.zoom < 1 ? 100 : view.zoom < 3 ? 20 : 10;
  const len = metres * view.zoom;
  const x = 10, y = view.h - 12;
  ctx.save();
  ctx.fillStyle = 'rgba(15,14,10,0.7)';
  ctx.fillRect(x - 4, y - 14, len + 44, 20);
  ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.lineTo(x + len, y - 4); ctx.stroke();
  ctx.fillStyle = '#e8e0c8'; ctx.font = '11px "Share Tech Mono", monospace';
  ctx.fillText(`${metres} m`, x + len + 6, y);
  ctx.restore();
}

function build() {
  const s = state.subject;
  painter = new GroundPainter(s.ground, state.seed);
  const grid = document.getElementById('grid')!;
  const strip = document.getElementById('strip')!;
  grid.innerHTML = '';
  strip.innerHTML = '';
  panels = [];
  const scene = s.prop ? orchard(s.prop, state.seed) : [];
  grid.style.gridTemplateColumns = `repeat(${LIGHTING.length}, ${PW}px)`;
  for (const z of ZOOMS) {
    for (const l of LIGHTING) panels.push(makePanel(grid, `${z.label} · ${l.name}`, viewFor(z.zoom), l, scene));
  }
  const stripTitle = document.getElementById('strip-title')!;
  if (s.prop) {
    stripTitle.textContent = `Destruction states · close · ${state.stripLight.name}`;
    const states = s.prop.progression;
    strip.style.gridTemplateColumns = `repeat(${states.length}, ${PW}px)`;
    states.forEach((id, i) => {
      // Three of the same state side by side to show per-instance variation.
      const props = [-14, 0, 14].map((dx, k) => makeProp(s.prop!, CX + dx, CY + (k === 1 ? -3 : 3), state.seed * 77 + i * 10 + k, id as DestructionStateId));
      panels.push(makePanel(strip, s.prop!.states[id]?.label ?? id, viewFor(6), state.stripLight, props));
    });
  } else {
    stripTitle.textContent = `Zoom ladder · ${state.stripLight.name}`;
    const ladder = [0.45, 1, 3, 6];
    strip.style.gridTemplateColumns = `repeat(${ladder.length}, ${PW}px)`;
    for (const z of ladder) panels.push(makePanel(strip, `Zoom ${z}`, viewFor(z), state.stripLight, []));
  }
  inspector();
  for (const p of panels) drawPanel(p, 0, state.weather);
}

function inspector() {
  const s = state.subject;
  const el = document.getElementById('inspector')!;
  const g = s.prop ? s.prop.gameplay : s.ground.gameplay;
  const rows: [string, string][] = [
    ['cover', g.cover], ['concealment', String(g.concealment)], ['line of sight', g.los],
    ['movement', g.move ? Object.entries(g.move).map(([k, v]) => `${k} ×${v}`).join(', ') : 'unchanged'],
  ];
  if (s.prop) {
    rows.push(['footprint', `${s.prop.footprint.w} × ${s.prop.footprint.h} m (${s.prop.footprint.shape})`], ['height', `${s.prop.height} m`], ['hit points', String(s.prop.hp)], ['states', s.prop.progression.join(' → ')]);
    for (const id of s.prop.progression) {
      const st = s.prop.states[id];
      if (st?.gameplay) rows.push([`  ${id}`, Object.entries(st.gameplay).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ')]);
    }
  } else {
    rows.push(['surfaces', s.ground.surfaces.map((x) => x.id).join(', ')], ['micro detail', s.ground.micro.map((m) => `${m.kind}${m.on ? ` on ${m.on}` : ''} ≥${m.lod.minZoom ?? 0}px/m`).join('; ')]);
  }
  el.innerHTML = `<h3>Gameplay data <small>(declared, not yet wired)</small></h3><table>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table>`;
}

function controls() {
  const bar = document.getElementById('controls')!;
  const sel = (label: string, opts: { id: string; name: string }[], cur: string, on: (id: string) => void) => {
    const l = document.createElement('label');
    l.textContent = label;
    const s = document.createElement('select');
    for (const o of opts) { const op = document.createElement('option'); op.value = o.id; op.textContent = o.name; s.append(op); }
    s.value = cur;
    s.onchange = () => on(s.value);
    l.append(s);
    bar.append(l);
  };
  sel('Subject', SUBJECTS.map((s) => ({ id: s.id, name: s.label })), state.subject.id, (id) => { state.subject = SUBJECTS.find((s) => s.id === id)!; build(); });
  sel('Weather', WEATHER, state.weather.id, (id) => { state.weather = WEATHER.find((w) => w.id === id)!; });
  sel('Strip light', LIGHTING, state.stripLight.id, (id) => { state.stripLight = LIGHTING.find((l) => l.id === id)!; build(); });
  const seed = document.createElement('label');
  seed.innerHTML = 'Seed <input type="number" min="1" value="' + state.seed + '">';
  seed.querySelector('input')!.onchange = (e) => { state.seed = Number((e.target as HTMLInputElement).value) || 1; build(); };
  bar.append(seed);
  const anim = document.createElement('label');
  anim.innerHTML = `<input type="checkbox" ${state.animate ? 'checked' : ''}> Wind animation`;
  anim.querySelector('input')!.onchange = (e) => { state.animate = (e.target as HTMLInputElement).checked; };
  bar.append(anim);
  const exp = document.createElement('button');
  exp.textContent = 'Export contact sheet';
  exp.onclick = () => {
    const a = document.createElement('a');
    a.href = contactSheet().toDataURL('image/png');
    a.download = `envlab_${state.subject.id.replace(':', '_')}_${state.weather.id}.png`;
    a.click();
  };
  bar.append(exp);
}

/** Composes every panel with its caption into one PNG. */
function contactSheet(): HTMLCanvasElement {
  const cols = LIGHTING.length, gap = 8, cap = 18, head = 40;
  const gridRows = ZOOMS.length;
  const strip = panels.slice(ZOOMS.length * LIGHTING.length);
  const W = cols * (PW + gap) + gap;
  const H = head + (gridRows + 1) * (PH + cap + gap) + 30;
  const c = document.createElement('canvas');
  c.width = Math.max(W, strip.length * (PW + gap) + gap); c.height = H;
  const x = c.getContext('2d')!;
  x.fillStyle = '#16140f'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#e8e0c8'; x.font = '18px "Share Tech Mono", monospace';
  x.fillText(`ENVIRONMENT LAB · ${state.subject.label} · ${state.weather.name} · seed ${state.seed}`, gap, 26);
  x.font = '12px "Share Tech Mono", monospace';
  panels.forEach((p, i) => {
    const inStrip = i >= ZOOMS.length * LIGHTING.length;
    const col = inStrip ? i - ZOOMS.length * LIGHTING.length : i % cols;
    const row = inStrip ? gridRows : Math.floor(i / cols);
    const px = gap + col * (PW + gap), py = head + row * (PH + cap + gap) + (inStrip ? 10 : 0);
    x.drawImage(p.canvas, px, py);
    x.fillStyle = '#bfb69b';
    x.fillText(`${p.title} · ${p.view.zoom} px/m`, px, py + PH + 13);
  });
  return c;
}

let last = 0;
function loop(t: number) {
  if (state.animate && t - last > 33) {
    last = t;
    for (const p of panels) drawPanel(p, t / 1000, state.weather);
  }
  requestAnimationFrame(loop);
}

async function boot() {
  await loadFonts();
  document.getElementById('envlab')!.innerHTML = `
    <header><h1>Environment Lab</h1><span>Khuzestan 1980 · dev tool · rows: zoom, columns: time of day</span></header>
    <div id="controls"></div>
    <main><section><div id="grid" class="grid"></div><h2 id="strip-title"></h2><div id="strip" class="grid"></div></section><aside id="inspector"></aside></main>`;
  controls();
  build();
  requestAnimationFrame(loop);
  (window as any).envlab = {
    ready: true,
    exportPng: () => contactSheet().toDataURL('image/png'),
    redraw: (time: number) => { for (const p of panels) drawPanel(p, time, state.weather); },
    stats: () => panels.map((p) => ({ title: p.title, zoom: p.view.zoom, paintMs: p.paintMs, frameMs: p.frameMs, micro: p.micro })),
  };
}
void boot();
