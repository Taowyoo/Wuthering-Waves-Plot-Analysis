import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const failures = [];
const pages = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.name === 'index.html') pages.push(target);
  }
}

await walk(dist);
const htmlByPath = new Map();
for (const page of pages) htmlByPath.set(page, await readFile(page, 'utf8'));

for (const [page, html] of htmlByPath) {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  for (const id of new Set(ids)) {
    if (ids.filter((candidate) => candidate === id).length > 1) failures.push(`${path.relative(root, page)}: duplicate id #${id}`);
  }
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:)/.test(href)) continue;
    const [pathname, fragment] = href.split('#');
    let target = path.resolve(path.dirname(page), pathname || path.basename(page));
    if (pathname?.endsWith('/')) target = path.join(target, 'index.html');
    if (!path.extname(target)) target = path.join(target, 'index.html');
    let targetHtml;
    try { targetHtml = await readFile(target, 'utf8'); }
    catch { failures.push(`${path.relative(root, page)}: missing link target ${href}`); continue; }
    if (fragment && !new RegExp(`\\sid="${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(targetHtml)) failures.push(`${path.relative(root, page)}: missing fragment ${href}`);
  }
}

const sourceAnchors = [];
for (const file of ['README.md', '玄方剧情考据报告.md', '资料索引.md']) {
  const markdown = await readFile(path.join(root, file), 'utf8');
  sourceAnchors.push(...[...markdown.matchAll(/<a id="([^"]+)"><\/a>/g)].map((match) => match[1]));
}
const generated = htmlByPath.get(path.join(dist, 'sources', 'index.html'));
for (const anchor of sourceAnchors) if (!generated.includes(`id="${anchor}"`)) failures.push(`explicit source anchor was not preserved: ${anchor}`);
if (sourceAnchors.length !== 208) failures.push(`expected 208 explicit anchors, found ${sourceAnchors.length}`);

const search = JSON.parse(await readFile(path.join(dist, 'search-index.json'), 'utf8'));
for (const query of ['木禺', 'S35A', '梁鸢']) if (!search.some((record) => `${record.title} ${record.text}`.includes(query))) failures.push(`search index has no result for ${query}`);
if (search.some((record) => `${record.title} ${record.text}`.includes('一个肯定不存在的检索词'))) failures.push('empty-result search fixture unexpectedly matched');
if (!generated.includes('id="S35A"') || !generated.includes('木禺假扮天工、引导实验，秧秧成为重要目标')) failures.push('verified S35A E05 description is missing');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages.length} pages, ${sourceAnchors.length} explicit anchors, internal links, fragments, and search fixtures.`);
}
