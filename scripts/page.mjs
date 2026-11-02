#!/usr/bin/env node
/**
 * anime-catalog page generator
 * 用法: node scripts/page.mjs
 * 读取 data/catalog.json → 生成 index.html（单文件、JSON 内联、无外部依赖）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));

const json = JSON.stringify(catalog).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, (m) => '\\u' + m.charCodeAt(0).toString(16).padStart(4, '0'));

/* 统计分类与平台分布，供生成筛选 chips */
const catCount = {};
const platCount = {};
const decadeCount = {};
for (const it of catalog.items) {
  catCount[it.category] = (catCount[it.category] || 0) + 1;
  platCount[it.platform] = (platCount[it.platform] || 0) + 1;
  decadeCount[it.decade] = (decadeCount[it.decade] || 0) + 1;
}
const cats = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
const plats = Object.entries(platCount).sort((a, b) => b[1] - a[1]);
const decades = Object.entries(decadeCount).sort((a, b) => (a[0] > b[0] ? -1 : 1));

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>找番库 · 动画目录</title>
<style>
:root{
  --bg:#0f1115; --bg2:#161a22; --card:#1b2029; --line:#2a3140;
  --fg:#e6e9ef; --fg2:#9aa3b2; --fg3:#5c6675;
  --acc:#5b8cff; --acc2:#f5a623; --good:#3fbf7f;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--fg);font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif;line-height:1.5}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:1280px;margin:0 auto;padding:20px 16px 80px}
header h1{font-size:22px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
header h1 small{font-size:12px;color:var(--fg3);font-weight:normal}
.controls{position:sticky;top:0;z-index:20;background:linear-gradient(var(--bg) 88%,transparent);padding:10px 0 14px}
.searchrow{display:flex;gap:8px;flex-wrap:wrap}
#q{flex:1;min-width:220px;background:var(--bg2);border:1px solid var(--line);border-radius:8px;color:var(--fg);padding:9px 14px;font-size:15px;outline:none}
#q:focus{border-color:var(--acc)}
.btn{background:var(--bg2);border:1px solid var(--line);border-radius:8px;color:var(--fg2);padding:8px 14px;cursor:pointer;font-size:14px;white-space:nowrap}
.btn:hover{color:var(--fg);border-color:var(--acc)}
.btn.primary{background:var(--acc);border-color:var(--acc);color:#fff}
select{background:var(--bg2);border:1px solid var(--line);border-radius:8px;color:var(--fg);padding:8px 10px;font-size:14px;cursor:pointer;outline:none}
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
.t-org{font-size:11px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badges{display:flex;gap:5px;flex-wrap:wrap;font-size:11px;color:var(--fg2);margin-top:auto}
.badges span{background:var(--bg2);border-radius:4px;padding:1px 6px}
.badges .cat{color:#bcd0ff}
.tags{font-size:11px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#sentinel{padding:24px;text-align:center;color:var(--fg3)}
.modal-mask{position:fixed;inset:0;background:rgba(5,7,10,.75);display:none;z-index:50;padding:24px;overflow:auto}
.modal-mask.open{display:flex;align-items:flex-start;justify-content:center}
.modal{background:var(--bg2);border:1px solid var(--line);border-radius:14px;max-width:760px;width:100%;overflow:hidden}
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
.m-close{position:absolute;top:14px;right:18px;font-size:26px;color:var(--fg2);cursor:pointer;background:none;border:none}
.hint{color:var(--fg3);font-size:12px;margin-top:8px}
.kbd{background:var(--bg2);border:1px solid var(--line);border-radius:4px;padding:0 5px;font-size:11px}
.empty{padding:60px 0;text-align:center;color:var(--fg3)}
footer{color:var(--fg3);font-size:12px;text-align:center;padding:30px 0 0}
</style>
</head>
<body>
<div class="wrap">
<header>
  <h1>找番库 <small>动画目录 · ${catalog.count} 部 · 数据源 bangumi/Archive（周更全量 dump，≥${catalog.minRatings} 人评分）· 生成于 ${catalog.generatedAt.slice(0, 10)}</small></h1>
</header>
<div class="controls">
  <div class="searchrow">
    <input id="q" type="search" placeholder="搜索：原名 / 中文名 / 标签 / 年份…（按名称、标签模糊匹配）">
    <button class="btn primary" id="lucky" title="从当前筛选结果里随机抽一部">🎲 随机一部</button>
    <button class="btn" id="nsfwToggle" title="默认隐藏 NSFW 条目">NSFW：隐藏</button>
  </div>
  <div class="chips" id="catChips">
    <span class="chip on" data-cat="">全部 <span class="n">${catalog.count}</span></span>
    ${cats.map(([c, n]) => `<span class="chip" data-cat="${c}">${c} <span class="n">${n}</span></span>`).join('')}
  </div>
  <div class="row2">
    <span class="meta" id="stat"></span>
    <select id="plat"><option value="">平台：全部</option>${plats.map(([p, n]) => `<option value="${p}">${p} (${n})</option>`).join('')}</select>
    <select id="decade"><option value="">年代：全部</option>${decades.map(([d, n]) => `<option value="${d}">${d === '未知' ? '未知' : d.slice(0, -1) + ' 年代'} (${n})</option>`).join('')}</select>
    <select id="scoreGte"><option value="">评分：不限</option><option value="9">≥ 9.0</option><option value="8.5">≥ 8.5</option><option value="8">≥ 8.0</option><option value="7">≥ 7.0</option><option value="6">≥ 6.0</option></select>
    <select id="sort">
      <option value="rank">排序：Bangumi 排名</option>
      <option value="score">评分 高→低</option>
      <option value="ratings">评分人数 多→少</option>
      <option value="fav">收藏数 多→少</option>
      <option value="date">日期 新→旧</option>
      <option value="dateAsc">日期 旧→新</option>
    </select>
  </div>
</div>
<div class="grid" id="grid"></div>
<div class="empty" id="empty" style="display:none">没有匹配的条目，试试放宽筛选</div>
<div id="sentinel">加载中…</div>
<footer>数据 © bangumi.tv（CC BY-NC-ND）；页面仅本地检索用 · 点击卡片看详情 · 标签可点击追加搜索 · <span class="kbd">/</span> 聚焦搜索 · <span class="kbd">Esc</span> 关闭</footer>
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
      <div class="m-links"><a id="mLink" target="_blank" rel="noopener">在 bangumi.tv 打开 ↗</a></div>
    </div>
  </div>
</div>
<script id="DATA" type="application/json">${json}</script>
<script>
const DATA = JSON.parse(document.getElementById('DATA').textContent);
const ITEMS = DATA.items;
const $ = (s) => document.querySelector(s);
/* 封面：优先本地 covers/{id}.jpg（NSFW 不入库），失败回退 bangumi 官方 302 重定向接口 */
const imgURL = (id, type) =>
  'covers/' + id + '.jpg';
const imgFallback = (id, type) =>
  'https://api.bgm.tv/v0/subjects/' + id + '/image?type=' + type;
function onCoverError(img, id, type) {
  const fb = imgFallback(id, type);
  if (img.dataset.fb !== '1') {
    img.dataset.fb = '1';
    img.src = fb;
  } else {
    img.style.display = 'none';
  }
}
const grid = $('#grid'), sentinel = $('#sentinel'), emptyEl = $('#empty'), stat = $('#stat');
const state = { q:'', cat:'', plat:'', decade:'', score:'', sort:'rank', nsfw:false };
let filtered = [], shown = 0;
const BATCH = 60;

const norm = (s) => s.toLowerCase().replace(/\\s+/g, '');
function match(it) {
  if (!state.nsfw && it.nsfw) return false;
  if (state.cat && it.category !== state.cat) return false;
  if (state.plat && it.platform !== state.plat) return false;
  if (state.decade && it.decade !== state.decade) return false;
  if (state.score && (it.score ?? 0) < +state.score) return false;
  if (state.q) {
    const q = norm(state.q);
    if (!norm(it.name + ' ' + it.nameCn + ' ' + (it.aliases || []).join(' ') + ' ' + it.tags.join(' ') + ' ' + it.date).includes(q)) return false;
  }
  return true;
}
const SORTS = {
  rank: (a, b) => (a.rank > 0 ? a.rank : 1e9) - (b.rank > 0 ? b.rank : 1e9),
  score: (a, b) => (b.score ?? 0) - (a.score ?? 0) || b.ratings - a.ratings,
  ratings: (a, b) => b.ratings - a.ratings,
  fav: (a, b) => ((b.favorite?.wish||0)+(b.favorite?.done||0)) - ((a.favorite?.wish||0)+(a.favorite?.done||0)),
  date: (a, b) => (b.date || '').localeCompare(a.date || ''),
  dateAsc: (a, b) => (a.date || '9999').localeCompare(b.date || '9999'),
};
function apply() {
  filtered = ITEMS.filter(match).sort(SORTS[state.sort]);
  shown = 0;
  grid.innerHTML = '';
  emptyEl.style.display = filtered.length ? 'none' : 'block';
  stat.textContent = filtered.length === ITEMS.length ? \`全部 \${ITEMS.length} 部\` : \`命中 \${filtered.length} / \${ITEMS.length} 部\`;
  loadMore();
}
function scoreClass(s){ return (s ?? 0) >= 7 ? '' : 'norank'; }
function cardHTML(it) {
  const cover = it.nsfw && !state.nsfw ? '' : \`<img loading="lazy" referrerpolicy="no-referrer" src="\${imgURL(it.id,'small')}" alt="" onerror="onCoverError(this,\${it.id},'small')">\`;
  return \`<div class="card" data-id="\${it.id}">
    <div class="cover">\${it.nsfw && !state.nsfw ? '<div class="nsfw-cover">R18 · 隐藏</div>' : cover}<span class="score">\${it.score ?? '—'}</span></div>
    <div class="info">
      <div class="t-cn">\${esc(it.nameCn || it.name)}</div>
      <div class="t-org">\${esc(it.nameCn && it.name !== it.nameCn ? it.name : '')}</div>
      <div class="badges"><span class="cat">\${it.category}</span><span>\${it.date ? it.date.slice(0,4) : '—'}</span><span>\${it.platform}</span></div>
      <div class="tags">\${it.tags.slice(0,3).map(esc).join(' · ')}</div>
    </div>
  </div>\`;
}
function esc(s){ return String(s).replace(/[&<>"]/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
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

function openModal(it) {
  $('#mCn').textContent = it.nameCn || it.name;
  $('#mOrg').textContent = it.name !== (it.nameCn || it.name) ? it.name : '';
  const img = $('#mImg');
  img.style.display = it.nsfw && !state.nsfw ? 'none' : 'block';
  img.onerror = () => onCoverError(img, it.id, 'medium');
  img.src = it.nsfw && !state.nsfw ? '' : imgURL(it.id, 'medium');
  $('#mFacts').innerHTML = [
    \`<span>⭐ <b>\${it.score ?? '—'}</b> / 10</span>\`,
    \`<span>排名 \${it.rank ?? '—'}</span>\`,
    \`<span>\${it.ratings} 人评分</span>\`,
    \`<span>\${it.platform}</span>\`,
    \`<span>\${it.date || '日期未知'}</span>\`,
    \`<span>想看 \${it.favorite?.wish ?? 0} · 看过 \${it.favorite?.done ?? 0} · 在看 \${it.favorite?.doing ?? 0}</span>\`,
  ].join('');
  $('#mTags').innerHTML = it.tags.map((t, i) => \`<span class="chip" data-tag="\${esc(t)}">\${esc(t)} <span class="n">\${it.tagCounts[i]}</span></span>\`).join('');
  $('#mSum').textContent = it.summary || '（无简介）';
  $('#mLink').href = 'https://bgm.tv/subject/' + it.id;
  $('#mask').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(){ $('#mask').classList.remove('open'); document.body.style.overflow = ''; }

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const it = ITEMS.find((x) => x.id === +card.dataset.id);
  if (it) openModal(it);
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
$('#catChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip'); if (!chip) return;
  document.querySelectorAll('#catChips .chip').forEach((c) => c.classList.toggle('on', c === chip));
  state.cat = chip.dataset.cat; apply();
});
let deb;
$('#q').addEventListener('input', (e) => { clearTimeout(deb); deb = setTimeout(() => { state.q = e.target.value.trim(); apply(); }, 120); });
for (const [id, key] of [['plat','plat'],['decade','decade'],['scoreGte','score'],['sort','sort']]) {
  $('#' + id).addEventListener('change', (e) => { state[key] = e.target.value; apply(); });
}
$('#lucky').addEventListener('click', () => {
  if (!filtered.length) return;
  openModal(filtered[Math.floor(Math.random() * filtered.length)]);
});
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
setNsfw(savedNsfw);
</script>
</body>
</html>
`;

const out = path.join(ROOT, 'index.html');
fs.writeFileSync(out, html, 'utf8');
console.log(`wrote ${out} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
