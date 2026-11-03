# 找番库 · 全类型目录

「不知道看啥」时的 Bangumi 全库检索页：**700,108 条目**全类型收录（动画 / 书籍·漫画 / 音乐 / 游戏 / 三次元），每条含**原名 + 中文名**、分类、评分/排名、热门标签、收藏数，动画另有简介与俗称别名。

> 🌐 **在线浏览**：<https://qyuejinzhao.github.io/anime-catalog/>

## 使用

在线打开 <https://qyuejinzhao.github.io/anime-catalog/>，或本地双击 `serve.bat` 后访问 <http://localhost:8792>。

**对外分享用 [lite.html](https://qyuejinzhao.github.io/anime-catalog/lite.html)（公开精简版）**：NSFW 条目在数据与界面两个层面彻底剔除、无开关，页签计数为 SFW 口径（动画 28,801 / 书籍 41 万 / 音乐 10.1 万 / 游戏 9.2 万 / 三次元 2.7 万），适合直接发链接。主站 index.html 的 NSFW 默认隐藏但保留开关。注意 lite 与主站共用同一批 `data/*.json` 分片（分片文件本身仍含 NSFW 行，仅页面不渲染）。

- **类型 tab**：动画 31,258 / 书籍·漫画 422,971 / 音乐 101,230 / 游戏 117,881 / 三次元 26,768（后四类按需懒加载分片）
- **显示模式**：⬛ 缩略图 / ☰ 列表 可切换并按类型记忆；**音乐默认列表模式且不显示封面**（bgm 音乐条目封面无意义），其余类型默认缩略图
- **音乐**：专用分类（原声·OST / 角色歌·单曲 / 同人音乐 / VOCALOID / 广播剧·音声 / 演唱会·Live）；详情弹窗显示**艺术家 / 作曲 / 作词**（提取自 infobox，44k+ 条有艺术家），并提供**歌词搜索（网易云音乐）**直链——bgm 数据本身无歌词文本（infobox 覆盖率仅 0.6%），故不做站内歌词
- **动画双击即用**：动画分片内联在 `index.html` 里，`file://` 直接打开可完整浏览动画；其余类型需本地服务器或在线版（浏览器禁止 file:// fetch）
- **搜索**：原名 / 中文名 / 标签 / 年份 模糊匹配；动画支持俗称（电锯人、花牌情缘、未闻花名、全职猎人、叛逆的鲁路修…）
- **分类 chips**：20 个分类（热血战斗 / 科幻 / 奇幻 / 恋爱 / 国漫 / 武侠 / Galgame…）按标签加权自动归类，随类型切换重新统计
- **地区筛选**：日本 / 华语 / 欧美 / 韩国 / 法国 / 未知，按类型带计数。推断优先级：显式地区标签（国产/欧美/韩漫/webtoon…）→ 三次元平台编码（日剧/欧美剧/华语剧/韩剧）→ 原名假名/谚文启发式；「中国风」等风格标签已排除不算来源。覆盖率：动画 86% / 书籍 84% / 三次元 93% / 音乐 60% / 游戏 41%（罗马字命名的西式作品归入「未知」）
- **平台筛选**：随类型变化——动画（TV/剧场版/OVA/WEB）、书籍（漫画/小说/画集&CG集/写真集/Fanbook）、游戏（游戏/软件/电脑游戏/桌面游戏）、三次元（日剧/欧美剧/华语剧/韩剧/电影/演唱会/综艺）
- **年代 / 评分档 / 排序**：Bangumi 排名、评分、评分人数、热度（想看+看过）、日期
- **🎲 随机一部**：从当前筛选结果随机抽；**标签可点击**追加搜索；**NSFW** 默认隐藏（localStorage 记忆）
- 快捷键：`/` 聚焦搜索，`Esc` 关闭弹窗

数据覆盖校验：anime100 收集的 100 部原作 100% 在库（官方译名差异可用俗称搜到）。

## 仓库结构

```
index.html               # 单文件浏览页（动画分片内联 20MB，其余类型懒加载）
lite.html                # 公开精简版（NSFW 全剔除、无开关，18.6MB）
serve.bat                # 本地静态服务器 :8792（file:// 看非动画类型必备）
data/anime.json          # 动画 31,258 条（含简介/别名）
data/book.json           # 书籍·漫画 422,971 条（60MB）
data/music.json          # 音乐 101,230 条
data/game.json           # 游戏 117,881 条
data/real.json           # 三次元 26,768 条
data/meta.json           # 各类型计数
covers/                  # 动画封面缩略图（6,214 张 SFW，按 subject id 命名）
scripts/build.mjs        # dump → 全类型筛选+分类+别名 → data/*.json（行式紧凑数组）
scripts/page.mjs         # 生成 index.html（动画内联 + meta 注入）
scripts/fetch-covers.mjs # 批量下载动画封面（断点续跑，NSFW 跳过）
```

数据为**行式数组**格式（省内存，70 万条浏览器可流畅筛选）：`[id, type, name, nameCn, date, platform, score, rank, ratings, wish, done, doing, nsfw, category, tags, tagCounts, summary, aliases]`，详见 `scripts/build.mjs` 头注释。

## 数据来源与许可

- 条目数据：[bangumi/Archive](https://github.com/bangumi/Archive) 周度全量 dump（`dump-2026-10-27`，70 万条全类型）。Bangumi 条目数据采用 CC BY-NC-ND，本目录仅作非商用检索用途。
- 封面：`https://api.bgm.tv/v0/subjects/{id}/image` 官方重定向接口；仅动画 SFW 封面打包入库，其余在线按需加载，版权归各版权方。

## 重建

```bash
# 1. 下载最新 dump（bangumi/Archive releases 的 dump-*.zip，约 430MB），只解压 subject.jsonlines
# 2. 全类型筛选 + 分类（→ data/*.json）
node scripts/build.mjs <subject.jsonlines 路径>
# 3. 生成单文件页面（→ index.html；--lite 追加生成公开精简版 lite.html）
node scripts/page.mjs
node scripts/page.mjs --lite
# 4. 批量下载动画封面（断点续跑）
node scripts/fetch-covers.mjs --concurrency 6
```

可调参数在 `scripts/build.mjs` 顶部：`SUM_MIN_RATINGS`（非动画收录简介的评分人数门槛=30）、`CATEGORY_MAP`、`ALIAS_RULES`、`PLATFORM_MAPS`。

## 已知数据口径

- 平台代码按类型各异（实测）：书籍 1001=漫画/1002=小说/1003=画集&CG集/1005=写真集/1006=Fanbook；游戏 4001=游戏/4002=软件/4003=电脑游戏/4005=桌面游戏；三次元 1=日剧/2=欧美剧/3=华语剧/6001=韩剧/6002=电影/6003=演唱会/6004=综艺
- 收藏数字段为 `favorite.done`（看过）；`score_details` 为 1-10 分桶计数需自求和；dump 无封面字段
- `rank=0` 表示未进排名（大量未评分条目），排序时沉底
- 非动画类型评分数 <30 的条目不带简介（省 100MB+ 体积），点「在 bangumi.tv 打开」看全文
