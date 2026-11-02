# 找番库 · 动画目录

「不知道看啥动画」时的检索页：**6,870 部**动画（Bangumi 上 ≥200 人评分者），每部含**原名 + 中文名**、20 个分类、评分/排名、热门标签、简介、收藏数与封面。

> 🌐 **在线浏览**：<https://qyuejinzhao.github.io/anime-catalog/>

`index.html` 单文件、无外部依赖，本地双击同样可用（6,214 张 SFW 封面已打包在 `covers/`，离线可看；NSFW 与缺失封面自动回退 bangumi 远程图，需联网）。

## 使用

在线打开 <https://qyuejinzhao.github.io/anime-catalog/> 或双击本地 `index.html`：

- **搜索**：原名 / 中文名 / 标签 / 年份 模糊匹配；支持常见俗称（电锯人、花牌情缘、未闻花名、全职猎人、叛逆的鲁路修…内置别名通道）
- **分类 chips**：恋爱 / 奇幻 / 搞笑 / 科幻 / 热血战斗 / 国漫 / 百合 / 治愈 / 校园 / 音乐偶像 / 悬疑推理 / 运动 / 日常 / 耽美 / 恐怖惊悚 / 动物 / 历史 / 美食 / 职场 / 其他（按标签加权自动归类）
- **筛选**：平台（TV / 剧场版 / OVA / WEB）、年代、评分档、排序（Bangumi 排名 / 评分 / 评分人数 / 收藏数 / 日期）
- **🎲 随机一部**：从当前筛选结果里随机抽一部，选择困难时用
- **标签可点击**：详情弹窗里点标签即按该标签搜索
- **NSFW**：默认隐藏，右上角开关切换（记忆到 localStorage）
- 快捷键：`/` 聚焦搜索，`Esc` 关闭弹窗

数据覆盖校验：anime100 收集的 100 部原作 100% 在库（部分为官方译名差异，如 链锯人/猎人/歌牌情缘，均可用俗称搜到）。

## 仓库结构

```
index.html               # 单文件浏览页（原生 JS，数据内联）
data/catalog.json        # 全量元数据（6870 条：分类/标签/评分/排名/收藏数）
covers/                  # 封面缩略图（6214 张 SFW，按 subject id 命名）
scripts/build.mjs        # dump → 筛选 + 分类 + 别名 → data/catalog.json
scripts/page.mjs         # data/catalog.json → index.html
scripts/fetch-covers.mjs # 批量下载封面（断点续跑，NSFW 跳过）
```

## 数据来源与许可

- 条目数据：[bangumi/Archive](https://github.com/bangumi/Archive) 周度全量 dump（`dump-2026-10-27`，`subject.jsonlines` 筛选 `type=2` 且评分人数 ≥200）。Bangumi 条目数据采用 CC BY-NC-ND，本目录仅作非商用检索用途。
- 封面：来自 `https://api.bgm.tv/v0/subjects/{id}/image` 官方重定向接口（small 尺寸），版权归各版权方所有；NSFW 封面不入库，在线按需回退加载。

## 重建

```bash
# 1. 下载最新 dump（releases 页面的 dump-*.zip，约 400MB），只解压 subject.jsonlines
# 2. 筛选 + 归类
node scripts/build.mjs <subject.jsonlines 路径>   # → data/catalog.json
# 3. 生成单文件页面
node scripts/page.mjs                             # → index.html
# 4. 批量下载封面（断点续跑）
node scripts/fetch-covers.mjs --concurrency 6     # → covers/{id}.jpg
```

阈值等参数在 `scripts/build.mjs` 顶部（`MIN_RATINGS`、分类映射 `CATEGORY_MAP`、俗称别名 `ALIAS_RULES`）。

## 已知数据口径

- `platform` 在 dump 里是数字代码：1=TV、2=OVA、3=剧场版、5=WEB、0=其他、2006=动态漫画
- 收藏数字段为 `favorite.done`（看过），非 `collect`
- dump 无封面字段，封面统一走 API 重定向；无图条目自动隐藏图框
- 3 部条目 `rank=0`（未进排名），排序时按未排名处理沉底
