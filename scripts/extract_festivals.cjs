// Run from repository root: node scripts/extract_festivals.cjs
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = 'WutheringWaves_Data';
const out = '原文资料/朝月会与追月节';
const files = ['multi_text', 'multi_text_1sthalf', 'multi_text_2ndhalf'].map(d => `${root}/Textmaps/zh-Hans/${d}/MultiText.json`);
const groups = [
  ['F01', '追月节起源说书', /^zhuiyuejie_first_2_\d+$/],
  ['F02', '节前通讯与月树屋、宵月会', /^zhuiyuejie_first_1_\d+$|^zhuiyuejie_first_10_(11[7-9]|120)$/],
  ['F03', '朝月会词条', /^Term852014_(Title|Desc)$/],
  ['F04', '渊城旧日与梦州各地节庆', /^Main_Mengzhou_3_6_450_(19|20|22|23)$|^Main_Mengzhou_3_6_454_[12]$|^Main_Mengzhou_3_6_650_30$/],
  ['F05', '朝月宴邀月同席', /^Main_Mengzhou_3_7_(89|90)_\d+$/],
  ['F06', '现世放灯与共游', /^Main_Mengzhou_3_7_246_\d+$|^Main_Mengzhou_3_7_249_([1-9]|1[0-2]|2[0-9]|30)$/],
  ['F07', '心的分形受限', /^Main_Mengzhou_3_7_(203|205)_\d+$/],
  ['F08', '烬心域旧影与重燃灯火', /^Main_Mengzhou_3_7_74_[1-4]$|^Main_Mengzhou_3_7_102_[1-7]$|^Main_Mengzhou_3_7_104_(2[6-9]|30|39|40)$|^Main_Mengzhou_3_7_70_12$/],
  ['F09', '两地节俗与食物', /^ItemInfo_800000(36|37|38|91)_(Name|BgDescription)$/],
  ['F10', '散华与节日当下', /^Event_THCQDYBF_9_(3[2-9]|4[0-2])$/],
  ['F11', '节庆放假', /^Event_THCQDYBF_21_6$|^ZYHSGST_17_[1-5]$|^ZYHSGST_18_[12]$/],
  ['F12', '心狐题材流通', /^SIDE_XFYRYR_10_(12|13|14)$|^FavorStory_131105_(Title|Content)$/],
  ['F13', '心与心月狐的区分及后续', /^Main_Mengzhou_3_7_241_\d+$|^Main_Mengzhou_3_7_255_(1[0-9]|2[0-4])$/],
  ['F14', '民间传说的变形', /^FavorStory_131101_(Title|Content)$/],
  ['F15', '奉月舞社的地方仪式', /^Side_ZZHNY_6_[1-8]$|^Side_ZZHNY_31_(3[5-9]|4[0-4])$/],
  ['F16', '朝月会生态：梦州与今州来客', /^ZYHSGST_20_[1-4]$|^ZYHSGST_8_[1-4]$|^STNPC_RCGCST_32_[1-3]$/],
  ['F17', '冠饰与游龙舞', /^OrnamentAttrDes_80870013$|^MapMark_10017_MarkDesc$/],
];
const texts = files.flatMap(file => JSON.parse(fs.readFileSync(file, 'utf8')).map(row => ({file, ...row})));
const selected = new Set(texts.filter(x => groups.some(g => g[2].test(x.Id))).map(x => x.Id));
const speakerFile = `${root}/BinData/speaker/speaker.json`;
const speakerTextFile = `${root}/Textmaps/zh-Hans/speaker/Speaker.json`;
const stateFile = `${root}/BinData/flowState/flowstate.json`;
const names = new Map(JSON.parse(fs.readFileSync(speakerTextFile, 'utf8')).map(x => [x.Id, x.Content]));
const speakers = new Map(JSON.parse(fs.readFileSync(speakerFile, 'utf8')).map(x => [x.Id, names.get(x.Name)]));
const refs = new Map();
function walk(obj, state) {
  if (!obj || typeof obj !== 'object') return;
  if (selected.has(obj.TidTalk)) {
    const list = refs.get(obj.TidTalk) || [];
    list.push({StateKey: state, WhoId: obj.WhoId ?? null, speaker: speakers.get(obj.WhoId) ?? null});
    refs.set(obj.TidTalk, list);
  }
  for (const v of Object.values(obj)) if (v && typeof v === 'object') {
    if (Array.isArray(v)) v.forEach(x => walk(x, state)); else walk(v, state);
  }
}
for (const state of JSON.parse(fs.readFileSync(stateFile, 'utf8'))) {
  if ([...selected].some(id => state.Actions.includes(id))) walk(JSON.parse(state.Actions), state.StateKey);
}
const evidence = groups.map(([id, title, pattern]) => ({id, title, records: texts.filter(x => pattern.test(x.Id)).map(x => ({...x, flowRefs: refs.get(x.Id) || []}))}));
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, '本地证据.json'), JSON.stringify(evidence, null, 2) + '\n');
const md = ['# 朝月会与追月节：本地文本证据摘录', '', '本文件由 `node scripts/extract_festivals.cjs` 生成。保留原标签、占位符和不同文件记录；同一内容的复用不计作独立剧情证据。文件顺序及文本 ID 顺序不等于实际游戏演出顺序。未出现 flowRefs 的记录不能据此推定发言者。', '', '注意：主表中部分 3.7 文本只有星号；分表保存了同 ID 的可读文本。星号记录只用于记录数据状态，不用于正文立论。演员编号不是角色姓名，具体场景须与网页或完整流程核对。', ''];
for (const g of evidence) {
  md.push(`<a id="${g.id}"></a>`, `## ${g.id} ${g.title}`, '');
  for (const r of g.records) {
    md.push(`### ${r.Id}`, '', `来源：\`${r.file}\``, '');
    for (const ref of r.flowRefs) md.push(`流程：\`${ref.StateKey}\`；WhoId：${ref.WhoId}；名称：${ref.speaker ?? '未解析'}。`, '');
    md.push(...r.Content.split('\n').map(s => '> ' + s), '');
  }
}
fs.writeFileSync(path.join(out, '本地证据摘录.md'), md.join('\n'));
const provenance = {
  researchDate: '2026-10-10', versionReadme: fs.readFileSync(`${root}/README.md`, 'utf8'),
  note: '版本信息为资料仓库自述；未核对实机逐句演出，不将内部流程名视为正式任务名或已上线证明。',
  files: [...files, speakerFile, speakerTextFile, stateFile, `${root}/README.md`].map(file => ({file, bytes: fs.statSync(file).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')})),
  keywordHits: texts.filter(x => /朝月会|追月节|宵月会/.test(x.Content || '')).length,
  selectedRecords: evidence.reduce((n,g) => n + g.records.length,0),
  readableRecords: evidence.flatMap(g => g.records).filter(r => !/^\*+$/.test(r.Content)).length
};
fs.writeFileSync(path.join(out, '提取记录.json'), JSON.stringify(provenance, null, 2) + '\n');
console.log(JSON.stringify({groups: evidence.map(x => [x.id,x.records.length]), records: provenance.selectedRecords, keywordHits: provenance.keywordHits}));
