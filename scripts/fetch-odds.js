#!/usr/bin/env node
/**
 * Fetches NFL + NCAAF odds from SharpAPI and writes them to data/games.json
 * in the schema Slate's UI expects. Meant to be run on a schedule (see
 * .github/workflows/update-odds.yml).
 *
 * Switched from SportsGameOdds to SharpAPI (free tier: 12 requests/minute,
 * no monthly cap) after hitting SportsGameOdds' monthly object limit.
 * Scoped to NFL + NCAAFB only, no player props, no soccer, to keep request
 * volume low per plan constraints.
 *
 * Requires SHARPAPI_KEY as an environment variable (GitHub Actions secret).
 *
 * NOTE ON DATA SHAPE: SharpAPI's docs (docs.sharpapi.io) confirm the auth
 * header, base URL, and a moneyline row example, but no documented example
 * for spread/total rows was found while building this — the parsing below
 * for those two markets is a best-effort extrapolation from the moneyline
 * shape, not confirmed against a live response. Run with LOG_RAW=1 and
 * inspect a real response if spreads/totals come back wrong, then adjust
 * parseRow() below to match what you see.
 */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.SHARPAPI_KEY;
const BASE = "https://api.sharpapi.io/api/v1";

if (!API_KEY) {
  console.error("Missing SHARPAPI_KEY environment variable.");
  process.exit(1);
}

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

// league: SharpAPI's own league string ("NFL", "NCAAF" — the college code is
// an educated guess based on convention elsewhere; verify with LOG_RAW=1)
async function fetchOddsRows(league) {
  const url = `${BASE}/odds?league=${league}`;
  const res = await fetchWithRetry(url, league);
  if (!res || !res.ok) {
    console.warn(`Skipping ${league}: request failed (${res ? res.status : "no response"})`);
    return [];
  }
  const json = await res.json();
  const rows = json.data || [];
  if (process.env.LOG_RAW && rows.length) {
    console.log(`\n=== ${league} sample rows (first 5 of ${rows.length}) ===`);
    console.log(JSON.stringify(rows.slice(0, 5), null, 2));
  }
  console.log(`${league}: fetched ${rows.length} odds row(s)`);
  return rows;
}

// Groups SharpAPI's flat per-market odds rows into one row per unique game
// (keyed by team pair, since no shared game/event id was confirmed in the
// docs example available while building this).
function groupByGame(rows) {
  const games = {};
  for (const row of rows) {
    const key = `${row.away_team}__${row.home_team}`;
    if (!games[key]) {
      games[key] = { away: row.away_team, home: row.home_team, rows: [] };
    }
    games[key].rows.push(row);
  }
  return Object.values(games);
}

// Picks first-available book's price for a market/selection match.
function findPrice(rows, marketType, matchFn) {
  const row = rows.find((r) => r.market_type === marketType && matchFn(r));
  return row ? row.odds_american : null;
}

// Best-effort: spread/total selections are assumed to look like
// "Team Name -3.5" / "Over 44.5" (matching the pattern used elsewhere by
// other providers' selection strings) — unconfirmed for SharpAPI
// specifically. See LOG_RAW output to verify.
function parsePoint(selection) {
  const match = selection && selection.match(/([+-]?\d+(\.\d+)?)\s*$/);
  return match ? parseFloat(match[1]) : null;
}

function toGame(group, sportLabel) {
  const { away, home, rows } = group;

  const mlAway = findPrice(rows, "moneyline", (r) => r.selection === away);
  const mlHome = findPrice(rows, "moneyline", (r) => r.selection === home);

  const spreadAwayRow = rows.find((r) => r.market_type === "spread" && r.selection?.startsWith(away));
  const spreadHomeRow = rows.find((r) => r.market_type === "spread" && r.selection?.startsWith(home));
  const spreadLineRaw = spreadHomeRow ? parsePoint(spreadHomeRow.selection) : (spreadAwayRow ? -parsePoint(spreadAwayRow.selection) : null);

  const overRow = rows.find((r) => r.market_type === "total" && r.selection?.toLowerCase().startsWith("over"));
  const underRow = rows.find((r) => r.market_type === "total" && r.selection?.toLowerCase().startsWith("under"));
  const totalLine = overRow ? parsePoint(overRow.selection) : (underRow ? parsePoint(underRow.selection) : null);

  if (!mlAway && !mlHome) console.warn(`[${away} @ ${home}] no moneyline odds found — using -110 placeholder`);
  if (spreadLineRaw == null) console.warn(`[${away} @ ${home}] no spread odds found — using a 3-point placeholder`);
  if (totalLine == null) console.warn(`[${away} @ ${home}] no total odds found — using a 44.5 placeholder, THIS IS LIKELY WRONG`);

  const favorite = (spreadLineRaw ?? 0) < 0 ? "home" : "away";

  return {
    id: `${away}-${home}`.replace(/\s+/g, "-").toLowerCase(),
    sport: sportLabel,
    conf: sportLabel,
    away,
    home,
    kickoff: "TBD", // SharpAPI's documented example didn't include a confirmed kickoff-time field
    startsAt: null,
    spread: { favorite, line: Math.abs(spreadLineRaw ?? 3), odds: -110 },
    moneyline: { home: mlHome ?? -110, away: mlAway ?? -110 },
    total: { line: totalLine ?? 44.5, overOdds: overRow?.odds_american ?? -110, underOdds: underRow?.odds_american ?? -110 },
  };
}

async function main() {
  const nflRows = await fetchOddsRows("NFL");
  await sleep(500);
  const ncaafRows = await fetchOddsRows("NCAAF");

  const nflGames = groupByGame(nflRows).map((g) => toGame(g, "NFL"));
  const ncaafGames = groupByGame(ncaafRows).map((g) => toGame(g, "NCAAFB"));

  const games = [...nflGames, ...ncaafGames];

  const outDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, "games.json"), JSON.stringify(games, null, 2));
  console.log(`Wrote ${games.length} games (${nflGames.length} NFL, ${ncaafGames.length} NCAAFB) to data/games.json`);

  // No props/soccer per current plan — write empty so the site's existing
  // empty-state UI shows cleanly instead of stale data from before the switch.
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
