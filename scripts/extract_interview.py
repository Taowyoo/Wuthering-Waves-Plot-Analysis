"""Extract the user-supplied interview PDF without rewriting its content."""
from pathlib import Path
import hashlib
import html
import json
import logging
import unicodedata
import pdfplumber
from pypdf import PdfReader

logging.getLogger('pdfminer').setLevel(logging.ERROR)
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '独家内幕｜库洛鸣潮文案负责人：像滚雪球，把创意越滚越大.pdf'
OUT = ROOT / '原文资料' / '鸣潮文案负责人访谈'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'pages').mkdir(exist_ok=True)
(OUT / 'images').mkdir(exist_ok=True)
reader = PdfReader(SOURCE)
doc = pdfplumber.open(SOURCE)
raw = []
md = ['# 独家内幕｜库洛鸣潮文案负责人：像滚雪球，把创意越滚越大',
      '> 从用户提供的 PDF 提取；下方保留所有页面文字及已嵌入的图片，含文末推荐和账号信息。原 PDF 为排版依据；此版仅合并同段的印刷换行，并将兼容汉字映射为常用汉字，不改写正文。分页保留，跨页段落未强行合并。',
      '[原始 PDF](../../' + SOURCE.name + ') · [原貌分页版](原貌分页版.html) · [逐页原始文本](逐页原始文本.txt) · [提取记录](提取记录.json)', '']
manifest = {'source': SOURCE.name, 'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            'source_url': 'https://mp.weixin.qq.com/s/iXEYhe_ZjQYSd0p6J_TT-Q',
            'extracted_on': '2026-10-07', 'pages': [], 'images': [],
            'notes': ['原始 PDF 保持不变。', '动态图片在打印 PDF 中只有静态画面。',
                      '原网页部分配图未进入 PDF；没有从其他网页补入图片。',
                      'Markdown 保留分页，正文之外的推荐与账号信息也保留。']}
image_paths = {}
for pn, page in enumerate(reader.pages, 1):
    for im in page.images:
        digest = hashlib.sha256(im.data).hexdigest()
        if digest not in image_paths:
            path = 'images/image-%02d%s' % (len(image_paths) + 1, Path(im.name).suffix)
            (OUT / path).write_bytes(im.data)
            image_paths[digest] = path
            manifest['images'].append({'path': path, 'sha256': digest, 'first_page': pn})

seen_images = set()
question_count = 0
answer_count = 0
for pn, (page, ppage) in enumerate(zip(doc.pages, reader.pages), 1):
    text = page.extract_text() or ''
    raw.append(f'===== PDF 第 {pn} 页 =====\n{text}\n')
    question_count += text.count('游戏那点事：')
    answer_count += text.count('鹅鹅鹅：')
    page_path = f'pages/page-{pn:02d}.png'
    page.to_image(resolution=110).save(OUT / page_path)
    manifest['pages'].append({'page': pn, 'text_chars': len(text),
                              'image_objects': len(page.images), 'render': page_path})
    md.append(f'<a id="page-{pn:02d}"></a>\n\n## PDF 第 {pn} 页\n')
    if not text and not page.images:
        md.append('> 此页在原 PDF 中为空白。\n')
        continue
    # Reconstruct paragraphs from vertical gaps; retain original page boundaries.
    groups = []
    previous = None
    for line in page.extract_text_lines():
        if previous is None or line['top'] - previous['bottom'] > 11:
            groups.append({'y': line['top'], 'lines': [line['text']]})
        else:
            groups[-1]['lines'].append(line['text'])
        previous = line
    # Printed section numbers and section titles have separate vertical spacing.
    merged = []
    idx = 0
    while idx < len(groups):
        group = groups[idx]
        if group['lines'] in (['01'], ['02'], ['03'], ['04']) and idx + 1 < len(groups):
            group = {'y': group['y'], 'lines': group['lines'] + groups[idx + 1]['lines']}
            idx += 1
        merged.append(group)
        idx += 1
    groups = merged
    events = []
    for group in groups:
        # Map Kangxi radicals to ordinary Chinese characters only, preserving punctuation.
        body = ''.join(''.join(unicodedata.normalize('NFKC', c) if 0x2e80 <= ord(c) <= 0x2fff else c
                               for c in line) for line in group['lines'])
        if body.startswith('游戏那点事：'):
            body = '**' + body + '**'
        elif body.startswith('鹅鹅鹅：'):
            body = '**鹅鹅鹅：**' + body[len('鹅鹅鹅：'):]
        elif len(group['lines']) == 2 and group['lines'][0] in ('01', '02', '03', '04'):
            body = '### ' + group['lines'][0] + ' ' + body[2:]
        elif pn == 1 and group == groups[0]:
            body = '### ' + body
        events.append((group['y'], body))
    for pos, im in zip(page.images, ppage.images):
        digest = hashlib.sha256(im.data).hexdigest()
        if digest in seen_images:
            continue
        seen_images.add(digest)
        events.append((pos['top'], f'![PDF嵌入图片，首次出现于第{pn}页]({image_paths[digest]})'))
    for _, body in sorted(events, key=lambda e: e[0]):
        md.append(body + '\n')

manifest['question_count'] = question_count
manifest['answer_count'] = answer_count
(OUT / '逐页原始文本.txt').write_text('\n'.join(raw), encoding='utf-8')
(OUT / '全文提取.md').write_text('\n'.join(md), encoding='utf-8')
(OUT / '提取记录.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
page_html = '\n'.join(f'<figure id="page-{i:02d}"><figcaption>PDF 第 {i} 页</figcaption><img src="pages/page-{i:02d}.png" alt="原 PDF 第 {i} 页" loading="lazy"></figure>' for i in range(1, len(doc.pages)+1))
(OUT / '原貌分页版.html').write_text('''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>鸣潮文案负责人访谈 · 原貌分页版</title><style>body{margin:0;background:#eceef0;color:#333;font:16px/1.7 system-ui,sans-serif}header{max-width:900px;margin:24px auto;padding:0 20px}a{color:#176579}figure{margin:24px auto;max-width:900px}figcaption{text-align:center;font-size:13px;color:#666;margin:6px}img{display:block;width:100%;background:white;box-shadow:0 2px 12px #0002} @media print{header,figcaption{display:none}figure{break-after:page;margin:0;max-width:none}img{box-shadow:none}}</style><header><h1>鸣潮文案负责人访谈 · 原貌分页版</h1><p>以下逐页呈现用户提供的 PDF，保留其字体、颜色、空白、图片和分页。原打印文件未包含的图片与动画不作补绘。共19页，末页为空白。</p><p><a href="../../'''+html.escape(SOURCE.name, quote=True)+'''">原始 PDF</a> · <a href="全文提取.md">可编辑全文</a> · <a href="逐页原始文本.txt">原始文本</a></p></header>'''+page_html+'</html>', encoding='utf-8')
print(json.dumps({'pages': len(doc.pages), 'unique_images': len(image_paths),
                  'questions': question_count, 'answers': answer_count,
                  'source_sha256': manifest['sha256'], 'output': str(OUT)}, ensure_ascii=False))
