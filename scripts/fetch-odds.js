#!/usr/bin/env node
/**
 * Fetches NFL + NCAAF odds from SharpAPI and writes them to data/games.json
 * in the schema Slate's UI expects. Meant to be run on a schedule (see
 * .github/workflows/update-odds.yml).
 *
 * Field shapes below are confirmed against a real LOG_RAW=1 response (not
 * guessed) — see the "Sample confirmed row shapes" comment near the bottom
 * for what was actually observed. One thing NOT yet confirmed: the exact
 * market_type string for totals (no total row appeared in the sample we
 * had). TOTAL_MARKET_TYPES below lists a few guesses; if totals still come
 * back as the 44.5 placeholder, rerun with LOG_RAW=1, find the real
 * market_type for a game total, and add it to that list.
 *
 * Requires SHARPAPI_KEY as an environment variable (GitHub Actions secret).
 */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.SHARPAPI_KEY;
const BASE = "https://api.sharpapi.io/api/v1";
const FIXTURE_FILE = process.env.FIXTURE_FILE; // e.g. FIXTURE_FILE=./fixtures/sharpapi-sample.json — replays saved rows instead of hitting the live API. Great for testing parsing changes without burning rate limit.

if (!API_KEY && !FIXTURE_FILE) {
  console.error("Missing SHARPAPI_KEY environment variable (or set FIXTURE_FILE to replay saved data instead).");
  process.exit(1);
}

// Confirmed as "point_spread" from a real response. Totals unconfirmed —
// tries a few likely names.
const SPREAD_MARKET_TYPES = ["point_spread"];
// "total" is now the leading guess — the documented market= filter param
// uses this exact spelling ("moneyline,spread,total"), which is a strong
// hint it matches the market_type field too, though not 100% confirmed
// against a real row yet. The others stay as fallbacks just in case.
const TOTAL_MARKET_TYPES = ["total", "point_total", "game_total"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, label, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, { headers: { "X-API-Key": API_KEY } });
    if (res.status !== 429) return res;
    if (attempt === maxRetries) return res;
    const retryAfterHeader = res.headers.get("retry-after");
    const waitMs = retryAfterHeader ? parseFloat(retryAfterHeader) * 1000 : 1000 * Math.pow(2, attempt);
    console.warn(`${label}: rate limited (429), waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${maxRetries}...`);
    await sleep(waitMs);
  }
  return null;
}

async function fetchOddsRows(league) {
  if (FIXTURE_FILE) {
    const fixture = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8"));
    const rows = fixture[league] || [];
    console.log(`${league}: replayed ${rows.length} odds row(s) from ${FIXTURE_FILE} (no live request made)`);
    return rows;
  }

  // Confirmed from docs.sharpapi.io: a `market=` filter (comma-separated,
  // e.g. "moneyline,spread,total") narrows results server-side — this
  // should exclude player props at the source rather than us having to
  // filter them out after paying for them in the response. Real pagination
  // is confirmed too: meta.pagination.{limit,offset,has_more,next_offset}.
  const rows = [];
  let offset = 0;
  const limit = 100;
  let page = 0;
  const MAX_PAGES = 10;

  do {
    const url = `${BASE}/odds?league=${league}&market=moneyline,spread,total&limit=${limit}&offset=${offset}`;
    const res = await fetchWithRetry(url, league);
    if (!res || !res.ok) {
      console.warn(`Skipping ${league}: request failed (${res ? res.status : "no response"})`);
      return rows;
    }
    const json = await res.json();
    const pageRows = json.data || [];
    rows.push(...pageRows);

    if (process.env.LOG_RAW && page === 0) {
      console.log(`\n=== ${league} meta ===`);
      console.log(JSON.stringify(json.meta || {}, null, 2));
      console.log(`=== ${league} sample rows (first 5 of ${pageRows.length}) ===`);
      console.log(JSON.stringify(pageRows.slice(0, 5), null, 2));
    }

    const pagination = json.meta?.pagination;
    if (!pagination || !pagination.has_more) break;
    offset = pagination.next_offset ?? offset + limit;
    page++;
    if (page < MAX_PAGES) await sleep(300);
  } while (page < MAX_PAGES);

  const propCount = rows.filter((r) => r.is_player_prop).length;
  console.log(`${league}: fetched ${rows.length} odds row(s) across ${page + 1} page(s) (${propCount} still player props)`);
  return rows;
}

// Real, correctly-priced game markets only: no player props, no
// outright/futures markets (like the "NFL Specials" MVP bucket, which has
// no away team), no alternate lines, no stale prices.
function isRealGameMarketRow(row) {
  return (
    !row.is_player_prop &&
    row.selection_type !== "outright" &&
    row.away_team &&
    row.home_team &&
    row.is_main_line !== false &&
    !row.is_stale_pregame_price
  );
}

