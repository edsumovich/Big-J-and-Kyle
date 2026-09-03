#!/usr/bin/env node
/**
 * Fetches NFL + NCAAF + EPL + Serie A + Bundesliga odds from ESPN's public
 * scoreboard API and writes them to data/games.json in the schema Slate's
 * UI expects. Meant to be run on a schedule (see
 * .github/workflows/update-odds.yml).
 *
 * Switched from SharpAPI to ESPN after repeated friction with SharpAPI's
 * rate limits, undocumented pagination behavior, and unconfirmed market
 * type names. ESPN's endpoint requires no API key, has no known rate
 * limit, needs no pagination (each call returns the full current week's
 * slate), and returns pre-parsed spread/moneyline/total per game.
 *
 * IMPORTANT CAVEAT: this is ESPN's own internal API that powers espn.com —
 * it isn't a documented, versioned public product, so there's no stability
 * guarantee. It could change or be restricted without notice. Given how
 * much friction the "official" documented options gave us, this trade-off
 * was made deliberately — see chat history for the reasoning.
 *
 * KNOWN GAP: this endpoint does not include player props (only game-level
 * odds), unlike the old SharpAPI integration. player-props.json is written
 * as an empty array — the NFL Player Props section will just show its
 * empty state until/unless a props data source is added back.
 */

const fs = require("fs");
const path = require("path");

const FIXTURE_FILE = process.env.FIXTURE_FILE; // e.g. FIXTURE_FILE=./fixtures/espn-sample.json — replays saved data instead of hitting the live API.

const LEAGUES = [
  { path: "football/nfl", sport: "NFL" },
  { path: "football/college-football", sport: "NCAAFB" },
  { path: "soccer/eng.1", sport: "EPL" },
  { path: "soccer/ita.1", sport: "SERIEA" },
  { path: "soccer/ger.1", sport: "BUNDESLIGA" },
];

async function fetchScoreboard(leaguePath, sportLabel) {
  if (FIXTURE_FILE) {
    const fixture = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8"));
    const events = fixture[sportLabel] || [];
    console.log(`${sportLabel}: replayed ${events.length} event(s) from ${FIXTURE_FILE} (no live request made)`);
    return events;
  }

  // Without groups= and a high limit=, ESPN's college football scoreboard
  // silently caps at a default view of roughly the first 25 games (a
  // widely-documented quirk, not just something we hit by chance) — not the
  // full week's slate. groups=80 = all FBS conferences combined. NFL gets
  // the same limit= for safety/consistency, though its smaller weekly slate
  // is unlikely to actually need it.
  const params = leaguePath === "football/college-football" ? "?groups=80&limit=500" : "?limit=500";
  const url = `https://site.api.espn.com/apis/site/v2/sports/${leaguePath}/scoreboard${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Skipping ${sportLabel}: request failed (${res.status})`);
    return [];
  }
  const json = await res.json();
  const events = json.events || [];
  if (process.env.LOG_RAW && events.length) {
    console.log(`\n=== ${sportLabel} sample event (1 of ${events.length}) ===`);
    console.log(JSON.stringify(events[0], null, 2));
  }
  console.log(`${sportLabel}: fetched ${events.length} event(s)`);
  return events;
}

// American odds come through as strings like "-110", "+145", or the
// literal string "OFF" when a market isn't being offered for that game.
function parseAmerican(v) {
  if (v == null || v === "OFF") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// Point spread / goal line strings look like "+0.5", "-3.5", "-38.5" — a
// plain signed number, safe to parseFloat directly.
function parseLine(v) {
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// Total/over-under line strings are prefixed with "o"/"u", e.g. "o44.5" or
// "u2.5" — strip the letter before parsing.
function parseTotalLine(v) {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/^[ou]/i, ""));
  return isNaN(n) ? null : n;
}

