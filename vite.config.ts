import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Dev-only Sprite Lab: serves /lab (lab.html), lists reference images in refs/<vehicle_id>/ and saves the lab's
 * calibration, mask and marked-point sidecar files next to them.
 * refs/ is git-ignored and never part of the build; lab.html is not a build input.
 */
function spriteLab(): Plugin {
  const refsRoot = path.resolve(__dirname, 'refs');
  return {
    name: 'sprite-lab',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (url === '/lab' || url === '/lab/' || url.startsWith('/lab?')) { req.url = '/lab.html' + url.slice(url.indexOf('?') >= 0 ? url.indexOf('?') : url.length); return next(); }
        const m = url.match(/^\/__lab\/refs\/([a-z0-9_]+)(?:\/([A-Za-z0-9._-]+))?$/);
        if (!m) return next();
        const dir = path.join(refsRoot, m[1]);
        if (req.method === 'POST' && m[2]) {
          // Lab sidecars only (calibration, mask, marked points, compare results); they stay in git-ignored refs/.
          if (!/\.(calib\.json|mask\.png|mask\.json|points\.json|compare\.json)$/.test(m[2])) { res.statusCode = 400; return res.end('bad name'); }
          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(c));
          req.on('end', () => {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, m[2]!), Buffer.concat(chunks));
            res.end('ok');
          });
          return;
        }
        if (m[2]) return next();
        const all = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
        const sidecar = /\.(calib\.json|mask\.png|mask\.json|points\.json|compare\.json)$/;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          images: all.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f) && !sidecar.test(f)),
          sidecars: all.filter((f) => sidecar.test(f)),
        }));
      });
    },
  };
}

// Relative base so the built game can be hosted from any sub-path.
export default defineConfig({
  base: './',
  plugins: [spriteLab()],
  build: { target: 'es2022', sourcemap: true },
  server: { host: '0.0.0.0', port: 5173 },
});
