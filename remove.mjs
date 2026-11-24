#!/usr/bin/env node
/**
 * ハーフマラソン練習アプリ の「走った記録」（records.json）を消すコマンド
 *
 *   node remove.mjs --list              … 今ある記録を並べる（何も消さない）
 *   node remove.mjs --date 2026-11-24   … その日の記録を消す
 *   node remove.mjs --id <id>           … ID指定で消す
 *   --dry-run を付けると、消す対象を見せるだけで消さない
 *   --no-push / --no-git は add.mjs と同じ
 *
 * 消してもコミット履歴に残るので、git revert で戻せる。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = dirname(fileURLToPath(import.meta.url));
const DATA = join(REPO, 'records.json');
const MARK = { long: '①', pace: '②', easy: '③', extra: '④' };

function fail(msg) { console.error('エラー: ' + msg); process.exit(1); }
function git(args) { return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
function line(r) { return `  ・${r.date} ${MARK[r.menu] || r.menu} ${r.time} ${r.km}km  (id: ${r.id})`; }

const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const dry = argv.includes('--dry-run');

let records;
try { records = JSON.parse(readFileSync(DATA, 'utf8')); } catch (e) { fail('records.json が読めません: ' + e.message); }
if (!Array.isArray(records)) fail('records.json の形が違います。');

if (argv.includes('--list')) {
  console.log(`今ある記録（${records.length}件）:`);
  records.forEach(r => console.log(line(r)));
  process.exit(0);
}

const date = opt('--date'), id = opt('--id');
if (!date && !id) fail('--date か --id を指定してください（一覧は --list）。');
const hit = records.filter(r => (date && r.date === date) || (id && r.id === id));
if (hit.length === 0) fail('当てはまる記録がありません。');

console.log(`${dry ? '消す対象' : '消しました'}（${hit.length}件）:`);
hit.forEach(r => console.log(line(r)));
if (dry) process.exit(0);

writeFileSync(DATA, JSON.stringify(records.filter(r => !hit.includes(r)), null, 2) + '\n', 'utf8');
if (argv.includes('--no-git')) process.exit(0);

try {
  git(['add', 'records.json']);
  git(['commit', '-m', `走った記録を削除: ${hit.map(r => r.date).join(', ')}\n\nCo-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`]);
} catch (e) { fail('git commit に失敗しました: ' + (e.stderr || e.message)); }
if (argv.includes('--no-push')) process.exit(0);
try {
  git(['push', 'origin', 'HEAD']);
  console.log('GitHubに反映しました。');
} catch (e) {
  console.error('push に失敗しました（コミットは残っています）: ' + (e.stderr || e.message));
  process.exit(1);
}
