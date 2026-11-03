# anime-catalog 进度日志

## 2026-11-04 01:3x · 夜间续跑轮：公开精简版 lite.html

- **目标**：上次「分享渠道与限制」分析中提出的 NSFW 安全分享方案落地
- **交付**：
  - `lite.html`（18.6MB）：NSFW 条目双层剔除（动画内联行物理剔除 2,457 条 + 各分片页面级过滤）、无 NSFW 开关、页签与统计均为 SFW 口径
  - `meta.json` 升级为 `{total, sfw}` 双计数；主站页签口径不变
  - 主站 index.html 回归验证通过（NSFW 开关保留、默认隐藏）
- **修正**：补提交了上一轮遗漏的 README 地区筛选文档
- **验证**：本地浏览器实测 lite 动画 28,801 / 书籍 401,143 全对；`node scripts/page.mjs --lite` 可复现
- **留待后续**（可选）：Cloudflare Pages 国内镜像说明；封面迁 HF 降 GitHub 流量；每周数据刷新（换新 dump 重跑三脚本即可）

## 2026-11-03 · 已交付主线

- v1 动画找番库（6,870 部，≥200 人评分）+ 6,214 张 SFW 封面
- v2 全类型 700,108 条（5 类型分片懒加载，行式数据）
- v3 音乐列表模式/视图切换/音乐元信息+歌词搜索
- v4 地区筛选（ja/zh/us/kr/fr，标签+平台+文字启发式，「中国风」误判排除）
- 全部推送 GitHub Pages：https://qyuejinzhao.github.io/anime-catalog/
