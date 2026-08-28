#!/usr/bin/env node
/**
 * Automatic grading. Finds real picks (and tails/fades) that are still
 * ungraded (result IS NULL) and whose game has since finished, works out
 * win/loss/push from the actual final score, and writes the result back to
 * Supabase.
 *
 * Requires three env vars:
 *   SPORTSGAMEODDS_API_KEY  — same key fetch-odds.js uses
 *   SUPABASE_URL            — your project URL, e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY    — the SECRET/service_role key (NOT the publishable
 *                             one in config.js). This script has to update
 *                             every user's picks, not just one person's, which
 *                             requires bypassing Row Level Security — that's
 *                             exactly what the service key is for. It must
 *                             ONLY ever live in a GitHub Actions secret, never
 *                             in any file that ships to the browser.
 *
 * NOTE ON FINAL SCORES: SportsGameOdds' docs describe a `results` object on
 * each finalized event holding raw score data, but the exact field paths
 * weren't confirmed against a live response while writing this — the same
 * situation odds-parsing was in before we fixed it with real data. This
 * tries a handful of plausible shapes and falls back gracefully; run with
 * GRADE_LOG_RAW=1 to print the raw `results`/`status` object for one
 * finalized event per league so the real shape can be confirmed and
 * extractFinalScore() adjusted if scores don't come through.
 */

const BASE = "https://api.sportsgameodds.com/v2";
const API_KEY = process.env.SPORTSGAMEODDS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing one of SPORTSGAMEODDS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY.");
  process.exit(1);
}

const LEAGUES = ["NFL", "NCAAF", "EPL", "IT_SERIE_A", "BUNDESLIGA"];
const LEAGUE_TO_SPORT = { NFL: "NFL", NCAAF: "NCAAFB", EPL: "EPL", IT_SERIE_A: "SERIEA", BUNDESLIGA: "BUNDESLIGA" };
const SOCCER_SPORTS = new Set(["EPL", "SERIEA", "BUNDESLIGA"]);
const LOOKBACK_DAYS = 10; // how far back to check for newly-finished games

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, label, maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, { headers: { "x-api-key": API_KEY } });
    if (res.status !== 429) return res;
    if (attempt === maxRetries) return res;
    const retryAfterHeader = res.headers.get("retry-after");
    const waitMs = retryAfterHeader ? parseFloat(retryAfterHeader) * 1000 : 1000 * Math.pow(2, attempt);
    console.warn(`${label}: rate limited (429), waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${maxRetries}...`);
    await sleep(waitMs);
  }
  return null;
}

// Tries a handful of plausible places SportsGameOdds might put final scores.
// Returns { away, home } point totals, or null if none of the guesses hit.
function extractFinalScore(event) {
  const r = event.results;
  if (!r) return null;

  const candidates = [
    () => (r.game ? { away: r.game.away?.points, home: r.game.home?.points } : null),
    () => (r.game ? { away: r.game.away?.score, home: r.game.home?.score } : null),
    () => ({ away: r.away?.points, home: r.home?.points }),
    () => ({ away: r.away?.score, home: r.home?.score }),
    () => ({ away: r.away, home: r.home }),
  ];

  for (const tryShape of candidates) {
    const shape = tryShape();
    if (shape && typeof shape.away === "number" && typeof shape.home === "number") {
      return shape;
    }
  }
  return null;
}

