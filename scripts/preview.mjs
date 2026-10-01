import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'dist');
const types = { '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.mjs': 'text/javascript' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  let file = path.join(root, pathname);
  if (!file.startsWith(root)) return response.writeHead(403).end('Forbidden');
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    response.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.listen(4173, () => console.log('Preview: http://localhost:4173/'));
