#!/usr/bin/env node
/**
 * battle-training tracker — CLI pemantau ladder, November Cup, dan kartu bot.
 *
 * Data publik battle.training (CC BY 4.0, tanpa key):
 *   - GET https://api.battle.training/api/ladder
 *   - GET https://api.battle.training/api/ladders/promotedby-cup-nov-2026
 *   - GET https://api.battle.training/api/bots/<bot>
 *
 * Tanpa dependensi (Node 18+). Pemakaian:
 *   node tracker.mjs                 tampilkan ladder top 10 + cup top 10 + kartu bot kimmy
 *   node tracker.mjs --bot <nama>    kartu bot lain
 *   node tracker.mjs --json          keluaran JSON (untuk script lain)
 *   node tracker.mjs --help          bantuan
 */
const API = 'https://api.battle.training/api';
const CUP_SLUG = 'promotedby-cup-nov-2026';
const UA = { 'User-Agent': 'battle-training-tracker/1.0 (+https://battle.training)' };
const FETCH_TIMEOUT_MS = 15000;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`battle-training tracker — pemantau ladder & November Cup (data publik, CC BY 4.0)

Pemakaian:
  node tracker.mjs                 ladder top 10 + cup top 10 + kartu bot kimmy
  node tracker.mjs --bot <nama>    kartu bot lain (mis. --bot bazookabot-lab)
  node tracker.mjs --json          keluaran JSON, bukan tabel teks
  node tracker.mjs --help          bantuan ini

Sumber data: https://api.battle.training/api (tanpa key).
Atribusi: Source: battle.training (https://battle.training), CC BY 4.0.`);
  process.exit(0);
}

const jsonMode = args.includes('--json');
const botIdx = args.indexOf('--bot');
const botName = botIdx >= 0 && args[botIdx + 1] ? args[botIdx + 1] : 'kimmy';

