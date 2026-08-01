#!/usr/bin/env node
/**
 * Fetches upcoming NFL + NCAAF odds from the SportsGameOdds API and writes
 * them to data/games.json in the schema Slate's UI expects. Meant to be run
 * on a schedule (see .github/workflows/update-odds.yml, 3x/day).
 *
 * Requires the free SportsGameOdds API key: https://sportsgameodds.com/pricing
 * Set it as the SPORTSGAMEODDS_API_KEY environment variable (GitHub Actions
 * secret in production, or a local .env / exported var when testing).
 *
 * NOTE ON ODDS PARSING: the exact oddID naming for the "total" market wasn't
 * fully confirmed against a live response while building this (docs describe
 * the {statID}-{statEntityID}-{periodID}-{betTypeID}-{sideID} pattern, e.g.
 * "points-home-game-ml-home" for a moneyline). findOdd() below tries a few
 * likely entity names and falls back to a loose substring match. Run this
 * once with LOG_RAW=1 and inspect a real event's `odds` object if totals
 * come back empty, then adjust ENTITY candidates below to match.
 */

const fs = require("fs");
const path = require("path");

const API_KEY = process.env.SPORTSGAMEODDS_API_KEY;
const BASE = "https://api.sportsgameodds.com/v2";

if (!API_KEY) {
  console.error("Missing SPORTSGAMEODDS_API_KEY environment variable.");
  process.exit(1);
}

async function fetchEvents(leagueID) {
  const url = `${BASE}/events?leagueID=${leagueID}&oddsAvailable=true&finalized=false`;
  const res = await fetch(url, { headers: { "x-api-key": API_KEY } });
  if (!res.ok) {
    throw new Error(`SportsGameOdds ${leagueID} request failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(`SportsGameOdds ${leagueID} returned success:false`);
  }
  if (process.env.LOG_RAW) {
    console.log(JSON.stringify(json.data?.[0], null, 2));
  }
  return json.data || [];
}

function findOdd(event, statID, betType, side, entityCandidates) {
  const odds = event.odds || {};
  for (const entity of entityCandidates) {
    const oddID = `${statID}-${entity}-game-${betType}-${side}`;
    if (odds[oddID]) return odds[oddID];
  }
  const looseKey = Object.keys(odds).find((k) => k.includes(`-game-${betType}-${side}`));
  return looseKey ? odds[looseKey] : null;
}

function bestPrice(odd) {
  if (!odd || !odd.byBookmaker) return null;
  const books = Object.values(odd.byBookmaker);
  if (!books.length) return null;
  // Takes the first bookmaker returned. Swap in consensus/best-line logic
  // here later if you want to shop lines across books instead.
  const first = books[0];
  return {
    price: first.price ?? first.odds ?? null,
    point: first.point ?? odd.point ?? null,
  };
}

function formatKickoff(iso) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function toGame(event, sportLabel) {
  const away = event.teams?.away?.names?.long || event.teams?.away?.name || "Away";
  const home = event.teams?.home?.names?.long || event.teams?.home?.name || "Home";

  const mlHome = bestPrice(findOdd(event, "points", "ml", "home", ["home"]));
  const mlAway = bestPrice(findOdd(event, "points", "ml", "away", ["away"]));
  const spHome = bestPrice(findOdd(event, "points", "sp", "home", ["home"]));
  const spAway = bestPrice(findOdd(event, "points", "sp", "away", ["away"]));
  const ouOver = bestPrice(findOdd(event, "points", "ou", "over", ["all", "game", "total"]));
  const ouUnder = bestPrice(findOdd(event, "points", "ou", "under", ["all", "game", "total"]));

  const rawSpreadPoint = spHome?.point ?? (spAway?.point != null ? -spAway.point : 0);
  const favorite = rawSpreadPoint < 0 ? "home" : "away";
  const spreadLine = Math.abs(rawSpreadPoint || 0);

  return {
    id: event.eventID,
    sport: sportLabel,
    conf: event.leagueID || sportLabel,
    away,
    home,
    kickoff: formatKickoff(event.status?.startsAt),
    spread: { favorite, line: spreadLine || 3, odds: spHome?.price ?? spAway?.price ?? -110 },
    moneyline: { home: mlHome?.price ?? -110, away: mlAway?.price ?? -110 },
    total: {
      line: ouOver?.point ?? ouUnder?.point ?? 44.5,
      overOdds: ouOver?.price ?? -110,
      underOdds: ouUnder?.price ?? -110,
    },
  };
}

async function main() {
  const [nfl, ncaaf] = await Promise.all([fetchEvents("NFL"), fetchEvents("NCAAF")]);

  const games = [
    ...nfl.map((e) => toGame(e, "NFL")),
    ...ncaaf.map((e) => toGame(e, "NCAAFB")),
  ];

  const outDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "games.json");
  fs.writeFileSync(outFile, JSON.stringify(games, null, 2));
  console.log(`Wrote ${games.length} games (${nfl.length} NFL, ${ncaaf.length} NCAAFB) to ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
