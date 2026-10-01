document.documentElement.classList.add('js');
const root = document.body.dataset.root;
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#site-nav');
const dialog = document.querySelector('.search-dialog');
const input = document.querySelector('#search-input');
const status = document.querySelector('#search-status');
const results = document.querySelector('#search-results');
let index;
let loading;
let returnFocus;

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

function renderResults() {
  results.replaceChildren();
  if (!index) return;
  const query = input.value.trim().toLocaleLowerCase('zh-CN');
  if (!query) {
    status.textContent = '输入至少一个字符开始检索。';
    return;
  }
  const matches = index.filter((record) => `${record.title} ${record.text}`.toLocaleLowerCase('zh-CN').includes(query));
  status.textContent = matches.length ? `找到 ${matches.length} 条结果${matches.length > 30 ? '（仅显示前 30 条）' : ''}。` : `没有找到“${input.value.trim()}”。请尝试资料编号或较短的关键词。`;
  for (const record of matches.slice(0, 30)) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `${root}${record.url}`;
    link.textContent = record.title;
    const meta = document.createElement('small');
    const found = record.text.toLocaleLowerCase('zh-CN').indexOf(query);
    const start = Math.max(0, found - 35);
    meta.textContent = `${record.page} · ${start ? '…' : ''}${record.text.slice(start, start + 120)}${record.text.length > start + 120 ? '…' : ''}`;
    item.append(link, meta);
    results.append(item);
  }
}

async function openSearch() {
  if (!dialog.open) {
    returnFocus = document.activeElement === document.body ? document.querySelector('.search-button') : document.activeElement;
    dialog.showModal();
  }
  input.focus();
  if (index) return renderResults();
  status.textContent = '正在加载资料索引…';
  loading ??= fetch(`${root}search-index.json`).then((response) => {
    if (!response.ok) throw new Error(`Search index HTTP ${response.status}`);
    return response.json();
  }).then((records) => { index = records; });
  try {
    await loading;
    renderResults();
  } catch {
    status.textContent = '资料索引加载失败，请关闭搜索后重试。';
  } finally {
    loading = undefined;
  }
}

document.querySelector('.search-button').addEventListener('click', openSearch);
dialog.addEventListener('close', () => returnFocus?.focus());
dialog.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    dialog.close();
    returnFocus?.focus();
  }
}, { capture: true });
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !document.activeElement.isContentEditable && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    openSearch();
  }
});
input.addEventListener('input', renderResults);

const progress = document.querySelector('.reading-progress span');
function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${available > 0 ? Math.min(100, window.scrollY / available * 100) : 0}%`;
}
addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress);
updateProgress();

const diagrams = document.querySelectorAll('.mermaid');
if (diagrams.length) {
  import(`${root}assets/mermaid.esm.min.mjs`).then(({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'neutral', securityLevel: 'strict', flowchart: { useMaxWidth: false } });
    return mermaid.run({ nodes: diagrams });
  }).then(updateProgress).catch(() => {
    for (const diagram of diagrams) diagram.setAttribute('aria-label', '关系图加载失败，请展开下方源代码阅读。');
    for (const fallback of document.querySelectorAll('.diagram details')) fallback.open = true;
  });
}
