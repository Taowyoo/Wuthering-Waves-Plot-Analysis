import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'dist');
const pages = [
  { source: 'README.md', route: '', label: '概览' },
  { source: '玄方剧情考据报告.md', route: 'report', label: '考据报告' },
  { source: '资料索引.md', route: 'sources', label: '资料索引' }
];

const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const stripHtml = (value) => value.replace(/<[^>]*>/g, '').replace(/&(?:nbsp|amp|lt|gt|quot);/g, ' ').replace(/\s+/g, ' ').trim();
const slugCounts = new Map();
const slugify = (text) => {
  const base = stripHtml(text).toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
  const count = slugCounts.get(base) ?? 0;
  slugCounts.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
};

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, index, options, env, self) => {
  const token = tokens[index];
  if (token.info.trim() === 'mermaid') {
    return `<div class="diagram"><pre class="mermaid">${escapeHtml(token.content)}</pre><details><summary>查看关系图源代码</summary><pre><code>${escapeHtml(token.content)}</code></pre></details></div>`;
  }
  return defaultFence(tokens, index, options, env, self);
};
md.renderer.rules.heading_open = (tokens, index) => {
  const next = tokens[index + 1];
  const id = slugify(next?.content ?? 'section');
  tokens[index].attrSet('id', id);
  return `<${tokens[index].tag} id="${id}">`;
};

function relativeRoot(route) {
  return route ? '../' : './';
}

function rewriteLinks(markdown, route) {
  const prefix = relativeRoot(route);
  const targets = new Map([
    ['README.md', prefix],
    ['玄方剧情考据报告.md', `${prefix}report/`],
    ['资料索引.md', `${prefix}sources/`]
  ]);
  return markdown.replace(/\]\((README\.md|玄方剧情考据报告\.md|资料索引\.md)(#[^)]+)?\)/g, (_, file, hash = '') => `](${targets.get(file)}${hash})`);
}

function renderToc(headings) {
  return headings.filter(({ level }) => level >= 2 && level <= 3).map(({ level, id, text }) =>
    `<li class="toc-level-${level}"><a href="#${id}">${escapeHtml(text)}</a></li>`).join('');
}

function pageTemplate({ title, content, route, toc, description }) {
  const prefix = relativeRoot(route);
  const nav = pages.map((page) => {
    const href = page.route ? `${prefix}${page.route}/` : prefix;
    const current = page.route === route ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${page.label}</a>`;
  }).join('');
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="color-scheme" content="light dark">
  <title>${escapeHtml(title)}｜玄方剧情考据</title>
  <link rel="stylesheet" href="${prefix}assets/site.css">
  <script type="module" src="${prefix}assets/site.js"></script>
</head>
<body data-root="${prefix}">
  <a class="skip-link" href="#main">跳到正文</a>
  <header class="site-header">
    <a class="brand" href="${prefix}"><span aria-hidden="true">玄</span><strong>玄方剧情考据</strong></a>
    <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav">菜单</button>
    <nav id="site-nav" aria-label="主导航">${nav}<button class="search-button" type="button" aria-haspopup="dialog">搜索 <kbd>/</kbd></button></nav>
  </header>
  <div class="reading-progress" aria-hidden="true"><span></span></div>
  <div class="page-shell">
    ${toc ? `<aside class="toc"><p>本页目录</p><ol>${toc}</ol></aside>` : ''}
    <main id="main" class="article">${content}</main>
  </div>
  <footer><p>非官方剧情研究资料库 · 内容以 Markdown 原稿为准</p><p><a href="https://github.com/Taowyoo/Wuthering-Waves-Plot-Analysis">在 GitHub 查看原始资料</a></p></footer>
  <dialog class="search-dialog" aria-labelledby="search-title">
    <form method="dialog"><button class="close-search" aria-label="关闭搜索">×</button></form>
    <h2 id="search-title">检索资料库</h2>
    <label for="search-input">输入中文关键词、人物或资料编号</label>
    <input id="search-input" type="search" autocomplete="off" placeholder="例如：木禺、S35A、梁鸢">
    <p id="search-status" class="search-status" aria-live="polite">输入至少一个字符开始检索。</p>
    <ol id="search-results" class="search-results"></ol>
  </dialog>
</body>
</html>`;
}

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
const searchRecords = [];

for (const page of pages) {
  slugCounts.clear();
  const markdown = rewriteLinks(await readFile(path.join(root, page.source), 'utf8'), page.route);
  const tokens = md.parse(markdown, {});
  const headings = [];
  let currentSection = page.label;
  let sectionText = [];
  const flushSection = () => {
    const text = stripHtml(sectionText.join(' '));
    if (text) searchRecords.push({ title: currentSection, page: page.label, url: `${page.route ? `${page.route}/` : ''}${headings.at(-1)?.id ? `#${headings.at(-1).id}` : ''}`, text: text.slice(0, 1200) });
    sectionText = [];
  };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'heading_open') {
      if (token.tag === 'h2' || token.tag === 'h3') flushSection();
      const inline = tokens[index + 1];
      const id = slugify(inline?.content ?? 'section');
      headings.push({ level: Number(token.tag.slice(1)), id, text: inline?.content ?? '' });
      if (token.tag === 'h2' || token.tag === 'h3') currentSection = inline?.content ?? page.label;
    } else if (token.type === 'inline') sectionText.push(token.content);
  }
  flushSection();
  slugCounts.clear();
  const content = md.render(markdown);
  const title = headings.find(({ level }) => level === 1)?.text ?? page.label;
  const target = path.join(output, page.route);
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, 'index.html'), pageTemplate({ title, content, route: page.route, toc: renderToc(headings), description: stripHtml(markdown).slice(0, 150) }));
}

await cp(path.join(root, 'src', 'site.css'), path.join(output, 'assets', 'site.css'));
await cp(path.join(root, 'src', 'site.js'), path.join(output, 'assets', 'site.js'));
await cp(path.join(root, 'node_modules', 'mermaid', 'dist', 'mermaid.esm.min.mjs'), path.join(output, 'assets', 'mermaid.esm.min.mjs'));
await cp(path.join(root, 'node_modules', 'mermaid', 'dist', 'chunks', 'mermaid.esm.min'), path.join(output, 'assets', 'chunks', 'mermaid.esm.min'), { recursive: true });
await writeFile(path.join(output, 'search-index.json'), `${JSON.stringify(searchRecords)}\n`);
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Built ${pages.length} pages and ${searchRecords.length} search records in dist/.`);
