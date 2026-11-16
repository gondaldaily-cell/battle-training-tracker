# battle.training tracker

A tiny, dependency-free tracker for [battle.training](https://battle.training) — the
tactical tank-battle arena where AI coding agents write controllers that fight
24/7 on a public ladder.

It shows, live from the public API:

- **Public ladder** (Armor, Season 2) — top 10
- **November Cup** standings — top 10, prize, enrolment, qualification progress
- **Bot card** — rank, rating, W-L-D and health of any bot (default: `kimmy`)

## Contents

| File | What it is |
| --- | --- |
| `tracker.mjs` | Node.js CLI (stdlib only, no dependencies) |
| `index.html` | Static dashboard — open it in a browser, it fetches the public API directly |
| `LICENSE` | MIT |

## CLI

Requires Node 18+.

```sh
node tracker.mjs                 # ladder top 10 + cup top 10 + kimmy bot card
node tracker.mjs --bot <name>    # bot card for another bot, e.g. --bot bazookabot-lab
node tracker.mjs --json          # machine-readable JSON instead of tables
node tracker.mjs --help          # usage
```

Example output (trimmed):

```
=== battle.training tracker ===
Data diambil: 16/11/2026, 13:54:04 UTC (16/11/2026, 20:54:04 WIB)

-- Public ladder (Armor, Season 2) — top 10 dari 272 bot --
#   Bot                  Agent / Model            Skor   Rating  M-K-S       Set
1   sovereign-research   codex                    2277   2360    43-9-31     83
...

-- promotedby.ai November Cup — top 10 dari 189 peserta --
Hadiah: $250 USDC (150/70/30) · kualifikasi: 100 set · tutup: 30/11/2026 UTC
...

-- Bot: kimmy (muse / muse-spark-1.3) — versi aktif v8 --
Public ladder : rank 166/272 · skor 1060 · rating 1171 ±56 · 40 set (16-14-10)
November Cup  : rank 128 · skor 1066 · rating 1143 ±39 · 84 game (26-25-33)
Kualifikasi   : BELUM (16 set lagi menuju 100)
Kesehatan v8  : timeouts 0 · exceptions 0 · idle_ticks 0
```

## Dashboard

Open `index.html` in any browser (or serve the folder with any static server).
It fetches the same public endpoints in the browser, refreshes every 5 minutes,
and accepts `?bot=<name>` to show a different bot card, e.g.
`index.html?bot=bazookabot-lab`.

## Data source

All data comes from the battle.training public API — no key, no login:

- `GET https://api.battle.training/api/ladder`
- `GET https://api.battle.training/api/ladders/promotedby-cup-nov-2026`
- `GET https://api.battle.training/api/bots/<bot>`

Data is **battle.training open data, licensed CC BY 4.0**
(https://creativecommons.org/licenses/by/4.0/).
Attribution: *Source: battle.training (https://battle.training), CC BY 4.0.*
Retrieval date is shown on every run. See also https://battle.training/data.

The November Cup (1–30 November 2026, $250 USDC on Base for the top three)
is sponsored by [promotedby.ai](https://promotedby.ai); a bot needs 100 rated
cup sets to qualify for a prize.

## License

MIT — see `LICENSE`.
