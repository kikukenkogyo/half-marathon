#!/usr/bin/env node
/**
 * ハーフマラソン練習アプリ に「走った記録」を足すコマンド（写真から読んだ数字を入れる用）
 *
 *   node add.mjs run.json            … JSONファイルから追加（commit + push まで自動）
 *   node add.mjs run.json --no-push  … GitHubに送らず、ファイルだけ更新
 *   node add.mjs run.json --no-git   … git操作を一切せず、ファイルだけ更新（動作確認用）
 *   node add.mjs run.json --force    … 同じ日・同じ距離の記録があっても足す
 *
 * 渡すJSONの形（1件でも、配列で複数件でもOK）:
 *   {
 *     "date":  "2026-11-24",   // 必須：走った日（写真に日付は残らないので、酒井さんの言葉から決める）
 *     "time":  "46:10",        // 必須：走った時間。"分:秒" か "時:分:秒"。数字だけなら「分」
 *     "km":    6.86,           // 必須：距離
 *     "speed": 9.0,            // マシンの速度（km/h）。外で走った日は書かない（時間と距離から計算する）
 *     "menu":  "easy",         // long(①) / pace(②) / easy(③) / extra(④)。省略すると速度と時間から自動で決める
 *     "memo":  ""              // 体調・気づき（省略可）
 *   }
 *
 * 追加先は records.json（アプリが開くたびに読みに行くファイル）。index.html と plan.js は触らない。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(fileURLToPath(import.meta.url));
const DATA = join(REPO, 'records.json');
const MENU = { long: '① 長く走る日', pace: '② 本番の速さの日', easy: '③ つなぎの日', extra: '④ 軽く走る日' };

function fail(msg) { console.error('エラー: ' + msg); process.exit(1); }

function loadPlan() {
  const w = {};
  new Function('window', readFileSync(join(REPO, 'plan.js'), 'utf8'))(w);
  if (!w.PLAN) fail('plan.js が読めませんでした。');
  return w.PLAN;
}
const PLAN = loadPlan();

function parseDate(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function weekOf(dateStr) { return Math.floor(Math.round((parseDate(dateStr) - parseDate(PLAN.firstMonday)) / 86400000) / 7); }

// "46:10" → 46.17（分）
function toMin(v) {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').trim();
  if (!s) return NaN;
  if (!s.includes(':')) return parseFloat(s);
  const p = s.split(':').map(Number);
  if (p.some(isNaN)) return NaN;
  return p.length === 3 ? p[0] * 60 + p[1] + p[2] / 60 : p[0] + p[1] / 60;
}
function timeText(v, min) {
  const s = String(v ?? '').trim();
  if (s.includes(':')) return s;
  const m = Math.floor(min), sec = Math.round((min - m) * 60);
  return m + ':' + String(sec).padStart(2, '0');
}

// 速度と時間から、どのメニューかを決める
function judge(speed, min, week, used) {
  const w = PLAN.weeks[week];
  let m;
  if (speed >= 10.0) m = 'pace';
  else if (speed >= 8.8) m = 'easy';
  else m = min >= 50 ? 'long' : 'extra';
  if (m !== 'extra' && (!w || !w[m] || used.has(m))) m = 'extra';   // その週の枠がもう埋まっていれば④
  return m;
}

function loadData() {
  let raw;
  try { raw = readFileSync(DATA, 'utf8'); } catch { return []; }
  let data;
  try { data = JSON.parse(raw); } catch (e) { fail('records.json が壊れています: ' + e.message); }
  const list = Array.isArray(data) ? data : (data && data.records);
  if (!Array.isArray(list)) fail('records.json の形が違います。');
  return list;
}

function git(args) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// ===== 実行 =====
const argv = process.argv.slice(2);
const noPush = argv.includes('--no-push');
const noGit = argv.includes('--no-git');
const force = argv.includes('--force');
const path = argv.find(a => !a.startsWith('--'));
if (!path) fail('JSONファイルのパスを渡してください。');

let input;
try { input = JSON.parse(readFileSync(resolve(path), 'utf8')); } catch (e) { fail('JSONとして読めませんでした: ' + e.message); }
const list = Array.isArray(input) ? input : [input];
if (list.length === 0) fail('追加する記録がありません。');

const records = loadData();
const added = [];
for (const x of list.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)))) {
  const date = String(x.date ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('"date" は 2026-11-24 の形で書いてください（受け取った値: ' + date + '）');
  const week = weekOf(date);
  if (week < 0 || week >= PLAN.weeks.length) fail(`${date} は練習の期間（${PLAN.firstMonday} 〜 ${PLAN.race}）の外です。`);
  const min = toMin(x.time ?? x.min);
  if (!(min > 0)) fail('"time"（走った時間）が読めません。"46:10" の形で書いてください。');
  const km = Number(x.km);
  if (!(km > 0)) fail('"km"（距離）は必須です。');
  const speed = x.speed != null ? Number(x.speed) : Math.round(km / min * 600) / 10;
  if (!(speed > 0)) fail('"speed" が数字ではありません。');

  const sameWeek = records.filter(r => weekOf(r.date) === week);
  if (!force && sameWeek.some(r => r.date === date && Math.abs(r.km - km) < 0.01)) {
    fail(`${date} の ${km}km は、もう記録されています（もう1回足すなら --force）。`);
  }
  let menu = x.menu != null ? String(x.menu).trim() : judge(speed, min, week, new Set(sameWeek.map(r => r.menu)));
  if (!MENU[menu]) fail('"menu" は long / pace / easy / extra のいずれかにしてください（受け取った値: ' + menu + '）');

  const rec = { id: date + '-' + randomBytes(3).toString('hex'), date, menu, min: Math.round(min * 100) / 100, time: timeText(x.time ?? x.min, min), km, speed };
  if (x.speed == null) rec.outdoor = true;
  const memo = String(x.memo ?? '').trim();
  if (memo) rec.memo = memo;
  records.push(rec);
  added.push({ rec, week });
}

records.sort((a, b) => a.date.localeCompare(b.date));
writeFileSync(DATA, JSON.stringify(records, null, 2) + '\n', 'utf8');

console.log(`記録しました（${added.length}件）:`);
for (const { rec, week } of added) console.log(`  ・${rec.date}（第${week + 1}週） ${MENU[rec.menu]} / ${rec.time} / ${rec.km}km / ${rec.speed}km/h`);

if (noGit) { console.log('（--no-git のため git 操作はしていません）'); process.exit(0); }

try {
  git(['add', 'records.json']);
  const subject = added.length === 1 ? `走った記録を追加: ${added[0].rec.date}` : `走った記録を追加: ${added.length}件`;
  git(['commit', '-m', `${subject}\n\nCo-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`]);
} catch (e) {
  fail('git commit に失敗しました: ' + (e.stderr || e.message));
}

if (noPush) { console.log('コミット済み。（--no-push のため GitHub には送っていません）'); process.exit(0); }

try {
  git(['push', 'origin', 'HEAD']);
  console.log('GitHubに反映しました → https://kikukenkogyo.github.io/half-marathon/');
} catch (e) {
  console.error('push に失敗しました（コミットは残っています）: ' + (e.stderr || e.message));
  process.exit(1);
}
