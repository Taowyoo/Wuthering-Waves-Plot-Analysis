import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const defaultRoot = path.resolve(import.meta.dirname, '..', 'dist');
const types = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8' };

export function createPreviewServer({ root = defaultRoot, basePath = '/' } = {}) {
  root = path.resolve(root);
  if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('basePath must start and end with /');
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) return response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { return response.writeHead(400).end('Bad request'); }
    if (!pathname.startsWith(basePath)) return response.writeHead(404).end('Not found');
    const relative = pathname.slice(basePath.length);
    let file = path.resolve(root, relative);
    const withinRoot = path.relative(root, file);
    if (relative.includes('\0') || withinRoot === '..' || withinRoot.startsWith(`..${path.sep}`) || path.isAbsolute(withinRoot)) return response.writeHead(403).end('Forbidden');
    try {
      if ((await stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          const url = new URL(request.url, 'http://localhost');
          return response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
        }
        file = path.join(file, 'index.html');
      }
      const info = await stat(file);
      if (!info.isFile()) return response.writeHead(404).end('Not found');
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Content-Length': info.size });
      if (request.method === 'HEAD') return response.end();
      const stream = createReadStream(file);
      stream.on('error', () => response.destroy());
      stream.pipe(response);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 4173);
  const basePath = process.env.PREVIEW_BASE_PATH ?? '/';
  const server = createPreviewServer({ basePath });
  server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}${basePath}`));
}
