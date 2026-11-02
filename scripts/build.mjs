#!/usr/bin/env node
/**
 * anime-catalog build script (v2 全类型)
 * 用法: node scripts/build.mjs <extracted-subject.jsonlines>
 *
 * 输入: bangumi/Archive dump 解压出的 subject.jsonlines（每行一个 JSON 条目，~70 万条）
 * 输出:
 *   data/anime.json  动画全量 31,258 条（行式紧凑数组，含简介/别名）
 *   data/book.json   书籍·漫画 422,971（简介仅 ratings>=SUM_MIN）
 *   data/music.json  音乐 101,230
 *   data/game.json   游戏 117,881
 *   data/real.json   三次元 26,768
 *   data/meta.json   各类型计数
 *
 * 行格式（数组，节省内存；页面上位解析）:
 * [0]id [1]type [2]name [3]nameCn [4]date [5]platform [6]score(0=无) [7]rank(0=未排名)
 * [8]ratings [9]wish [10]done [11]doing [12]nsfw(0/1) [13]category
 * [14]tags('|') [15]tagCounts('|') [16]summary [17]aliases('|') [18]musicMeta(艺术家|作曲|作词，仅音乐)
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

const SUM_MIN_RATINGS = 30;   // 非动画类型：评分人数达到该值才收录简介
const MAX_TAGS = 12;
const TYPE_NAMES = { 1: 'book', 2: 'anime', 3: 'music', 4: 'game', 6: 'real' };

/* ---------------- 标签 → 分类映射（bgm.tv 跨类型高频标签） ---------------- */
/* 音乐专用分类放最前（音乐类型标签多为作品/人名，优先锚定类型词） */
const CATEGORY_MAP = [
  ['VOCALOID', ['Vocaloid', 'VOCALOID', 'vocaloid', 'V家', 'v家', '初音ミク', '初音未来', '镜音', '巡音', 'megpoid', 'GUMI']],
  ['原声·OST', ['OST', 'サントラ', 'サウンドトラック', '原声集', '原声带', 'soundtrack', '游戏原声', '音乐原声', 'オリジナルサウンド']],
  ['广播剧·音声', ['ドラマCD', '广播剧', '音声', 'ASMR', 'Drama CD', '广播剧CD']],
  ['角色歌·单曲', ['角色歌', 'キャラソン', '单曲', 'シングル', '印象曲', '主题歌', '片头曲', '片尾曲', '插曲', '印象专辑']],
  ['演唱会·Live', ['演唱会', 'ライブ', '感謝祭', '音乐会', 'LIVE', 'Live']],
  ['同人音乐', ['同人音乐', '同人音声', 'doujin music']],
  ['热血战斗', ['热血', '战斗', '动作', '格斗', '决斗', '超能力', '剑戟', '武力']],
  ['科幻', ['科幻', 'SF', '赛博朋克', '太空', '宇宙', '时间旅行', '末世', '人工智能', '机器人', '机甲', '高达', '机战', '大机器人', '军事']],
  ['奇幻', ['奇幻', '魔幻', '魔法', '异世界', '魔法少女', '童话', '神话', '妖怪', '转生', '龙', '骑士与魔法', '西式奇幻', '冒险']],
  ['悬疑推理', ['悬疑', '推理', '侦探', '解谜', '本格', '社会派', '犯罪', '心理', '智斗', '博弈']],
  ['恐怖惊悚', ['恐怖', '惊悚', '怪谈', '克苏鲁', '猎奇', '灵异', '丧尸']],
  ['恋爱', ['恋爱', '爱情', '恋爱喜剧', '后宫', '纯爱', '狗粮', '逆后宫', '三角关系', '青梅竹马']],
  ['治愈', ['治愈', '治愈系', '温馨', '暖心', '疗愈']],
  ['校园', ['校园', '学校', '青春', '学生', '高中', '社团']],
  ['搞笑', ['搞笑', '喜剧', '吐槽', '沙雕', '欢乐向', '恶搞']],
  ['运动', ['运动', '体育', '竞技', '足球', '篮球', '棒球', '排球', '网球', '跑步', '围棋', '将棋', '棋类', '赛车', '竞速', '花式滑冰', '体育竞技']],
  ['音乐偶像', ['音乐', '偶像', '乐队', '歌姬', '声优', '歌手', '演出', '虚拟偶像', '偶像企划', 'OST', '原声集', '角色歌', '印象曲', '广播剧', '同人音乐']],
  ['历史', ['历史', '战国', '幕末', '三国', '明治', '大正', '时代剧', '古装']],
  ['美食', ['美食', '料理', '烹饪', '深夜食堂']],
  ['百合', ['百合', 'GL', '女子爱']],
  ['耽美', ['耽美', 'BL', '腐向', '男子爱']],
  ['职场', ['职场', '工作', '劳动', '职业', '公司', '业界']],
  ['动物', ['动物', '拟人', '兽耳', '猫', '猫咪', '野生动物', '恐龙']],
  ['国漫', ['国产', '国漫', '国创', '中国动画', '中国制造', '上海美术电影制片厂']],
  ['武侠', ['武侠', '江湖', '金庸', '古龙', '武林']],
  ['Galgame', ['galgame', '美少女游戏', '视觉小说']],
];

