// Local preview: node dev-server.mjs  → http://localhost:8795
// Reads NOTION_TOKEN / NOTION_DB_ID from .env.local (never committed).
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.dirname(fileURLToPath(import.meta.url));

try {
  const env = await fs.readFile(path.join(ROOT, '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env.local */ }

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(url.pathname);

  if (p.startsWith('/api/')) {
    const name = p.slice(5).replace(/[^a-z0-9_-]/gi, '');
    try {
      const modPath = path.join(ROOT, 'api', name + '.js');
      delete require.cache[modPath];
      const handler = require(modPath);
      const fake = {
        status(c) { res.statusCode = c; return fake; },
        json(o) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return fake; },
        setHeader(k, v) { res.setHeader(k, v); return fake; },
      };
      await handler({ query: Object.fromEntries(url.searchParams), method: req.method }, fake);
    } catch (e) {
      res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (p === '/') p = '/index.html';
  if (!path.extname(p)) p += '.html';
  try {
    const buf = await fs.readFile(path.join(ROOT, p));
    res.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream');
    res.end(buf);
  } catch {
    res.statusCode = 404; res.end('Not found');
  }
});

server.listen(8795, () => console.log('http://localhost:8795'));
