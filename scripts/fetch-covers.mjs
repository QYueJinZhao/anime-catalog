#!/usr/bin/env node
/**
 * 批量下载封面 → covers/{id}.jpg
 * 用法: node scripts/fetch-covers.mjs [--concurrency N]
 *
 * 数据源: data/catalog.json
 * 来源: https://api.bgm.tv/v0/subjects/{id}/image?type=small (302 → lain.bgm.tv)
 * - NSFW 条目跳过（页面开关打开时回退远程加载）
 * - 已存在且非 0 字节的文件跳过，可断点续跑
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COVER_DIR = path.join(ROOT, 'covers');
const UA = 'zhangjianle/personal-catalog (https://github.com/QYueJinZhao)';

let CONC = 6;
const ci = process.argv.indexOf('--concurrency');
if (ci > -1) CONC = Math.max(1, +process.argv[ci + 1] || 6);

fs.mkdirSync(COVER_DIR, { recursive: true });
const { items } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));

const todo = [];
let skippedExisting = 0;
for (const it of items) {
  const p = path.join(COVER_DIR, `${it.id}.jpg`);
  if (it.nsfw) continue; // NSFW 不入库，页面走远程回退
  const st = fs.existsSync(p) ? fs.statSync(p) : null;
  if (st && st.size > 500) { skippedExisting++; continue; }
  todo.push({ id: it.id, p });
}
console.log(`total ${items.length} items | skip existing ${skippedExisting} | to fetch ${todo.length} (concurrency ${CONC})`);

let ok = 0, fail = 0, done = 0;
const failures = [];
const t0 = Date.now();

async function fetchOne({ id, p }) {
  const url = `https://api.bgm.tv/v0/subjects/${id}/image?type=small`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) throw new Error(`too small ${buf.length}B`);
    fs.writeFileSync(p, buf);
    ok++;
  } catch (e) {
    fail++;
    failures.push({ id, err: String(e.message || e) });
    try { fs.rmSync(p, { force: true }); } catch {}
  }
  done++;
  if (done % 250 === 0) {
    const rate = done / ((Date.now() - t0) / 1000);
    console.log(`progress ${done}/${todo.length} ok=${ok} fail=${fail} (${rate.toFixed(1)}/s)`);
  }
}

const queue = [...todo];
const workers = Array.from({ length: CONC }, async () => {
  while (queue.length) {
    const job = queue.shift();
    if (!job) break;
    await fetchOne(job);
  }
});
await Promise.all(workers);

console.log(`DONE ok=${ok} fail=${fail} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
if (failures.length) {
  fs.writeFileSync(path.join(ROOT, 'data', 'cover-failures.json'), JSON.stringify(failures, null, 1), 'utf8');
  console.log(`failures written to data/cover-failures.json (${failures.length})`);
}