function groupByEvent(rows) {
  const games = {};
  for (const row of rows) {
    if (!games[row.event_id]) games[row.event_id] = [];
    games[row.event_id].push(row);
  }
  return Object.values(games);
}

function formatKickoff(iso) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "TBD";
  return d.toLocaleString("en-US", {
    weekday: "short", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
}

function toGame(allRowsForEvent, sportLabel) {
  const rows = allRowsForEvent.filter(isRealGameMarketRow);
  const first = allRowsForEvent[0];
  const away = first.away_team;
  const home = first.home_team;

  const mlHomeRow = rows.find((r) => r.market_type === "moneyline" && r.selection_type === "home");
  const mlAwayRow = rows.find((r) => r.market_type === "moneyline" && r.selection_type === "away");

  const spHomeRow = rows.find((r) => SPREAD_MARKET_TYPES.includes(r.market_type) && r.selection_type === "home");
  const spAwayRow = rows.find((r) => SPREAD_MARKET_TYPES.includes(r.market_type) && r.selection_type === "away");

  const overRow = rows.find((r) => TOTAL_MARKET_TYPES.includes(r.market_type) && r.selection_type === "over");
  const underRow = rows.find((r) => TOTAL_MARKET_TYPES.includes(r.market_type) && r.selection_type === "under");

  if (!mlHomeRow && !mlAwayRow) console.warn(`[${away} @ ${home}] no moneyline odds found`);
  if (!spHomeRow && !spAwayRow) console.warn(`[${away} @ ${home}] no spread odds found`);
  if (!overRow && !underRow) console.warn(`[${away} @ ${home}] no total odds found`);

  const spreadLine = spHomeRow ? spHomeRow.line : (spAwayRow != null && spAwayRow.line != null ? -spAwayRow.line : null);
  const favorite = spreadLine == null ? "home" : (spreadLine < 0 ? "home" : "away");

  return {
    id: first.event_id,
    sport: sportLabel,
    conf: sportLabel,
    away,
    home,
    kickoff: formatKickoff(first.event_start_time),
    startsAt: first.event_start_time || null,
    spread: {
      favorite,
      line: spreadLine != null ? Math.abs(spreadLine) : null,
      odds: (spHomeRow || spAwayRow)?.odds_american ?? null,
    },
    moneyline: {
      home: mlHomeRow?.odds_american ?? null,
      away: mlAwayRow?.odds_american ?? null,
    },
    total: {
      line: (overRow || underRow)?.line ?? null,
      overOdds: overRow?.odds_american ?? null,
      underOdds: underRow?.odds_american ?? null,
    },
  };
}

async function main() {
  const nflRows = await fetchOddsRows("NFL");
  await sleep(500);
  const ncaafRows = await fetchOddsRows("NCAAF");

  const nflGames = groupByEvent(nflRows)
    .filter((group) => group[0].away_team) // drop specials/outright buckets with no real away team
    .map((group) => toGame(group, "NFL"));

  const ncaafGames = groupByEvent(ncaafRows)
    .filter((group) => group[0].away_team)
    .map((group) => toGame(group, "NCAAFB"));

  const games = [...nflGames, ...ncaafGames];

  const outDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, "games.json"), JSON.stringify(games, null, 2));
  console.log(`Wrote ${games.length} games (${nflGames.length} NFL, ${ncaafGames.length} NCAAFB) to data/games.json`);

  // No props/soccer per current plan.
  fs.writeFileSync(path.join(outDir, "player-props.json"), JSON.stringify([], null, 2));

  fs.writeFileSync(
    path.join(outDir, "last-updated.json"),
    JSON.stringify({ updatedAt: new Date().toISOString() }, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/* Sample confirmed row shapes (from a real LOG_RAW=1 response):

Moneyline:
{
  "event_id": "ncaaf_northcarolinatarheels_tcuhornedfrogs_2026-08-29_b2",
  "market_type": "moneyline",
  "selection": "TCU",
  "selection_type": "home",
  "odds_american": -166,
  "line": null,
  "event_start_time": "2026-08-29T16:00Z",
  "away_team": "North Carolina",
  "home_team": "TCU"
}

Point spread:
{
  "market_type": "point_spread",
  "selection": "TCU",
  "selection_type": "home",
  "odds_american": -125,
  "line": -1.5
}

Player prop (excluded via is_player_prop):
{
  "market_type": "player_receiving_yards",
  "is_player_prop": true,
  "selection_type": "over",
  "line": 40.5,
  "player_name": "Ka'Morreun Pimpton"
}

Outright/futures (excluded via selection_type === "outright" and empty away_team):
{
  "home_team": "NFL Specials",
  "away_team": "",
  "market_type": "mvp",
  "selection_type": "outright"
}
*/
