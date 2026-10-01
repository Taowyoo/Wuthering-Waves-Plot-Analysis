const root = document.body.dataset.root;
const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#site-nav');
const dialog = document.querySelector('.search-dialog');
const input = document.querySelector('#search-input');
const status = document.querySelector('#search-status');
const results = document.querySelector('#search-results');
let index;

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

async function openSearch() {
  dialog.showModal();
  input.focus();
  index ??= await fetch(`${root}search-index.json`).then((response) => response.json());
}

document.querySelector('.search-button').addEventListener('click', openSearch);
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    openSearch();
  }
});

input.addEventListener('input', () => {
  const query = input.value.trim().toLocaleLowerCase('zh-CN');
  results.replaceChildren();
  if (!query) {
    status.textContent = '输入至少一个字符开始检索。';
    return;
  }
  const matches = index.filter((record) => `${record.title} ${record.text}`.toLocaleLowerCase('zh-CN').includes(query)).slice(0, 30);
  status.textContent = matches.length ? `找到 ${matches.length} 条结果${matches.length === 30 ? '（仅显示前 30 条）' : ''}。` : `没有找到“${input.value.trim()}”。请尝试资料编号或较短的关键词。`;
  for (const record of matches) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `${root}${record.url}`;
    link.textContent = record.title;
    const meta = document.createElement('small');
    meta.textContent = `${record.page} · ${record.text.slice(0, 120)}${record.text.length > 120 ? '…' : ''}`;
    item.append(link, meta);
    results.append(item);
  }
});

const progress = document.querySelector('.reading-progress span');
function updateProgress() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${available > 0 ? Math.min(100, window.scrollY / available * 100) : 0}%`;
}
addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

const diagrams = document.querySelectorAll('.mermaid');
if (diagrams.length) {
  import(`${root}assets/mermaid.esm.min.mjs`).then(({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'neutral', securityLevel: 'strict' });
    return mermaid.run({ nodes: diagrams });
  }).catch(() => {
    for (const diagram of diagrams) diagram.setAttribute('aria-label', '关系图加载失败，请展开下方源代码阅读。');
  });
}
