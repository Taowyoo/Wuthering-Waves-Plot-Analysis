import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createPreviewServer } from '../scripts/preview.mjs';

const server = createPreviewServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
function get(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path: url, method }, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}
try {
  await test('redirect directory URLs so nested assets resolve correctly', async () => {
    const response = await get('/report?mode=read');
    assert.equal(response.status, 301);
    assert.equal(response.headers.location, '/report/?mode=read');
    assert.equal((await get('/report/')).status, 200);
  });
  await test('reject malformed URLs and traversal, then continue serving', async () => {
    assert.equal((await get('/%ZZ')).status, 400);
    assert.equal((await get('/%00')).status, 403);
    assert.equal((await get('/..%2fpackage.json')).status, 403);
    assert.equal((await get('/..%2fdist-private/secret')).status, 403);
    assert.equal((await get('/')).status, 200);
  });
  await test('missing paths, HEAD and unsupported methods', async () => {
    assert.equal((await get('/missing')).status, 404);
    const response = await get('/assets/site.css', 'HEAD');
    assert.equal(response.status, 200);
    assert.equal(response.body, '');
    assert.match(response.headers['content-type'], /text\/css/);
    assert.equal((await get('/', 'POST')).status, 405);
  });
} finally {
  await new Promise((resolve) => server.close(resolve));
}