async function fetchJson(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function fmtDateTime(d) {
  const utc = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(d);
  const wib = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(d);
  return { utc: utc + ' UTC', wib: wib + ' WIB' };
}

function pad(s, n) {
  s = String(s ?? '');
  return s.length > n ? s.slice(0, n - 1) + '…' : s + ' '.repeat(n - s.length);
}

function record(e) {
  return `${e.wins}-${e.losses}-${e.draws}`;
}

async function main() {
  const fetchedAt = new Date();
  const [ladderRes, cupRes, botRes] = await Promise.allSettled([
    fetchJson(`${API}/ladder`),
    fetchJson(`${API}/ladders/${CUP_SLUG}`),
    fetchJson(`${API}/bots/${encodeURIComponent(botName)}`),
  ]);

  const errors = {};
  const ladder = ladderRes.status === 'fulfilled' ? ladderRes.value : (errors.ladder = ladderRes.reason.message, null);
  const cup = cupRes.status === 'fulfilled' ? cupRes.value : (errors.cup = cupRes.reason.message, null);
  const bot = botRes.status === 'fulfilled' ? botRes.value : (errors.bot = botRes.reason.message, null);

  if (jsonMode) {
    const out = { fetched_at: fetchedAt.toISOString(), source: 'https://api.battle.training/api', license: 'CC BY 4.0' };
    if (ladder) out.ladder = { updated_at: ladder.updated_at, top10: (ladder.entries || []).slice(0, 10) };
    if (cup) out.cup = { slug: cup.slug, name: cup.name, status: cup.status, prize: cup.prize, enrolled: cup.enrolled, ends_at: cup.ends_at, min_sets_to_qualify: cup.entry?.min_sets_to_qualify, top10: (cup.standings || []).slice(0, 10) };
    if (bot) out.bot = bot;
    if (Object.keys(errors).length) out.errors = errors;
    console.log(JSON.stringify(out, null, 2));
    process.exit(Object.keys(errors).length ? 1 : 0);
  }

  const when = fmtDateTime(fetchedAt);
  console.log('=== battle.training tracker ===');
  console.log(`Data diambil: ${when.utc} (${when.wib})`);
  console.log('');

  // ---- Public ladder top 10 ----
  if (ladder) {
    const entries = (ladder.entries || []).slice(0, 10);
    console.log(`-- Public ladder (Armor, Season 2) — top 10 dari ${ladder.entries?.length ?? '?'} bot --`);
    console.log(`#   ${pad('Bot', 22)} ${pad('Agent / Model', 24)} ${pad('Skor', 6)} ${pad('Rating', 7)} ${pad('M-K-S', 11)} Set`);
    for (const e of entries) {
      const agent = [e.agent, e.model].filter(Boolean).join(' / ');
      console.log(`${pad(e.rank, 3)} ${pad(e.bot, 22)} ${pad(agent, 24)} ${pad(e.score, 6)} ${pad(e.rating, 7)} ${pad(record(e), 11)} ${e.games}`);
    }
  } else {
    console.log(`-- Public ladder: GAGAL dimuat (${errors.ladder}) --`);
  }
  console.log('');

  // ---- November Cup top 10 ----
  if (cup) {
    const top = (cup.standings || []).slice(0, 10);
    const ends = fmtDateTime(new Date(cup.ends_at));
    console.log(`-- ${cup.name} — top 10 dari ${cup.enrolled} peserta --`);
    console.log(`Hadiah: $${cup.prize?.total_usd ?? '?'} USDC (${(cup.prize?.split_usd || []).join('/')}) · kualifikasi: ${cup.entry?.min_sets_to_qualify ?? '?'} set · tutup: ${ends.utc}`);
    console.log(`#   ${pad('Bot', 22)} ${pad('Agent / Model', 24)} ${pad('Skor', 6)} ${pad('Rating', 7)} ${pad('M-K-S', 11)} Game  Q`);
    for (const e of top) {
      const agent = [e.agent, e.model].filter(Boolean).join(' / ');
      console.log(`${pad(e.rank, 3)} ${pad(e.bot, 22)} ${pad(agent, 24)} ${pad(e.score, 6)} ${pad(e.rating, 7)} ${pad(record(e), 11)} ${pad(e.games, 5)} ${e.qualified ? '✓' : '·'}`);
    }
  } else {
    console.log(`-- November Cup: GAGAL dimuat (${errors.cup}) --`);
  }
  console.log('');

  // ---- Bot card ----
  if (bot) {
    const armor = bot.theaters?.armor;
    const cupEntry = cup?.standings?.find((e) => e.bot === bot.name);
    const cupBot = (bot.ladders || []).find((l) => l.ladder === CUP_SLUG);
    const active = (bot.versions || []).find((v) => v.active);
    console.log(`-- Bot: ${bot.name} (${[bot.agent, bot.model].filter(Boolean).join(' / ')}) — versi aktif ${active?.label ?? '?'} --`);
    if (armor) {
      console.log(`Public ladder : rank ${armor.rank}/${armor.of} · skor ${armor.score} · rating ${armor.rating} ±${armor.rd} · ${armor.sets} set (${record(armor)})`);
    }
    if (cupEntry || cupBot) {
      const c = cupEntry ?? cupBot;
      console.log(`November Cup  : rank ${cupEntry?.rank ?? '—'} · skor ${c.score} · rating ${c.rating} ±${c.rd ?? '?'} · ${c.games} game (${record(c)})`);
      if (cupEntry) {
        console.log(`Kualifikasi   : ${cupEntry.qualified ? 'SUDAH (lolos 100 set)' : `BELUM (${cupEntry.sets_to_qualify} set lagi menuju 100)`}`);
      }
    } else {
      console.log('November Cup  : tidak terdaftar');
    }
    if (active?.health) {
      const h = active.health;
      console.log(`Kesehatan ${active.label} : timeouts ${h.timeouts} · exceptions ${h.exceptions} · idle_ticks ${h.idle_ticks}`);
    }
    console.log(`Halaman bot   : https://battle.training/bots/${bot.name}`);
  } else {
    console.log(`-- Bot ${botName}: GAGAL dimuat (${errors.bot}) --`);
  }

  console.log('');
  console.log('M-K-S = menang-kalah-seri. Sumber: battle.training open data (CC BY 4.0), https://battle.training/data');
  if (Object.keys(errors).length) process.exit(1);
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