function formatKickoff(iso) {
  if (!iso) return "TBD";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "TBD";
  return d.toLocaleString("en-US", {
    weekday: "short", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
    timeZone: "America/Chicago", // Central time — auto-handles CDT/CST across the season, unlike a fixed UTC offset
  });
}

function toGame(event, sportLabel) {
  const comp = (event.competitions && event.competitions[0]) || {};
  const competitors = comp.competitors || [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  const homeTeam = home?.team?.displayName || "Home";
  const awayTeam = away?.team?.displayName || "Away";

  const oddsObj = (comp.odds && comp.odds[0]) || null;

  let spreadLine = null, spreadOdds = null, favorite = "home";
  let mlHome = null, mlAway = null, mlDraw = null;
  let totalLine = null, overOdds = null, underOdds = null;

  if (oddsObj) {
    // Football's odds object has a convenient top-level "spread" number
    // (home team's line). Soccer's doesn't always — fall back to parsing
    // it out of pointSpread.home.close.line ("+0.5"/"-0.5"-style) when the
    // shortcut isn't there.
    let rawSpread = typeof oddsObj.spread === "number" ? oddsObj.spread : null;
    if (rawSpread == null) {
      rawSpread = parseLine(oddsObj.pointSpread?.home?.close?.line);
    }
    if (rawSpread != null) {
      spreadLine = Math.abs(rawSpread);
      favorite = rawSpread <= 0 ? "home" : "away";
    }
    const homeSpreadOdds = parseAmerican(oddsObj.pointSpread?.home?.close?.odds);
    const awaySpreadOdds = parseAmerican(oddsObj.pointSpread?.away?.close?.odds);
    spreadOdds = favorite === "home" ? (homeSpreadOdds ?? awaySpreadOdds) : (awaySpreadOdds ?? homeSpreadOdds);

    mlHome = parseAmerican(oddsObj.moneyline?.home?.close?.odds);
    mlAway = parseAmerican(oddsObj.moneyline?.away?.close?.odds);
    // Only present for 3-way markets (soccer). Stays null for football.
    mlDraw = parseAmerican(oddsObj.moneyline?.draw?.close?.odds);

    // Same fallback pattern as spread: football has a convenient top-level
    // "overUnder" number; fall back to parsing total.over.close.line
    // ("o2.5"-style) when it's not there.
    totalLine = typeof oddsObj.overUnder === "number" ? oddsObj.overUnder : null;
    if (totalLine == null) {
      totalLine = parseTotalLine(oddsObj.total?.over?.close?.line) ?? parseTotalLine(oddsObj.total?.under?.close?.line);
    }
    overOdds = parseAmerican(oddsObj.total?.over?.close?.odds);
    underOdds = parseAmerican(oddsObj.total?.under?.close?.odds);
  }

  const startsAt = comp.date || event.date || null;
  const completed = !!comp.status?.type?.completed;

  return {
    id: event.id,
    sport: sportLabel,
    conf: sportLabel,
    away: awayTeam,
    home: homeTeam,
    kickoff: formatKickoff(startsAt),
    startsAt,
    completed, // not currently used client-side, but kept for a future grading pass
    spread: { favorite, line: spreadLine, odds: spreadOdds },
    moneyline: mlDraw != null ? { home: mlHome, away: mlAway, draw: mlDraw } : { home: mlHome, away: mlAway },
    total: { line: totalLine, overOdds, underOdds },
  };
}

async function main() {
  const allGames = [];

  for (const league of LEAGUES) {
    const events = await fetchScoreboard(league.path, league.sport);
    const games = events.map((e) => toGame(e, league.sport));
    allGames.push(...games);
    console.log(`${league.sport}: wrote ${games.length} game(s)`);
  }

  const outDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, "games.json"), JSON.stringify(allGames, null, 2));
  console.log(`Wrote ${allGames.length} total games to data/games.json`);

  // ESPN's scoreboard endpoint doesn't include player props — see the
  // KNOWN GAP note at the top of this file.
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