async function fetchFinalizedEvents(leagueID) {
  const results = [];
  let cursor = null;
  let pages = 0;
  const startsAfter = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();

  do {
    const url =
      `${BASE}/events?leagueID=${leagueID}&finalized=true&startsAfter=${startsAfter}&limit=100` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const res = await fetchWithRetry(url, leagueID);
    if (!res || !res.ok) {
      console.warn(`Skipping ${leagueID}: request failed (${res ? res.status : "no response"})`);
      return results;
    }
    const json = await res.json();
    if (!json.success) {
      console.warn(`Skipping ${leagueID}: API returned success:false`);
      return results;
    }
    if (process.env.GRADE_LOG_RAW && pages === 0 && json.data && json.data.length) {
      const sample = json.data[0];
      console.log(`\n=== ${leagueID} sample finalized event ===`);
      console.log("status:", JSON.stringify(sample.status, null, 2));
      console.log("results:", JSON.stringify(sample.results, null, 2));
    }
    results.push(...(json.data || []));
    cursor = json.nextCursor || null;
    pages++;
    if (cursor) await sleep(300);
  } while (cursor && pages < 10);

  console.log(`${leagueID}: fetched ${results.length} finalized event(s) from the last ${LOOKBACK_DAYS} days`);
  return results;
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, id, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${table}/${id} failed: ${res.status} ${await res.text()}`);
}

// Grades a single pick against a finalized event's final score, using the
// pick's OWN stored line/label — never the live/current line, so a pick
// stays graded against whatever it was actually made on.
function gradePick(row, event, awayName, homeName, isSoccer) {
  const score = extractFinalScore(event);
  if (!score) return null; // couldn't find a final score for this event yet

  if (row.market === "Total") {
    const isOver = row.pick.indexOf("Over") === 0;
    const lineMatch = row.pick.match(/(\d+(\.\d+)?)/);
    if (!lineMatch) return null;
    const line = parseFloat(lineMatch[1]);
    const total = score.away + score.home;
    if (total === line) return "push";
    return (isOver ? total > line : total < line) ? "win" : "loss";
  }

  if (row.market === "Spread") {
    const match = row.pick.match(/^(.*)\s([+-]\d+(\.\d+)?)$/);
    if (!match) return null;
    const pickedTeam = match[1].trim();
    const line = parseFloat(match[2]);
    const isHome = pickedTeam === homeName;
    const isAway = pickedTeam === awayName;
    if (!isHome && !isAway) return null;
    const teamScore = isHome ? score.home : score.away;
    const oppScore = isHome ? score.away : score.home;
    const adjusted = teamScore - oppScore + line;
    if (adjusted === 0) return "push";
    return adjusted > 0 ? "win" : "loss";
  }

  if (row.market === "Moneyline") {
    const pickedTeam = row.pick.replace(/\s*ML\s*$/, "").trim();
    if (pickedTeam === "Draw") {
      return score.away === score.home ? "win" : "loss";
    }
    const isHome = pickedTeam === homeName;
    const isAway = pickedTeam === awayName;
    if (!isHome && !isAway) return null;
    const teamScore = isHome ? score.home : score.away;
    const oppScore = isHome ? score.away : score.home;
    if (teamScore === oppScore) {
      return isSoccer ? "loss" : "push"; // 3-way soccer: a team-ML pick loses on a draw. 2-way (NFL etc): a tie pushes.
    }
    return teamScore > oppScore ? "win" : "loss";
  }

  return null; // player props and anything else aren't auto-graded yet
}

async function gradeTable(table, eventsById) {
  const extraSelect = table === "tails_fades" ? "" : "";
  const rows = await supabaseGet(`${table}?result=is.null&select=id,game_id,market,pick${extraSelect}`);
  console.log(`${table}: ${rows.length} ungraded row(s) to check`);

  let graded = 0;
  for (const row of rows) {
    const event = eventsById[row.game_id];
    if (!event) continue; // game hasn't finished yet (or isn't in our lookback window)

    const away = event.teams?.away?.names?.long || event.teams?.away?.name;
    const home = event.teams?.home?.names?.long || event.teams?.home?.name;
    const isSoccer = SOCCER_SPORTS.has(LEAGUE_TO_SPORT[event.leagueID] || "");

    const result = gradePick(row, event, away, home, isSoccer);
    if (!result) continue; // couldn't confidently grade this one — leave it for next run / manual review

    await supabasePatch(table, row.id, { result });
    graded++;
    console.log(`Graded ${table}/${row.id}: "${row.pick}" (${row.market}) -> ${result}`);
  }
  console.log(`${table}: graded ${graded} of ${rows.length} ungraded row(s)`);
}

async function main() {
  const eventsById = {};
  for (const leagueID of LEAGUES) {
    const events = await fetchFinalizedEvents(leagueID);
    events.forEach((e) => { eventsById[e.eventID] = e; });
    await sleep(500);
  }

  await gradeTable("picks", eventsById);
  await gradeTable("tails_fades", eventsById);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