/* 俗称别名：官方译名之外的常用叫法（按原名/中文名正则命中），动画常用 */
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
  [/^MONSTER$/, '怪物'],
  [/銀魂/, '银魂'],
  [/進撃の巨人/, '进击的巨人'],
];

/* 平台代码 → 名称（实测 dump：低段码因类型而异） */
const PLATFORM_MAPS = {
  anime: { 0: '其他', 1: 'TV', 2: 'OVA', 3: '剧场版', 5: 'WEB', 2006: '动态漫画' },
  book: { 0: '其他', 1001: '漫画', 1002: '小说', 1003: '画集&CG集', 1004: '其他书籍', 1005: '写真集', 1006: '资料集&Fanbook' },
  music: { 0: '' },
  game: { 0: '其他', 4001: '游戏', 4002: '软件', 4003: '电脑游戏', 4005: '桌面游戏' },
  real: { 0: '其他', 1: '日剧', 2: '欧美剧', 3: '华语剧', 6001: '韩剧', 6002: '电影', 6003: '演唱会·活动', 6004: '综艺·真人秀' },
};

function classify(tags) {
  const scores = new Map();
  for (const t of tags) {
    const name = t.name;
    for (const [cat, keys] of CATEGORY_MAP) {
      if (keys.some((k) => name === k || name.includes(k))) {
        scores.set(cat, (scores.get(cat) || 0) + t.count);
      }
    }
  }
  if (!scores.size) return '其他';
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function decadeBucket(dateStr) {
  const m = /^(\d{4})/.exec(dateStr || '');
  return m ? String(Math.floor(+m[1] / 10) * 10) + 's' : '未知';
}

function cleanSummary(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

/* 音乐 infobox 提取：艺术家|作曲|作词（各取首行，缺省空串） */
function musicMeta(ib) {
  const box = String(ib || '');
  const get = (key) => {
    const m = box.match(new RegExp('^\\|\\s*' + key + '\\s*=\\s*(.*)$', 'm'));
    return m ? m[1].replace(/\s+/g, ' ').trim().slice(0, 100) : '';
  };
  return [get('艺术家'), get('作曲'), get('作词')].join('|');
}

/* ---------------- 主流程 ---------------- */
const input = fs.createReadStream(SRC, { encoding: 'utf8' });
const rl = readline.createInterface({ input, crlfDelay: Infinity });

const buckets = { anime: [], book: [], music: [], game: [], real: [] };
let scanned = 0;

for await (const line of rl) {
  if (!line.trim()) continue;
  scanned++;
  let s;
  try { s = JSON.parse(line); } catch { continue; }
  const tname = TYPE_NAMES[s.type];
  if (!tname) continue;

  const sd = s.score_details || {};
  let ratings = 0;
  for (const k in sd) ratings += sd[k] || 0;

  const rawTags = (s.tags || [])
    .filter((t) => t && t.name && t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TAGS);

  const fav = s.favorite || {};
  const keepSummary = tname === 'anime' ? true : ratings >= SUM_MIN_RATINGS;
  const aliases = tname === 'anime'
    ? ALIAS_RULES.filter(([re]) => re.test(s.name || '') || re.test(s.name_cn || '')).map(([, a]) => a)
    : [];

  buckets[tname].push([
    s.id,
    tname,
    s.name || '',
    s.name_cn || '',
    s.date || '',
    PLATFORM_MAPS[tname][s.platform] ?? (s.platform ? 'P' + s.platform : ''),
    s.score ?? 0,
    s.rank ?? 0,
    ratings,
    fav.wish ?? 0,
    fav.done ?? 0,
    fav.doing ?? 0,
    s.nsfw ? 1 : 0,
    classify(rawTags),
    rawTags.map((t) => t.name).join('|'),
    rawTags.map((t) => t.count).join('|'),
    keepSummary ? cleanSummary(s.summary).slice(0, 400) : '',
    aliases.join('|'),
    tname === 'music' ? musicMeta(s.infobox) : '',
  ]);
}

console.log(`scanned ${scanned} subjects`);

const outDir = path.join(ROOT, 'data');
fs.mkdirSync(outDir, { recursive: true });
const meta = {};
for (const [tname, rows] of Object.entries(buckets)) {
  rows.sort((a, b) => (b[6] ?? 0) - (a[6] ?? 0) || (b[8] - a[8]));
  const file = path.join(outDir, `${tname}.json`);
  const payload = JSON.stringify({ v: 2, type: tname, rows });
  fs.writeFileSync(file, payload, 'utf8');
  meta[tname] = rows.length;
  console.log(`${tname}: ${rows.length} rows → ${path.basename(file)} (${(fs.statSync(file).size / 1048576).toFixed(1)} MB)`);
}
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta), 'utf8');

/* 旧版 catalog.json 已被 anime.json 取代 */
const oldCat = path.join(outDir, 'catalog.json');
if (fs.existsSync(oldCat)) { fs.rmSync(oldCat); console.log('removed legacy data/catalog.json'); }
