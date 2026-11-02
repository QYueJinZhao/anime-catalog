#!/usr/bin/env node
/**
 * anime-catalog page generator (v2 全类型)
 * 用法: node scripts/page.mjs
 * 读取 data/anime.json（内联，保证 file:// 双击可用）+ data/meta.json + covers/ 目录
 * 生成 index.html：类型 tab + 分片懒加载 + 行式紧凑数据
 */
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const anime = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'anime.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'meta.json'), 'utf8'));
const coverIds = fs.readdirSync(path.join(ROOT, 'covers'))
  .filter((f) => f.endsWith('.jpg'))
  .map((f) => +f.replace('.jpg', ''));

const inline = JSON.stringify(anime).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, (m) => '\\u' + m.charCodeAt(0).toString(16).padStart(4, '0'));
const totalAll = Object.values(meta).reduce((a, b) => a + b, 0);
const genDate = new Date().toISOString().slice(0, 10);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>找番库 · 全类型目录</title>
<style>
:root{
  --bg:#0f1115; --bg2:#161a22; --card:#1b2029; --line:#2a3140;
  --fg:#e6e9ef; --fg2:#9aa3b2; --fg3:#5c6675;
  --acc:#5b8cff; --acc2:#f5a623;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--fg);font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif;line-height:1.5}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:1280px;margin:0 auto;padding:20px 16px 80px}
header h1{font-size:22px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
header h1 small{font-size:12px;color:var(--fg3);font-weight:normal}
.controls{position:sticky;top:0;z-index:20;background:linear-gradient(var(--bg) 88%,transparent);padding:10px 0 14px}
.searchrow{display:flex;gap:8px;flex-wrap:wrap}
#q{flex:1;min-width:200px;background:var(--bg2);border:1px solid var(--line);border-radius:8px;color:var(--fg);padding:9px 14px;font-size:15px;outline:none}
#q:focus{border-color:var(--acc)}
.btn{background:var(--bg2);border:1px solid var(--line);border-radius:8px;color:var(--fg2);padding:8px 14px;cursor:pointer;font-size:14px;white-space:nowrap}
.btn:hover{color:var(--fg);border-color:var(--acc)}
.btn.primary{background:var(--acc);border-color:var(--acc);color:#fff}
select{background:var(--bg2);border:1px solid var(--line);border-radius:8px;color:var(--fg);padding:8px 10px;font-size:14px;cursor:pointer;outline:none}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.tab{background:var(--bg2);border:1px solid var(--line);border-radius:8px;color:var(--fg2);padding:6px 14px;font-size:14px;cursor:pointer;user-select:none}
.tab:hover{border-color:var(--acc)}
.tab.on{background:var(--acc);border-color:var(--acc);color:#fff;font-weight:600}
.tab .n{color:var(--fg3);font-size:11px;margin-left:4px}
.tab.on .n{color:#dbe6ff}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.chip{background:var(--bg2);border:1px solid var(--line);border-radius:999px;color:var(--fg2);padding:4px 12px;font-size:13px;cursor:pointer;user-select:none}
.chip:hover{border-color:var(--acc)}
.chip.on{background:var(--acc);border-color:var(--acc);color:#fff}
.chip .n{color:var(--fg3);font-size:11px;margin-left:3px}
.chip.on .n{color:#dbe6ff}
.row2{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
.meta{color:var(--fg3);font-size:13px;margin-right:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:14px}
@media(max-width:640px){.grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .12s,border-color .12s;display:flex;flex-direction:column}
.card:hover{transform:translateY(-2px);border-color:var(--acc)}
.cover{position:relative;aspect-ratio:3/4;background:var(--bg2);overflow:hidden}
.cover img{width:100%;height:100%;object-fit:cover;display:block}
.nsfw-cover{display:flex;align-items:center;justify-content:center;height:100%;color:var(--fg3);font-size:13px;background:repeating-linear-gradient(45deg,var(--bg2),var(--bg2) 10px,#20262f 10px,#20262f 20px)}
.score{position:absolute;top:6px;right:6px;background:rgba(10,12,16,.82);border-radius:6px;padding:1px 7px;font-size:12px;font-weight:600;color:var(--acc2)}
.norank .score{color:var(--fg3)}
.info{padding:8px 10px 10px;display:flex;flex-direction:column;gap:4px;flex:1}
.t-cn{font-size:14px;font-weight:600;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.t-org{font-size:11px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:1em}
.badges{display:flex;gap:5px;flex-wrap:wrap;font-size:11px;color:var(--fg2);margin-top:auto}
.badges span{background:var(--bg2);border-radius:4px;padding:1px 6px}
.badges .cat{color:#bcd0ff}
.tags{font-size:11px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#sentinel{padding:24px;text-align:center;color:var(--fg3)}
.loading{grid-column:1/-1;padding:60px 0;text-align:center;color:var(--fg2)}
.modal-mask{position:fixed;inset:0;background:rgba(5,7,10,.75);display:none;z-index:50;padding:24px;overflow:auto}
.modal-mask.open{display:flex;align-items:flex-start;justify-content:center}
.modal{background:var(--bg2);border:1px solid var(--line);border-radius:14px;max-width:760px;width:100%;overflow:hidden;position:relative}
.m-head{display:flex;gap:16px;padding:20px 20px 12px}
.m-head img{width:150px;border-radius:8px;flex-shrink:0;background:var(--bg2)}
.m-title h2{font-size:20px;line-height:1.3}
.m-title .org{color:var(--fg3);font-size:13px;margin:2px 0 8px}
.m-facts{display:flex;gap:6px;flex-wrap:wrap;font-size:12px}
.m-facts span{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:2px 8px}
.m-facts b{color:var(--acc2)}
.m-body{padding:0 20px 20px}
.m-sum{color:var(--fg);font-size:14px;white-space:pre-wrap;margin:12px 0}
.m-tags{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
.m-tags .chip{cursor:pointer}
.m-links{display:flex;gap:14px;font-size:13px;margin-top:12px}
.m-close{position:absolute;top:14px;right:18px;font-size:26px;color:var(--fg2);cursor:pointer;background:none;border:none;z-index:2}
.banner{background:#3a2f14;border:1px solid #6b5518;color:#e8c96a;border-radius:8px;padding:10px 14px;font-size:13px;margin-top:12px;display:none}
footer{color:var(--fg3);font-size:12px;text-align:center;padding:30px 0 0}
.kbd{background:var(--bg2);border:1px solid var(--line);border-radius:4px;padding:0 5px;font-size:11px}
.empty{padding:60px 0;text-align:center;color:var(--fg3)}
.seg{display:flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.seg button{background:var(--bg2);border:none;color:var(--fg2);padding:8px 12px;font-size:13px;cursor:pointer}
.seg button:hover{color:var(--fg)}
.seg button.on{background:var(--acc);color:#fff}
.grid.list{display:flex;flex-direction:column;gap:6px}
.lrow{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 8px;background:var(--card);border:1px solid var(--line);border-radius:8px;cursor:pointer;transition:border-color .12s}
.lrow:hover{border-color:var(--acc)}
.l-cov{width:34px;height:46px;object-fit:cover;border-radius:4px;flex-shrink:0;background:var(--bg2)}
.l-cov.ph{display:flex;align-items:center;justify-content:center;color:var(--fg3);font-size:16px}
.l-score{font-size:13px;font-weight:600;color:var(--acc2);width:36px;text-align:right;flex-shrink:0}
.l-names{flex:1;min-width:0}
.l-cn{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.l-org{font-size:11px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:1em}
.l-meta{display:flex;gap:8px;flex-shrink:0;align-items:center;max-width:45%}
.l-cat{font-size:11px;background:var(--bg2);border-radius:4px;padding:1px 6px;color:#bcd0ff;white-space:nowrap}
.l-year,.l-plat{font-size:11px;color:var(--fg2);white-space:nowrap}
.l-tags{font-size:11px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
@media(max-width:760px){.l-cat,.l-plat,.l-tags{display:none}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <h1>找番库 <small>全类型目录 · ${totalAll.toLocaleString()} 条目 · 数据源 bangumi/Archive（周更全量 dump）· 生成于 ${genDate}</small></h1>
</header>
<div class="controls">
  <div class="searchrow">
    <input id="q" type="search" placeholder="搜索：原名 / 中文名 / 标签 / 年份…">
    <button class="btn primary" id="lucky" title="从当前筛选结果里随机抽一个">🎲 随机一部</button>
    <button class="btn" id="nsfwToggle" title="默认隐藏 NSFW 条目">NSFW：隐藏</button>
  </div>
  <div class="tabs" id="typeTabs"></div>
  <div class="chips" id="catChips"></div>
  <div class="row2">
    <span class="meta" id="stat"></span>
    <select id="plat"><option value="">平台：全部</option></select>
    <select id="decade"><option value="">年代：全部</option></select>
    <select id="scoreGte"><option value="">评分：不限</option><option value="9">≥ 9.0</option><option value="8.5">≥ 8.5</option><option value="8">≥ 8.0</option><option value="7">≥ 7.0</option><option value="6">≥ 6.0</option></select>
    <select id="sort">
      <option value="rank">排序：Bangumi 排名</option>
      <option value="score">评分 高→低</option>
      <option value="ratings">评分人数 多→少</option>
      <option value="fav">热度（想看+看过）</option>
      <option value="date">日期 新→旧</option>
      <option value="dateAsc">日期 旧→新</option>
    </select>
    <div class="seg" id="viewSeg" title="显示模式（按类型记忆）">
      <button id="viewGrid">⬛ 缩略图</button><button id="viewList">☰ 列表</button>
    </div>
  </div>
  <div class="banner" id="banner"></div>
</div>
<div class="grid" id="grid"></div>
<div class="empty" id="empty" style="display:none">没有匹配的条目，试试放宽筛选</div>
<div id="sentinel"></div>
<footer>数据 © bangumi.tv（CC BY-NC-ND）；点击卡片看详情 · 标签可点击追加搜索 · <span class="kbd">/</span> 聚焦搜索 · <span class="kbd">Esc</span> 关闭</footer>
</div>
<div class="modal-mask" id="mask">
  <div class="modal">
    <button class="m-close" id="mClose">×</button>
    <div class="m-head">
      <img id="mImg" alt="">
      <div class="m-title">
        <h2 id="mCn"></h2>
        <div class="org" id="mOrg"></div>
        <div class="m-facts" id="mFacts"></div>
      </div>
    </div>
    <div class="m-body">
      <div class="m-tags" id="mTags"></div>
      <div class="m-sum" id="mSum"></div>
      <div class="m-links"><a id="mLink" target="_blank" rel="noopener">在 bangumi.tv 打开 ↗</a><a id="mLyric" target="_blank" rel="noopener" style="display:none"></a></div>
    </div>
  </div>
</div>
<script id="DATA-ANIME" type="application/json">${inline}</script>
<script id="DATA-META" type="application/json">${JSON.stringify({ meta, coverIds })}</script>
<script>
/* ---------- 数据层：行式数组 [0]id [1]type [2]name [3]nameCn [4]date [5]platform [6]score [7]rank
   [8]ratings [9]wish [10]done [11]doing [12]nsfw [13]category [14]tags [15]tagCounts [16]summary [17]aliases
   [18]musicMeta(艺术家|作曲|作词) [21]=搜索缓存(运行时) [22]=年代缓存(运行时) ---------- */
const META = JSON.parse(document.getElementById('DATA-META').textContent);
const COVER_IDS = new Set(META.coverIds);
const TYPE_LABEL = { anime: '动画', book: '书籍·漫画', music: '音乐', game: '游戏', real: '三次元' };
const SHARDS = { anime: JSON.parse(document.getElementById('DATA-ANIME').textContent).rows };
const $ = (s) => document.querySelector(s);
const grid = $('#grid'), sentinel = $('#sentinel'), emptyEl = $('#empty'), stat = $('#stat');
const state = { type: 'anime', q: '', cat: '', plat: '', decade: '', score: '', sort: 'rank', nsfw: false };
let filtered = [], shown = 0;
const BATCH = 60;

const imgURL = (id) => COVER_IDS.has(id) ? 'covers/' + id + '.jpg' : 'https://api.bgm.tv/v0/subjects/' + id + '/image?type=small';
const imgLarge = (id) => COVER_IDS.has(id) ? 'covers/' + id + '.jpg' : 'https://api.bgm.tv/v0/subjects/' + id + '/image?type=medium';
function onCoverError(img, id) {
  if (COVER_IDS.has(id)) { img.dataset.fb = '1'; img.src = 'https://api.bgm.tv/v0/subjects/' + id + '/image?type=small'; return; }
  if (img.dataset.fb !== '1') { img.dataset.fb = '1'; img.src = 'https://api.bgm.tv/v0/subjects/' + id + '/image?type=small'; }
  else img.style.display = 'none';
}
const split = (s) => s ? s.split('|') : [];
const DECADES = ['未知','1920s','1930s','1940s','1950s','1960s','1970s','1980s','1990s','2000s','2010s','2020s','2030s'];
function decadeOf(dateStr) {
  const m = /^(\\d{4})/.exec(dateStr || '');
  return m ? (Math.floor(+m[1] / 10) * 10) + 's' : '未知';
}
const norm = (s) => s.toLowerCase().replace(/\\s+/g, '');

function rowsOf(type) { return SHARDS[type] || null; }

/* ---------- 类型 tab ---------- */
const tabsEl = $('#typeTabs');
tabsEl.innerHTML = Object.entries(META.meta).map(([t, n]) =>
  \`<span class="tab\${t === state.type ? ' on' : ''}" data-type="\${t}">\${TYPE_LABEL[t]} <span class="n">\${n.toLocaleString()}</span></span>\`).join('');
tabsEl.addEventListener('click', async (e) => {
  const tab = e.target.closest('.tab'); if (!tab || tab.dataset.type === state.type) return;
  document.querySelectorAll('#typeTabs .tab').forEach((c) => c.classList.toggle('on', c === tab));
  state.type = tab.dataset.type;
  state.cat = ''; state.plat = ''; state.decade = ''; state.score = '';
  $('#plat').value = ''; $('#decade').value = ''; $('#scoreGte').value = '';
  if (!SHARDS[state.type]) {
    grid.innerHTML = '<div class="loading">正在加载' + TYPE_LABEL[state.type] + '分片（' + META.meta[state.type].toLocaleString() + ' 条）…首次约需数秒</div>';
    try {
      const res = await fetch('data/' + state.type + '.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      SHARDS[state.type] = (await res.json()).rows;
    } catch (err) {
      const b = $('#banner');
      b.style.display = 'block';
      b.innerHTML = '加载失败（' + err.message + '）。本地直接打开 file:// 无法 fetch 分片：请双击 <b>serve.bat</b> 后访问 <b>http://localhost:8792</b>；在线版不受影响。';
      grid.innerHTML = '';
      return;
    }
  }
  renderCatChips(); renderPlatOptions(); loadViewForType(); apply();
});

/* ---------- 分类 chips（按当前类型统计） ---------- */
function renderCatChips() {
  const rows = rowsOf(state.type);
  const tally = {};
  for (const r of rows) tally[r[13]] = (tally[r[13]] || 0) + 1;
  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const chips = [['', rows.length], ...entries];
  $('#catChips').innerHTML = chips.map(([c, n]) =>
    \`<span class="chip\${c === state.cat ? ' on' : ''}" data-cat="\${c}">\${c || '全部'} <span class="n">\${n.toLocaleString()}</span></span>\`).join('');
}
$('#catChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip'); if (!chip) return;
  document.querySelectorAll('#catChips .chip').forEach((c) => c.classList.toggle('on', c === chip));
  state.cat = chip.dataset.cat; apply();
});

/* ---------- 平台选项（按当前类型统计） ---------- */
function renderPlatOptions() {
  const rows = rowsOf(state.type);
  const tally = {};
  for (const r of rows) { const p = r[5]; if (p) tally[p] = (tally[p] || 0) + 1; }
  const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  $('#plat').innerHTML = '<option value="">平台：全部</option>' + entries.map(([p, n]) => \`<option value="\${p}">\${p} (\${n.toLocaleString()})</option>\`).join('');
}
{ // 年代选项固定
  const decades = DECADES.slice(1).reverse();
  $('#decade').innerHTML = '<option value="">年代：全部</option>' + decades.map((d) => \`<option value="\${d}">\${d === '未知' ? '未知' : d.slice(0, -1) + ' 年代'}</option>\`).join('');
}

/* ---------- 筛选 / 排序 ---------- */
let qNormCache = '';
function rowMatch(r) {
  if (!state.nsfw && r[12]) return false;
  if (state.cat && r[13] !== state.cat) return false;
  if (state.plat && r[5] !== state.plat) return false;
  if (state.decade) { if (!r[22]) r[22] = decadeOf(r[4]); if (r[22] !== state.decade) return false; }
  if (state.score && (r[6] || 0) < +state.score) return false;
  if (state.q) {
    if (r[21] === undefined) r[21] = norm(r[2] + ' ' + r[3] + ' ' + r[14] + ' ' + r[17] + ' ' + r[18] + ' ' + r[4]);
    if (!r[21].includes(qNormCache)) return false;
  }
  return true;
}
const SORTS = {
  rank: (a, b) => (a[7] > 0 ? a[7] : 1e9) - (b[7] > 0 ? b[7] : 1e9),
  score: (a, b) => (b[6] || 0) - (a[6] || 0) || b[8] - a[8],
  ratings: (a, b) => b[8] - a[8],
  fav: (a, b) => (b[9] + b[10]) - (a[9] + a[10]),
  date: (a, b) => (b[4] || '').localeCompare(a[4] || ''),
  dateAsc: (a, b) => (a[4] || '9999').localeCompare(b[4] || '9999'),
};
function apply() {
  const rows = rowsOf(state.type);
  if (!rows) return;
  qNormCache = norm(state.q);
  filtered = rows.filter(rowMatch).sort(SORTS[state.sort]);
  shown = 0;
  grid.innerHTML = '';
  emptyEl.style.display = filtered.length ? 'none' : 'block';
  stat.textContent = filtered.length === rows.length
    ? TYPE_LABEL[state.type] + ' ' + rows.length.toLocaleString() + ' 条'
    : '命中 ' + filtered.length.toLocaleString() + ' / ' + rows.length.toLocaleString() + ' 条';
  loadMore();
}

/* ---------- 渲染 ---------- */
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function row2obj(r) {
  return { id: r[0], type: r[1], name: r[2], nameCn: r[3], date: r[4], platform: r[5], score: r[6], rank: r[7],
    ratings: r[8], wish: r[9], done: r[10], doing: r[11], nsfw: !!r[12], category: r[13],
    tags: split(r[14]), tagCounts: split(r[15]).map(Number), summary: r[16], aliases: split(r[17]), meta: r[18] || '' };
}
function cardHTML(r) {
  return view === 'list' ? lrowHTML(r) : gridCardHTML(r);
}
function gridCardHTML(r) {
  const it = row2obj(r);
  const isMusic = it.type === 'music';
  let cover;
  if (it.nsfw && !state.nsfw) cover = '<div class="nsfw-cover">R18 · 隐藏</div>';
  else if (isMusic) cover = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--fg3);font-size:38px">♪</div>';
  else cover = \`<img loading="lazy" referrerpolicy="no-referrer" src="\${imgURL(it.id)}" alt="" onerror="onCoverError(this,\${it.id})">\`;
  return \`<div class="card" data-id="\${it.id}">
    <div class="cover">\${cover}<span class="score">\${it.score ? it.score : '—'}</span></div>
    <div class="info">
      <div class="t-cn">\${esc(it.nameCn || it.name)}</div>
      <div class="t-org">\${esc(it.nameCn && it.name !== it.nameCn ? it.name : '')}</div>
      <div class="badges"><span class="cat">\${it.category}</span><span>\${it.date ? it.date.slice(0, 4) : '—'}</span>\${it.platform ? '<span>' + esc(it.platform) + '</span>' : ''}</div>
      <div class="tags">\${it.tags.slice(0, 3).map(esc).join(' · ')}</div>
    </div>
  </div>\`;
}
function lrowHTML(r) {
  const it = row2obj(r);
  const isMusic = it.type === 'music';
  const cov = it.nsfw && !state.nsfw
    ? '<div class="l-cov ph">R18</div>'
    : isMusic
      ? '<div class="l-cov ph">♪</div>'
      : \`<img class="l-cov" loading="lazy" referrerpolicy="no-referrer" src="\${imgURL(it.id)}" alt="" onerror="onCoverError(this,\${it.id})">\`;
  return \`<div class="lrow" data-id="\${it.id}">
    \${cov}
    <span class="l-score">\${it.score ? it.score : '—'}</span>
    <div class="l-names"><div class="l-cn">\${esc(it.nameCn || it.name)}</div><div class="l-org">\${esc(it.nameCn && it.name !== it.nameCn ? it.name : '')}</div></div>
    <div class="l-meta"><span class="l-cat">\${it.category}</span><span class="l-year">\${it.date ? it.date.slice(0, 4) : '—'}</span>\${it.platform ? '<span class="l-plat">' + esc(it.platform) + '</span>' : ''}<span class="l-tags">\${it.tags.slice(0, 3).map(esc).join(' · ')}</span></div>
  </div>\`;
}
/* ---------- 显示模式：缩略图 / 列表（按类型记忆，音乐默认列表） ---------- */
const VIEW_KEY = (t) => 'catalog-view:' + t;
const defaultView = (t) => (t === 'music' ? 'list' : 'grid');
let view = 'grid';
function loadViewForType() {
  view = localStorage.getItem(VIEW_KEY(state.type)) || defaultView(state.type);
  $('#grid').classList.toggle('list', view === 'list');
  $('#viewGrid').classList.toggle('on', view === 'grid');
  $('#viewList').classList.toggle('on', view === 'list');
}
function setView(v) {
  view = v;
  localStorage.setItem(VIEW_KEY(state.type), v);
  loadViewForType();
  apply();
}
$('#viewGrid').addEventListener('click', () => { if (view !== 'grid') setView('grid'); });
$('#viewList').addEventListener('click', () => { if (view !== 'list') setView('list'); });
function loadMore() {
  const frag = document.createDocumentFragment();
  const next = Math.min(shown + BATCH, filtered.length);
  for (let i = shown; i < next; i++) {
    const div = document.createElement('div');
    div.innerHTML = cardHTML(filtered[i]);
    frag.appendChild(div.firstChild);
  }
  shown = next;
  grid.appendChild(frag);
  sentinel.textContent = shown < filtered.length ? '滚动加载更多…' : (filtered.length ? '—— 到底了 ——' : '');
}
new IntersectionObserver((es) => { if (es[0].isIntersecting && shown < filtered.length) loadMore(); }).observe(sentinel);

/* ---------- 详情弹窗 ---------- */
function openModal(r) {
  const it = row2obj(r);
  $('#mCn').textContent = it.nameCn || it.name;
  $('#mOrg').textContent = it.nameCn && it.name !== it.nameCn ? it.name : '';
  const img = $('#mImg');
  img.style.display = it.nsfw && !state.nsfw ? 'none' : 'block';
  img.onerror = () => onCoverError(img, it.id);
  img.src = it.nsfw && !state.nsfw ? '' : imgLarge(it.id);
  const facts = [
    \`<span>⭐ <b>\${it.score || '—'}</b> / 10</span>\`,
    \`<span>排名 \${it.rank || '—'}</span>\`,
    \`<span>\${it.ratings.toLocaleString()} 人评分</span>\`,
    it.platform ? \`<span>\${esc(it.platform)}</span>\` : '',
    \`<span>\${it.date || '日期未知'}</span>\`,
    \`<span>想看 \${it.wish.toLocaleString()} · 看过 \${it.done.toLocaleString()} · 在看 \${it.doing.toLocaleString()}</span>\`,
  ];
  if (it.type === 'music' && it.meta) {
    const labels = ['艺术家', '作曲', '作词'];
    it.meta.split('|').forEach((v, i) => { if (v) facts.push(\`<span>\${labels[i]}：\${esc(v)}</span>\`); });
  }
  $('#mFacts').innerHTML = facts.join('');
  $('#mTags').innerHTML = it.tags.map((t, i) => \`<span class="chip" data-tag="\${esc(t)}">\${esc(t)} <span class="n">\${it.tagCounts[i]}</span></span>\`).join('');
  $('#mSum').textContent = it.summary || '（无简介，可在 bangumi.tv 查看完整信息）';
  const musicTitle = it.nameCn || it.name;
  $('#mLink').href = 'https://bgm.tv/subject/' + it.id;
  $('#mLyric').style.display = it.type === 'music' ? 'inline' : 'none';
  $('#mLyric').href = 'https://music.163.com/#/search/m/?s=' + encodeURIComponent(musicTitle) + '&type=1';
  $('#mLyric').textContent = '歌词搜索（网易云音乐）↗';
  $('#mask').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() { $('#mask').classList.remove('open'); document.body.style.overflow = ''; }

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.card,.lrow');
  if (!card) return;
  const row = rowsOf(state.type).find((x) => x[0] === +card.dataset.id);
  if (row) openModal(row);
});
$('#mTags').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-tag]');
  if (!chip) return;
  closeModal();
  $('#q').value = state.q = chip.dataset.tag;
  apply();
});
$('#mask').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
$('#mClose').addEventListener('click', closeModal);

/* ---------- 控件 ---------- */
let deb;
$('#q').addEventListener('input', (e) => { clearTimeout(deb); deb = setTimeout(() => { state.q = e.target.value.trim(); apply(); }, 150); });
for (const [id, key] of [['plat', 'plat'], ['decade', 'decade'], ['scoreGte', 'score'], ['sort', 'sort']]) {
  $('#' + id).addEventListener('change', (e) => { state[key] = e.target.value; apply(); });
}
$('#lucky').addEventListener('click', () => { if (filtered.length) openModal(filtered[Math.floor(Math.random() * filtered.length)]); });
const savedNsfw = localStorage.getItem('catalog-nsfw') === '1';
function setNsfw(v) {
  state.nsfw = v;
  localStorage.setItem('catalog-nsfw', v ? '1' : '0');
  $('#nsfwToggle').textContent = 'NSFW：' + (v ? '显示' : '隐藏');
  $('#nsfwToggle').classList.toggle('primary', v);
  apply();
}
$('#nsfwToggle').addEventListener('click', () => setNsfw(!state.nsfw));
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== $('#q')) { e.preventDefault(); $('#q').focus(); }
  if (e.key === 'Escape') closeModal();
});

/* ---------- 启动 ---------- */
window.addEventListener('error', (e) => {
  const b = $('#banner');
  if (b) { b.style.display = 'block'; b.textContent = '页面脚本错误：' + e.message + ' @ ' + (e.filename || '') + ':' + e.lineno; }
});
renderCatChips();
renderPlatOptions();
loadViewForType();
setNsfw(savedNsfw);
</script>
</body>
</html>
`;

const out = path.join(ROOT, 'index.html');
fs.writeFileSync(out, html, 'utf8');
console.log('wrote ' + out + ' (' + (fs.statSync(out).size / 1048576).toFixed(1) + ' MB)');
