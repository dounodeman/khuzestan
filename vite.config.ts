import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Dev-only Sprite Lab: serves /lab (lab.html) and lists reference images in refs/<vehicle_id>/.
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
        const m = url.match(/^\/__lab\/refs\/([a-z0-9_]+)$/);
        if (!m) return next();
        const dir = path.join(refsRoot, m[1]);
        const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f)).sort() : [];
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(files));
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
