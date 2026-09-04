#!/usr/bin/env node
/**
 * Automatic grading. Finds real picks (and tails/fades) that are still
 * ungraded (result IS NULL) and whose game has since finished, works out
 * win/loss/push from the actual final score, and writes the result back to
 * Supabase.
 *
 * Switched from SportsGameOdds to ESPN's public scoreboard API, matching
 * fetch-odds.js — same data source, same event ids (so picks' stored
 * game_id lines up directly), same team-name strings (so name matching
 * works without normalization), and no API key/rate limit to manage.
 *
 * Requires two env vars:
 *   SUPABASE_URL          — your project URL, e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — the SECRET/service_role key (NOT the publishable
 *                           one in config.js). This script has to update
 *                           every user's picks, not just one person's,
 *                           which requires bypassing Row Level Security —
 *                           that's exactly what the service key is for. It
 *                           must ONLY ever live in a GitHub Actions secret,
 *                           never in any file that ships to the browser.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing one of SUPABASE_URL, SUPABASE_SERVICE_KEY.");
  process.exit(1);
}

const LEAGUES = [
  { path: "football/nfl", sport: "NFL" },
  { path: "football/college-football", sport: "NCAAFB" },
  { path: "soccer/eng.1", sport: "EPL" },
  { path: "soccer/ita.1", sport: "SERIEA" },
  { path: "soccer/ger.1", sport: "BUNDESLIGA" },
];
const SOCCER_SPORTS = new Set(["EPL", "SERIEA", "BUNDESLIGA"]);

async function fetchFinishedEvents(leaguePath, sportLabel) {
  const params = leaguePath === "football/college-football" ? "?groups=80&limit=500" : "?limit=500";
  const url = `https://site.api.espn.com/apis/site/v2/sports/${leaguePath}/scoreboard${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Skipping ${sportLabel}: request failed (${res.status})`);
    return [];
  }
  const json = await res.json();
  const events = json.events || [];
  const finished = events.filter((e) => e.competitions?.[0]?.status?.type?.completed);
  if (process.env.GRADE_LOG_RAW && finished.length) {
    console.log(`\n=== ${sportLabel} sample finished event ===`);
    console.log(JSON.stringify(finished[0], null, 2));
  }
  console.log(`${sportLabel}: ${events.length} event(s) in current scoreboard, ${finished.length} finished`);
  return finished.map((e) => ({ event: e, sport: sportLabel }));
}

// competitors[].score is a string like "27" once a game has finished.
function extractFinalScore(event) {
  const comp = event.competitions?.[0];
  const competitors = comp?.competitors || [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  const homeScore = home ? parseInt(home.score, 10) : NaN;
  const awayScore = away ? parseInt(away.score, 10) : NaN;
  if (isNaN(homeScore) || isNaN(awayScore)) return null;
  return { home: homeScore, away: awayScore };
}

function getTeamNames(event) {
  const comp = event.competitions?.[0];
  const competitors = comp?.competitors || [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  return {
    home: home?.team?.displayName || null,
    away: away?.team?.displayName || null,
  };
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

// Grades a single pick against a finished event's final score, using the
// pick's OWN stored line/label — never the live/current line, so a pick
// stays graded against whatever it was actually made on.
function gradePick(row, event, awayName, homeName, isSoccer) {
  const score = extractFinalScore(event);
  if (!score) return null; // couldn't find a final score for this event

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

  return null; // player props and anything else aren't auto-graded (and props aren't fetched at all currently anyway)
}

async function gradeTable(table, eventsById) {
  const rows = await supabaseGet(`${table}?result=is.null&select=id,game_id,market,pick`);
  console.log(`${table}: ${rows.length} ungraded row(s) to check`);

  let graded = 0;
  for (const row of rows) {
    const entry = eventsById[row.game_id];
    if (!entry) continue; // game hasn't finished yet (or isn't in the current scoreboard window)

    const { event, sport } = entry;
    const { away, home } = getTeamNames(event);
    const isSoccer = SOCCER_SPORTS.has(sport);

    const result = gradePick(row, event, away, home, isSoccer);
    if (!result) continue; // couldn't confidently grade this one — leave it for next run / manual review

    await supabasePatch(table, row.id, { result, result_source: "auto" });
    graded++;
    console.log(`Graded ${table}/${row.id}: "${row.pick}" (${row.market}) -> ${result}`);
  }
  console.log(`${table}: graded ${graded} of ${rows.length} ungraded row(s)`);
}

async function main() {
  const eventsById = {};
  for (const league of LEAGUES) {
    const entries = await fetchFinishedEvents(league.path, league.sport);
    entries.forEach(({ event, sport }) => { eventsById[event.id] = { event, sport }; });
  }

  await gradeTable("picks", eventsById);
  await gradeTable("tails_fades", eventsById);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
