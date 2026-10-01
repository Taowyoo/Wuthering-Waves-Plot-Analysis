import { readFile, writeFile } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
// A top-level 404.html disables Pages' automatic SPA fallback for this
// three-document site, so unknown evidence URLs don't silently show overview.
await readFile(new URL('index.html', output));
await writeFile(new URL('404.html', output), `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>页面未找到｜玄方剧情考据</title><link rel="stylesheet" href="/assets/site.css"></head>
<body><main class="article"><h1>页面未找到</h1><p>请检查网址，或返回资料库查找证据。</p><nav aria-label="阅读入口"><a href="/">概览</a><a href="/report/">考据报告</a><a href="/sources/">资料索引</a></nav></main></body></html>\n`);
console.log('Prepared Cloudflare Pages output with explicit 404 handling.');
