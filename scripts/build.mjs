#!/usr/bin/env node
/**
 * anime-catalog build script
 * 用法: node scripts/build.mjs <extracted-subject.jsonlines> [--max N]
 *
 * 输入: bangumi/Archive dump 解压出的 subject.jsonlines（每行一个 JSON 条目）
 * 输出: data/catalog.json + index.html（单文件、JSON 内联）
 *
 * 筛选规则:
 *   - type === 2 (动画)
 *   - score_details.total >= MIN_RATINGS (有足够人数评分)
 *   - 默认保留 nsfw 条目（由页面开关控制显示）
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error('用法: node scripts/build.mjs <subject.jsonlines 路径>');
  process.exit(1);
}

const MIN_RATINGS = 200;      // 评分人数下限
const MAX_SUMMARY = 400;      // 简介截断长度（字符）
const MAX_TAGS = 12;          // 每条保留的标签数

/* ---------------- 标签 → 分类映射（bgm.tv 高频标签） ---------------- */
const CATEGORY_MAP = [
  ['热血战斗', ['热血', '战斗', '动作', '格斗', '决斗', '热血战斗', '超能力', '武力', '剑戟']],
  ['科幻', ['科幻', 'SF', '赛博朋克', '太空', '宇宙', '时间旅行', '末世', '人工智能', '机器人', '机甲', '高达', '机战', '大机器人', '军事']],
  ['奇幻', ['奇幻', '魔幻', '魔法', '异世界', '魔法少女', '童话', '神话', '妖怪', '转生', '龙', '骑士与魔法', '西式奇幻', '冒险']],
  ['悬疑推理', ['悬疑', '推理', '侦探', '解谜', '本格', '社会派', '犯罪', '心理', '智斗', '博弈']],
  ['恐怖惊悚', ['恐怖', '惊悚', '怪谈', '克苏鲁', '猎奇', '灵异']],
  ['恋爱', ['恋爱', '爱情', '恋爱喜剧', '后宫', '纯爱', '狗粮', '逆后宫', '三角关系', '青梅竹马']],
  ['日常', ['日常', '搞笑日常', '生活', '治愈日常']],
  ['治愈', ['治愈', '治愈系', '温馨', '暖心', '疗愈', '低龄向', '童话故事']],
  ['校园', ['校园', '学校', '青春', '学生', '高中', '社团']],
  ['搞笑', ['搞笑', '喜剧', '吐槽', '沙雕', '欢乐向', '恶搞', '搞笑喜剧']],
  ['运动', ['运动', '体育', '竞技', '足球', '篮球', '棒球', '排球', '网球', '跑步', '围棋', '将棋', '棋类', '赛车', '竞速', '花式滑冰']],
  ['音乐偶像', ['音乐', '偶像', '乐队', '歌姬', '声优', '歌手', '演出', '虚拟偶像', '偶像企划']],
  ['历史', ['历史', '战国', '幕末', '三国', '明治', '大正', '时代剧', '古装']],
  ['美食', ['美食', '料理', '烹饪', '深夜食堂']],
  ['百合', ['百合', 'GL', '女子爱']],
  ['耽美', ['耽美', 'BL', '腐向', '男子爱']],
  ['职场', ['职场', '工作', '劳动', '职业', '公司', '业界']],
  ['动物', ['动物', '拟人', '兽耳', '猫', '猫咪', '野生动物', '恐龙']],
  ['国漫', ['国产', '国漫', '国创', '中国动画', '中国制造', '上海美术电影制片厂']],
];

/* 俗称别名：官方译名之外的常用叫法，追加进搜索索引（按原名/中文名正则命中） */
const ALIAS_RULES = [
  [/チェンソーマン/, '电锯人'],
  [/HUNTER×HUNTER/i, '全职猎人'],
  [/ちはやふる/, '花牌情缘'],
  [/あの日見た花/, '未闻花名'],
  [/リズと青い鳥/, '利兹与青鸟'],
  [/少女☆歌劇|レヴュースタァライト/, '少女歌剧'],
  [/Re:ゼロから始める異世界生活/, '从零开始的异世界生活'],
  [/オーバーロード/, '不死者之王 Overlord'],
  [/DEVILMAN/i, '恶魔人'],
  [/反逆のルルーシュ|コードギアス/, '叛逆的鲁路修 鲁鲁修'],
  [/モンター|^MONSTER$/, '怪物'],
  [/銀魂/, '银魂'],
  [/進撃の巨人/, '进击的巨人'],
];

/* 平台：dump 里 platform 是数字代码（实测 type=2：1=TV 2=OVA 3=剧场版 5=WEB 0=其他 2006=动态漫画） */
const PLATFORM_MAP = { 0: '其他', 1: 'TV', 2: 'OVA', 3: '剧场版', 5: 'WEB', 2006: '动态漫画' };
function normPlatform(p) {
  return PLATFORM_MAP[p] || ('P' + p);
}

/* 分类打分：命中标签按 count 加权，取最高分类 */
function classify(tags) {
  const scores = new Map();
  for (const { name, count } of tags) {
    for (const [cat, keys] of CATEGORY_MAP) {
      if (keys.some((k) => name === k || name.includes(k))) {
        scores.set(cat, (scores.get(cat) || 0) + count);
      }
    }
  }
  if (!scores.size) return '其他';
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function decade(dateStr) {
  const m = /^(\d{4})/.exec(dateStr || '');
  if (!m) return '未知';
  return String(Math.floor(+m[1] / 10) * 10) + 's';
}

function cleanSummary(s) {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, MAX_SUMMARY);
}

/* ---------------- 主流程 ---------------- */
const input = fs.createReadStream(SRC, { encoding: 'utf8' });
const rl = readline.createInterface({ input, crlfDelay: Infinity });

const kept = [];
let scanned = 0;
let anime = 0;

for await (const line of rl) {
  if (!line.trim()) continue;
  scanned++;
  let s;
  try { s = JSON.parse(line); } catch { continue; }
  if (s.type !== 2) continue;
  anime++;
  const sd = s.score_details || {};
  let total = 0;
  for (const k in sd) total += sd[k] || 0;
  if (total < MIN_RATINGS) continue;

  const rawTags = (s.tags || [])
    .filter((t) => t && t.name && t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TAGS);

  kept.push({
    id: s.id,
    name: s.name,
    nameCn: s.name_cn || '',
    date: s.date || '',
    platform: normPlatform(s.platform),
    score: s.score ?? null,
    rank: s.rank ?? null,
    ratings: total,
    favorite: s.favorite || null,
    nsfw: !!s.nsfw,
    category: classify(rawTags),
    decade: decade(s.date),
    aliases: ALIAS_RULES.filter(([re]) => re.test(s.name || '') || re.test(s.name_cn || '')).map(([, a]) => a),
    tags: rawTags.map((t) => t.name),
    tagCounts: rawTags.map((t) => t.count),
    summary: cleanSummary(s.summary),
  });
}

console.log(`scanned ${scanned} subjects, ${anime} anime, kept ${kept.length} (>=${MIN_RATINGS} ratings)`);

kept.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || (b.ratings - a.ratings));

const outDir = path.join(ROOT, 'data');
fs.mkdirSync(outDir, { recursive: true });
const catalogPath = path.join(outDir, 'catalog.json');
fs.writeFileSync(catalogPath, JSON.stringify({ generatedAt: new Date().toISOString(), minRatings: MIN_RATINGS, count: kept.length, items: kept }), 'utf8');
console.log(`wrote ${catalogPath} (${(fs.statSync(catalogPath).size / 1048576).toFixed(1)} MB)`);
