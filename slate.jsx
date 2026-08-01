import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Cell
} from "recharts";
import {
  Clock, Trophy, ChevronDown, ChevronUp, Lock, Check, Pencil,
  MessageSquare, X, Copy, Shuffle, Plus, Search, Radar
} from "lucide-react";

const COLORS = {
  bg: "#0F1521",
  surface: "#161F30",
  surface2: "#1D2A40",
  surface3: "#243350",
  paper: "#ECE7D9",
  gold: "#D9A441",
  green: "#4C9A6A",
  red: "#C24B3F",
  blue: "#3E7CD6",
  muted: "#8996AC",
  line: "rgba(255,255,255,0.09)",
};

const FONT_DISPLAY = "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const FONT_MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";
const NOTE_MAX = 256;

const USERS = [
  { id: "jordan", name: "Jordan", color: "#D9A441" },
  { id: "casey", name: "Casey", color: "#4C9A6A" },
  { id: "priya", name: "Priya", color: "#7C93C9" },
  { id: "marcus", name: "Marcus", color: "#C24B3F" },
  { id: "devon", name: "Devon", color: "#B586C7" },
  { id: "alicia", name: "Alicia", color: "#5FB0B0" },
  { id: "sam", name: "Sam", color: "#E08A5E" },
  { id: "nate", name: "Nate", color: "#8FA85C" },
  { id: "reyna", name: "Reyna", color: "#D97BA0" },
  { id: "theo", name: "Theo", color: "#7A8FE0" },
];
const ME = USERS[0];

const GAMES = [
  // ---- NFL Week 1, 2026 (all 16 games) ----
  {
    id: "nfl1", sport: "NFL", conf: "NFC West", away: "Patriots", home: "Seahawks", kickoff: "Wed 9/9 \u00b7 8:20 PM ET",
    spread: { favorite: "home", line: 3, odds: -110 },
    moneyline: { home: -155, away: 135 },
    total: { line: 44.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl2", sport: "NFL", conf: "NFC West", away: "49ers", home: "Rams", kickoff: "Thu 9/10 \u00b7 8:35 PM ET (Melbourne)",
    spread: { favorite: "home", line: 2.5, odds: -110 },
    moneyline: { home: -145, away: 125 },
    total: { line: 46.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl3", sport: "NFL", conf: "NFC South", away: "Bears", home: "Panthers", kickoff: "Sun 9/13 \u00b7 1:00 PM ET",
    spread: { favorite: "away", line: 2.5, odds: -110 },
    moneyline: { home: 120, away: -140 },
    total: { line: 43.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl4", sport: "NFL", conf: "AFC North", away: "Buccaneers", home: "Bengals", kickoff: "Sun 9/13 \u00b7 1:00 PM ET",
    spread: { favorite: "home", line: 3.5, odds: -110 },
    moneyline: { home: -175, away: 150 },
    total: { line: 48.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl5", sport: "NFL", conf: "NFC North", away: "Saints", home: "Lions", kickoff: "Sun 9/13 \u00b7 1:00 PM ET",
    spread: { favorite: "home", line: 9.5, odds: -110 },
    moneyline: { home: -450, away: 360 },
    total: { line: 47.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl6", sport: "NFL", conf: "AFC South", away: "Bills", home: "Texans", kickoff: "Sun 9/13 \u00b7 1:00 PM ET",
    spread: { favorite: "away", line: 2.5, odds: -110 },
    moneyline: { home: 120, away: -140 },
    total: { line: 45.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl7", sport: "NFL", conf: "AFC South", away: "Ravens", home: "Colts", kickoff: "Sun 9/13 \u00b7 1:00 PM ET",
    spread: { favorite: "away", line: 6.5, odds: -110 },
    moneyline: { home: 230, away: -280 },
    total: { line: 47.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl8", sport: "NFL", conf: "AFC South", away: "Browns", home: "Jaguars", kickoff: "Sun 9/13 \u00b7 1:00 PM ET",
    spread: { favorite: "home", line: 3, odds: -110 },
    moneyline: { home: -155, away: 135 },
    total: { line: 41.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl9", sport: "NFL", conf: "AFC North", away: "Falcons", home: "Steelers", kickoff: "Sun 9/13 \u00b7 1:00 PM ET",
    spread: { favorite: "home", line: 2.5, odds: -110 },
    moneyline: { home: -140, away: 120 },
    total: { line: 42.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl10", sport: "NFL", conf: "AFC South", away: "Jets", home: "Titans", kickoff: "Sun 9/13 \u00b7 1:00 PM ET",
    spread: { favorite: "away", line: 1.5, odds: -110 },
    moneyline: { home: 105, away: -125 },
    total: { line: 40.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl11", sport: "NFL", conf: "AFC West", away: "Cardinals", home: "Chargers", kickoff: "Sun 9/13 \u00b7 4:25 PM ET",
    spread: { favorite: "home", line: 3.5, odds: -110 },
    moneyline: { home: -175, away: 150 },
    total: { line: 45.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl12", sport: "NFL", conf: "AFC West", away: "Dolphins", home: "Raiders", kickoff: "Sun 9/13 \u00b7 4:25 PM ET",
    spread: { favorite: "away", line: 3, odds: -110 },
    moneyline: { home: 135, away: -155 },
    total: { line: 44.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl13", sport: "NFL", conf: "NFC North", away: "Packers", home: "Vikings", kickoff: "Sun 9/13 \u00b7 4:25 PM ET",
    spread: { favorite: "away", line: 2.5, odds: -110 },
    moneyline: { home: 120, away: -140 },
    total: { line: 45.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl14", sport: "NFL", conf: "NFC East", away: "Commanders", home: "Eagles", kickoff: "Sun 9/13 \u00b7 4:25 PM ET",
    spread: { favorite: "home", line: 3.5, odds: -110 },
    moneyline: { home: -175, away: 150 },
    total: { line: 47.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl15", sport: "NFL", conf: "NFC East", away: "Cowboys", home: "Giants", kickoff: "Sun 9/13 \u00b7 8:20 PM ET",
    spread: { favorite: "away", line: 3, odds: -110 },
    moneyline: { home: 135, away: -155 },
    total: { line: 46.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "nfl16", sport: "NFL", conf: "AFC West", away: "Broncos", home: "Chiefs", kickoff: "Mon 9/14 \u00b7 8:15 PM ET",
    spread: { favorite: "home", line: 6.5, odds: -110 },
    moneyline: { home: -270, away: 225 },
    total: { line: 45.5, overOdds: -110, underOdds: -110 },
  },

  // ---- NCAAFB Week 1, 2026 (all 32 games) ----
  {
    id: "fbs1", sport: "NCAAFB", conf: "Big Ten", away: "UMass", home: "Rutgers", kickoff: "Thu 9/3 \u00b7 6:00 PM ET",
    spread: { favorite: "home", line: 20.5, odds: -110 },
    moneyline: { home: -1200, away: 700 },
    total: { line: 51.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs2", sport: "NCAAFB", conf: "ACC", away: "Akron", home: "Wake Forest", kickoff: "Thu 9/3 \u00b7 7:00 PM ET",
    spread: { favorite: "home", line: 17.5, odds: -110 },
    moneyline: { home: -900, away: 550 },
    total: { line: 54.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs3", sport: "NCAAFB", conf: "Big 12", away: "Bethune-Cookman", home: "UCF", kickoff: "Thu 9/3 \u00b7 7:00 PM ET",
    spread: { favorite: "home", line: 33.5, odds: -110 },
    moneyline: { home: -5000, away: 1500 },
    total: { line: 58.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs4", sport: "NCAAFB", conf: "SEC", away: "Arkansas-Pine Bluff", home: "Missouri", kickoff: "Thu 9/3 \u00b7 8:00 PM ET",
    spread: { favorite: "home", line: 34.5, odds: -110 },
    moneyline: { home: -6000, away: 1600 },
    total: { line: 55.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs5", sport: "NCAAFB", conf: "ACC vs Big 12", away: "Colorado", home: "Georgia Tech", kickoff: "Thu 9/3 \u00b7 8:00 PM ET",
    spread: { favorite: "home", line: 3, odds: -110 },
    moneyline: { home: -155, away: 135 },
    total: { line: 52.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs6", sport: "NCAAFB", conf: "Big Ten", away: "Eastern Illinois", home: "Minnesota", kickoff: "Thu 9/3 \u00b7 8:00 PM ET",
    spread: { favorite: "home", line: 27.5, odds: -110 },
    moneyline: { home: -3000, away: 1000 },
    total: { line: 53.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs7", sport: "NCAAFB", conf: "Big 12", away: "Idaho", home: "Utah", kickoff: "Thu 9/3 \u00b7 9:00 PM ET",
    spread: { favorite: "home", line: 24.5, odds: -110 },
    moneyline: { home: -2500, away: 900 },
    total: { line: 49.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs8", sport: "NCAAFB", conf: "Big Ten", away: "UAB", home: "Illinois", kickoff: "Thu 9/3 \u00b7 9:00 PM ET",
    spread: { favorite: "home", line: 13.5, odds: -110 },
    moneyline: { home: -650, away: 480 },
    total: { line: 50.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs9", sport: "NCAAFB", conf: "Big Ten", away: "Indiana State", home: "Purdue", kickoff: "Fri 9/4 \u00b7 7:00 PM ET",
    spread: { favorite: "home", line: 20.5, odds: -110 },
    moneyline: { home: -1500, away: 750 },
    total: { line: 48.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs10", sport: "NCAAFB", conf: "Big 12", away: "LIU", home: "Kansas", kickoff: "Fri 9/4 \u00b7 8:00 PM ET",
    spread: { favorite: "home", line: 30.5, odds: -110 },
    moneyline: { home: -4000, away: 1200 },
    total: { line: 56.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs11", sport: "NCAAFB", conf: "Big Ten", away: "Toledo", home: "Michigan State", kickoff: "Fri 9/4 \u00b7 8:00 PM ET",
    spread: { favorite: "home", line: 6.5, odds: -110 },
    moneyline: { home: -240, away: 200 },
    total: { line: 47.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs12", sport: "NCAAFB", conf: "Big Ten", away: "Fresno State", home: "USC", kickoff: "Fri 9/4 \u00b7 9:00 PM ET",
    spread: { favorite: "home", line: 16.5, odds: -110 },
    moneyline: { home: -800, away: 550 },
    total: { line: 58.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs13", sport: "NCAAFB", conf: "ACC", away: "Miami", home: "Stanford", kickoff: "Fri 9/4 \u00b7 9:00 PM ET",
    spread: { favorite: "away", line: 13.5, odds: -110 },
    moneyline: { home: 480, away: -650 },
    total: { line: 53.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs14", sport: "NCAAFB", conf: "Big Ten", away: "North Texas", home: "Indiana", kickoff: "Sat 9/5 \u00b7 12:00 PM ET",
    spread: { favorite: "home", line: 10.5, odds: -110 },
    moneyline: { home: -450, away: 360 },
    total: { line: 55.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs15", sport: "NCAAFB", conf: "Sun Belt vs C-USA", away: "Liberty", home: "James Madison", kickoff: "Sat 9/5 \u00b7 12:00 PM ET",
    spread: { favorite: "home", line: 6.5, odds: -110 },
    moneyline: { home: -240, away: 200 },
    total: { line: 51.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs16", sport: "NCAAFB", conf: "SEC", away: "East Carolina", home: "Alabama", kickoff: "Sat 9/5 \u00b7 12:00 PM ET",
    spread: { favorite: "home", line: 27.5, odds: -110 },
    moneyline: { home: -3500, away: 1100 },
    total: { line: 54.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs17", sport: "NCAAFB", conf: "Big Ten", away: "Ball State", home: "Ohio State", kickoff: "Sat 9/5 \u00b7 12:30 PM ET",
    spread: { favorite: "home", line: 38.5, odds: -110 },
    moneyline: { home: -8000, away: 2000 },
    total: { line: 59.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs18", sport: "NCAAFB", conf: "SEC", away: "Tennessee State", home: "Georgia", kickoff: "Sat 9/5 \u00b7 3:00 PM ET",
    spread: { favorite: "home", line: 40.5, odds: -110 },
    moneyline: { home: -10000, away: 2500 },
    total: { line: 55.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs19", sport: "NCAAFB", conf: "SEC vs Big 12", away: "Baylor", home: "Auburn", kickoff: "Sat 9/5 \u00b7 3:30 PM ET (Atlanta)",
    spread: { favorite: "home", line: 2.5, odds: -110 },
    moneyline: { home: -135, away: 115 },
    total: { line: 49.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs20", sport: "NCAAFB", conf: "Big Ten", away: "Boise State", home: "Oregon", kickoff: "Sat 9/5 \u00b7 3:30 PM ET",
    spread: { favorite: "home", line: 9.5, odds: -110 },
    moneyline: { home: -380, away: 310 },
    total: { line: 55.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs21", sport: "NCAAFB", conf: "SEC", away: "Texas State", home: "Texas", kickoff: "Sat 9/5 \u00b7 3:30 PM ET",
    spread: { favorite: "home", line: 27.5, odds: -110 },
    moneyline: { home: -3000, away: 1000 },
    total: { line: 52.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs22", sport: "NCAAFB", conf: "ACC", away: "Tulane", home: "Duke", kickoff: "Sat 9/5 \u00b7 3:30 PM ET",
    spread: { favorite: "home", line: 3.5, odds: -110 },
    moneyline: { home: -175, away: 150 },
    total: { line: 53.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs23", sport: "NCAAFB", conf: "American vs Big 12", away: "Oklahoma State", home: "Tulsa", kickoff: "Sat 9/5 \u00b7 3:45 PM ET",
    spread: { favorite: "away", line: 6.5, odds: -110 },
    moneyline: { home: 210, away: -250 },
    total: { line: 56.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs24", sport: "NCAAFB", conf: "American", away: "FIU", home: "South Florida", kickoff: "Sat 9/5 \u00b7 7:00 PM ET",
    spread: { favorite: "home", line: 20.5, odds: -110 },
    moneyline: { home: -1400, away: 750 },
    total: { line: 57.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs25", sport: "NCAAFB", conf: "SEC vs ACC", away: "Clemson", home: "LSU", kickoff: "Sat 9/5 \u00b7 7:30 PM ET",
    spread: { favorite: "home", line: 2.5, odds: -110 },
    moneyline: { home: -135, away: 115 },
    total: { line: 51.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs26", sport: "NCAAFB", conf: "Big Ten", away: "Western Michigan", home: "Michigan", kickoff: "Sat 9/5 \u00b7 7:30 PM ET",
    spread: { favorite: "home", line: 24.5, odds: -110 },
    moneyline: { home: -2200, away: 900 },
    total: { line: 47.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs27", sport: "NCAAFB", conf: "SEC", away: "Florida Atlantic", home: "Florida", kickoff: "Sat 9/5 \u00b7 7:45 PM ET",
    spread: { favorite: "home", line: 23.5, odds: -110 },
    moneyline: { home: -2000, away: 850 },
    total: { line: 56.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs28", sport: "NCAAFB", conf: "ACC vs Big Ten", away: "UCLA", home: "California", kickoff: "Sat 9/5 \u00b7 10:30 PM ET",
    spread: { favorite: "home", line: 3.5, odds: -110 },
    moneyline: { home: -175, away: 150 },
    total: { line: 54.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs29", sport: "NCAAFB", conf: "Big Ten vs Pac-12", away: "Washington State", home: "Washington", kickoff: "Sun 9/6 \u00b7 4:00 PM ET",
    spread: { favorite: "home", line: 13.5, odds: -110 },
    moneyline: { home: -650, away: 480 },
    total: { line: 50.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs30", sport: "NCAAFB", conf: "SEC vs ACC", away: "Louisville", home: "Ole Miss", kickoff: "Sun 9/6 \u00b7 7:30 PM ET (Nashville)",
    spread: { favorite: "home", line: 3.5, odds: -110 },
    moneyline: { home: -175, away: 150 },
    total: { line: 58.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs31", sport: "NCAAFB", conf: "Independent vs Big Ten", away: "Wisconsin", home: "Notre Dame", kickoff: "Sun 9/6 \u00b7 7:30 PM ET (Green Bay)",
    spread: { favorite: "home", line: 6.5, odds: -110 },
    moneyline: { home: -250, away: 210 },
    total: { line: 46.5, overOdds: -110, underOdds: -110 },
  },
  {
    id: "fbs32", sport: "NCAAFB", conf: "ACC", away: "SMU", home: "Florida State", kickoff: "Mon 9/7 \u00b7 7:30 PM ET",
    spread: { favorite: "away", line: 2.5, odds: -110 },
    moneyline: { home: 115, away: -135 },
    total: { line: 55.5, overOdds: -110, underOdds: -110 },
  },
];


function signed(n) {
  return n > 0 ? "+" + n : String(n);
}

function sideOptions(game, market) {
  if (market === "Spread") {
    const awayLine = game.spread.favorite === "away" ? -game.spread.line : game.spread.line;
    const homeLine = game.spread.favorite === "home" ? -game.spread.line : game.spread.line;
    return [
      { label: game.away + " " + signed(awayLine), odds: game.spread.odds },
      { label: game.home + " " + signed(homeLine), odds: game.spread.odds },
    ];
  }
  if (market === "Moneyline") {
    return [
      { label: game.away + " ML", odds: game.moneyline.away },
      { label: game.home + " ML", odds: game.moneyline.home },
    ];
  }
  return [
    { label: "Over " + game.total.line, odds: game.total.overOdds },
    { label: "Under " + game.total.line, odds: game.total.underOdds },
  ];
}

function oppositeSide(game, pick) {
  const opts = sideOptions(game, pick.market);
  return opts.find((o) => o.label !== pick.pick) || opts[0];
}

function lineSummary(game) {
  const favTeam = game.spread.favorite === "home" ? game.home : game.away;
  return favTeam + " -" + game.spread.line + " \u00b7 O/U " + game.total.line;
}

const INITIAL_FEED = [
  { id: "p1", user: "casey", game: "fbs25", market: "Spread", pick: "LSU -2.5", odds: -110, stake: 2, note: "Death Valley at night is never a fair fight. Tigers get it done late." },
  { id: "p2", user: "priya", game: "fbs25", market: "Spread", pick: "Clemson +2.5", odds: -110, stake: 1.5, note: "Backing the D again." },
  { id: "p3", user: "marcus", game: "fbs25", market: "Total", pick: "Under 51.5", odds: -110, stake: 1, note: "" },
  { id: "p4", user: "devon", game: "fbs31", market: "Spread", pick: "Notre Dame -6.5", odds: -110, stake: 3, note: "Not fading the Irish at a neutral site to open the year." },
  { id: "p5", user: "alicia", game: "fbs31", market: "Spread", pick: "Wisconsin +6.5", odds: -110, stake: 2, note: "" },
  { id: "p6", user: "sam", game: "nfl16", market: "Moneyline", pick: "Broncos ML", odds: 225, stake: 1, note: "Home dog on Monday night, always a live watch." },
  { id: "p7", user: "nate", game: "nfl16", market: "Spread", pick: "Chiefs -6.5", odds: -110, stake: 2, note: "" },
];


const MATCHUPS = {
  NFL: [["Ravens", "Steelers"], ["49ers", "Seahawks"], ["Chiefs", "Bills"], ["Cowboys", "Eagles"]],
  NCAAFB: [["Georgia", "Tennessee"], ["Ohio State", "Michigan"], ["Alabama", "Auburn"], ["Texas", "Oklahoma"]],
};
const TEAM_CONF = {
  Ravens: "AFC North", Steelers: "AFC North",
  "49ers": "NFC West", Seahawks: "NFC West",
  Chiefs: "AFC West", Bills: "AFC East",
  Cowboys: "NFC East", Eagles: "NFC East",
  Georgia: "SEC", Tennessee: "SEC", Alabama: "SEC", Auburn: "SEC",
  "Ohio State": "Big Ten", Michigan: "Big Ten",
  Texas: "Big 12", Oklahoma: "Big 12",
};

function genHistory() {
  const sports = ["NFL", "NCAAFB"];
  const markets = ["Spread", "Moneyline", "Total"];
  const results = ["win", "win", "loss", "loss", "push"];
  const sources = ["own", "own", "own", "tail", "fade"];
  const rows = [];
  let id = 0;
  USERS.forEach((u) => {
    const n = 14 + (u.id.length % 5) * 3;
    for (let i = 0; i < n; i++) {
      const sport = sports[(i + u.id.length) % 2];
      const matchups = MATCHUPS[sport];
      const matchup = matchups[(i * 3 + u.id.length) % matchups.length];
      const teamA = matchup[0], teamB = matchup[1];
      const conf = TEAM_CONF[teamA];
      const market = markets[(i + 1) % markets.length];
      const result = results[(i * 7 + u.id.length * 3) % results.length];
      const source = sources[(i * 11 + u.id.length * 5) % sources.length];
      const stake = [1, 1, 1.5, 2, 2, 3][(i * 5 + u.id.length) % 6];
      const clv = ((i * 13 + u.id.length * 7) % 21) - 10;
      const daysAgo = (i * 17 + u.id.length * 11) % 90;
      const pickedTeam = market === "Total" ? null : ((i + u.id.length) % 2 === 0 ? teamA : teamB);
      const overUnder = market === "Total" ? ((i + u.id.length) % 2 === 0 ? "Over" : "Under") : null;
      rows.push({
        id: "h" + id++, user: u.id, sport, conf, market, result, source, stake, clv,
        week: (i % 12) + 1, daysAgo, teamA, teamB, pickedTeam, overUnder,
      });
    }
  });
  return rows;
}
const HISTORY = genHistory();

function payoutUnits(stake, result) {
  if (result === "win") return stake * 0.91;
  if (result === "loss") return -stake;
  return 0;
}

function aggregate(rows) {
  const wins = rows.filter((r) => r.result === "win").length;
  const losses = rows.filter((r) => r.result === "loss").length;
  const pushes = rows.filter((r) => r.result === "push").length;
  const decided = wins + losses;
  const winPct = decided ? Math.round((wins / decided) * 100) : 0;
  const units = rows.reduce((s, r) => s + payoutUnits(r.stake, r.result), 0);
  const avgClv = rows.length ? rows.reduce((s, r) => s + r.clv, 0) / rows.length : 0;
  return {
    wins, losses, pushes, winPct,
    units: Math.round(units * 10) / 10,
    avgClv: Math.round(avgClv * 10) / 10,
    n: rows.length,
  };
}

function groupBy(rows, key) {
  const groups = {};
  rows.forEach((r) => {
    const k = r[key];
    if (!groups[k]) groups[k] = [];
    groups[k].push(r);
  });
  return groups;
}

function teamStats(rows) {
  const teams = Array.from(new Set(rows.flatMap((r) => [r.teamA, r.teamB]))).sort();
  return teams.map((team) => {
    const involved = rows.filter((r) => r.teamA === team || r.teamB === team);
    const forRows = involved.filter((r) => r.pickedTeam === team);
    const againstRows = involved.filter((r) => r.pickedTeam && r.pickedTeam !== team);
    const overRows = involved.filter((r) => r.overUnder === "Over");
    const underRows = involved.filter((r) => r.overUnder === "Under");
    return {
      team,
      sport: involved.length ? involved[0].sport : null,
      for: aggregate(forRows),
      against: aggregate(againstRows),
      overs: aggregate(overRows),
      unders: aggregate(underRows),
      combined: aggregate(involved),
    };
  });
}

function pct(agg) {
  return (agg.wins + agg.losses) > 0 ? agg.winPct + "%" : "\u2014";
}

export default function App() {
  const [tab, setTab] = useState("slate");
  const [feed, setFeed] = useState(INITIAL_FEED);
  const [tailsFades, setTailsFades] = useState([]);
  const [radar, setRadar] = useState([]);
  const [expanded, setExpanded] = useState({ NFL: false, NCAAFB: false });
  const [analyticsUser, setAnalyticsUser] = useState(ME.id);
  const [overlay, setOverlay] = useState(null); // { pick, game }

  function addPick(gameId, pick) {
    setFeed((prev) => [
      ...prev.filter((p) => !(p.user === ME.id && p.game === gameId && p.market === pick.market)),
      { id: "p" + Date.now(), user: ME.id, game: gameId, ...pick },
    ]);
    setRadar((prev) => prev.filter((r) => !(r.user === ME.id && r.game === gameId && r.market === pick.market && r.pick === pick.pick)));
    setTailsFades((prev) => prev.filter((t) => !(t.game === gameId && t.market === pick.market && t.pick === pick.pick)));
  }

  function addRadar(gameId, pick) {
    setRadar((prev) => [
      ...prev.filter((r) => !(r.user === ME.id && r.game === gameId && r.market === pick.market)),
      { id: "r" + Date.now(), user: ME.id, game: gameId, ...pick },
    ]);
  }

  function removeRadar(gameId, market, pick) {
    setRadar((prev) => prev.filter((r) => !(r.user === ME.id && r.game === gameId && r.market === market && r.pick === pick)));
  }

  function toggleSection(sport) {
    setExpanded((prev) => ({ ...prev, [sport]: !prev[sport] }));
  }

  function openOverlay(pick, game) {
    setOverlay({ pick, game });
  }
  function closeOverlay() {
    setOverlay(null);
  }

  function addToSheet(stake) {
    if (!overlay) return;
    const { pick, game } = overlay;
    addPick(game.id, { market: pick.market, pick: pick.pick, odds: pick.odds, stake: stake != null ? stake : pick.stake, note: "" });
    closeOverlay();
  }

  function addTailFade(type) {
    if (!overlay) return;
    const { pick, game } = overlay;
    const side = type === "tail" ? { label: pick.pick, odds: pick.odds } : oppositeSide(game, pick);
    setTailsFades((prev) => [
      ...prev.filter((t) => t.game !== game.id),
      {
        id: "tf" + Date.now(),
        type,
        sourceUser: pick.user,
        game: game.id,
        market: pick.market,
        pick: side.label,
        odds: side.odds,
        stake: pick.stake,
      },
    ]);
    closeOverlay();
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: "#E7EAF0", fontFamily: FONT_BODY }}>
      <style>{"::selection { background: " + COLORS.gold + "; color: #14171E; } input[type=range]{accent-color:" + COLORS.gold + ";}"}</style>

      <TopNav tab={tab} setTab={setTab} sheetCount={tailsFades.length + radar.length} />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 20px 80px" }}>
        {tab === "slate" && (
          <SlateTab feed={feed} radar={radar} tailsFades={tailsFades} addPick={addPick} addRadar={addRadar} removeRadar={removeRadar} expanded={expanded} toggleSection={toggleSection} onOpenOverlay={openOverlay} />
        )}
        {tab === "sheet" && <SheetTab feed={feed} tailsFades={tailsFades} radar={radar} />}
        {tab === "analytics" && (
          <AnalyticsTab analyticsUser={analyticsUser} setAnalyticsUser={setAnalyticsUser} />
        )}
      </main>

      {overlay && (
        <PickOverlay
          pick={overlay.pick}
          game={overlay.game}
          onClose={closeOverlay}
          onAddToSheet={addToSheet}
          onTail={() => addTailFade("tail")}
          onFade={() => addTailFade("fade")}
        />
      )}
    </div>
  );
}

function TopNav({ tab, setTab, sheetCount }) {
  const tabs = [
    { id: "slate", label: "Slate" },
    { id: "sheet", label: "My Sheet", badge: sheetCount },
    { id: "analytics", label: "Analytics" },
  ];
  return (
    <header style={{ borderBottom: "1px solid " + COLORS.line, position: "sticky", top: 0, zIndex: 20, background: "rgba(15,21,33,0.92)" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, letterSpacing: 0.5, color: COLORS.paper }}>SLATE</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, letterSpacing: 1 }}>WK 9 &middot; 10 IN THE GROUP</span>
        </div>
        <Avatar user={ME} size={32} />
      </div>
      <nav style={{ display: "flex", gap: 22, marginTop: 16, paddingLeft: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              paddingBottom: 12, fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
              color: tab === t.id ? COLORS.paper : COLORS.muted,
              borderBottom: tab === t.id ? "2px solid " + COLORS.gold : "2px solid transparent",
            }}
          >
            {t.label}
            {!!t.badge && (
              <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, background: COLORS.gold, color: "#1A1305", borderRadius: 20, padding: "1px 6px" }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </header>
  );
}

function Avatar({ user, size }) {
  const s = size || 28;
  const initials = user.name.slice(0, 2).toUpperCase();
  return (
    <div
      title={user.name}
      style={{
        width: s, height: s, borderRadius: "50%", background: user.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT_MONO, fontSize: s * 0.36, fontWeight: 600, color: "#14171E", flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ---------------- Slate tab ----------------
function SlateTab({ feed, radar, tailsFades, addPick, addRadar, removeRadar, expanded, toggleSection, onOpenOverlay }) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const matches = (g) => !term || g.away.toLowerCase().includes(term) || g.home.toLowerCase().includes(term);

  const groups = [
    { key: "NFL", label: "NFL", games: GAMES.filter((g) => g.sport === "NFL" && matches(g)) },
    { key: "NCAAFB", label: "NCAAFB", games: GAMES.filter((g) => g.sport === "NCAAFB" && matches(g)) },
  ];
  const totalMatches = groups.reduce((s, g) => s + g.games.length, 0);

  return (
    <div>
      <SearchBox value={search} onChange={setSearch} placeholder="Search by team" />
      {term && totalMatches === 0 && (
        <div style={{ fontSize: 13, color: COLORS.muted, padding: "16px 4px" }}>No games match &ldquo;{search}&rdquo;.</div>
      )}
      <div style={{ display: "grid", gap: 16, marginTop: 4 }}>
        {groups.map((grp) => (
          grp.games.length > 0 && (
            <CollapsibleGroup
              key={grp.key}
              label={grp.label}
              count={grp.games.length}
              open={expanded[grp.key]}
              onToggle={() => toggleSection(grp.key)}
            >
              <div style={{ display: "grid", gap: 12 }}>
                {grp.games.map((g) => (
                  <GameTicket
                    key={g.id}
                    game={g}
                    picks={feed.filter((p) => p.game === g.id)}
                    radarPicks={radar.filter((r) => r.game === g.id)}
                    tailFadePicks={tailsFades.filter((t) => t.game === g.id)}
                    onAddPick={(pick) => addPick(g.id, pick)}
                    onAddRadar={(pick) => addRadar(g.id, pick)}
                    onRemoveRadar={(market, pick) => removeRadar(g.id, market, pick)}
                    onOpenOverlay={onOpenOverlay}
                  />
                ))}
              </div>
            </CollapsibleGroup>
          )
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ eyebrow, title }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1.5, color: COLORS.gold, marginBottom: 4 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, margin: 0, color: COLORS.paper }}>{title}</h2>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <Search size={15} color={COLORS.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: COLORS.surface, color: COLORS.paper, border: "1px solid " + COLORS.line,
          borderRadius: 9, padding: "10px 12px 10px 36px", fontSize: 13.5, boxSizing: "border-box",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: COLORS.muted, cursor: "pointer", display: "flex" }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function CollapsibleGroup({ label, count, open, onToggle, children }) {
  return (
    <div style={{ background: COLORS.surface, borderRadius: 12, border: "1px solid " + COLORS.line, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 16px", background: COLORS.surface2, border: "none", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.paper }}>{label}</span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, background: COLORS.surface3, padding: "2px 7px", borderRadius: 20 }}>
            {count}
          </span>
        </div>
        {open ? <ChevronUp size={18} color={COLORS.muted} /> : <ChevronDown size={18} color={COLORS.muted} />}
      </button>
      {open && <div style={{ padding: 12 }}>{children}</div>}
    </div>
  );
}

function GameTicket({ game, picks, radarPicks, tailFadePicks, onAddPick, onAddRadar, onRemoveRadar, onOpenOverlay }) {
  const [formOpen, setFormOpen] = useState(false);
  const [market, setMarket] = useState("Spread");
  const [side, setSide] = useState(null);
  const [stake, setStake] = useState(1);
  const [note, setNote] = useState("");

  const myPicks = picks.filter((p) => p.user === ME.id);
  const othersPicks = picks.filter((p) => p.user !== ME.id);
  const myRadars = radarPicks.filter((r) => r.user === ME.id);
  const myTailFade = tailFadePicks.length ? tailFadePicks[0] : null;
  const isMatchingTailFade = !!(side && myTailFade && myTailFade.market === market && myTailFade.pick === side.label);

  const lockedCounts = {};
  picks.forEach((p) => {
    lockedCounts[p.pick] = (lockedCounts[p.pick] || 0) + 1;
  });
  const tailCounts = {};
  const fadeCounts = {};
  tailFadePicks.forEach((t) => {
    const bucket = t.type === "fade" ? fadeCounts : tailCounts;
    bucket[t.pick] = (bucket[t.pick] || 0) + 1;
  });
  const radarCounts = {};
  radarPicks.forEach((r) => {
    radarCounts[r.pick] = (radarCounts[r.pick] || 0) + 1;
  });
  const sides = Array.from(new Set([
    ...Object.keys(lockedCounts), ...Object.keys(tailCounts), ...Object.keys(fadeCounts), ...Object.keys(radarCounts),
  ]));
  const grandTotal = picks.length + radarPicks.length + tailFadePicks.length;

  function openForm() {
    setMarket("Spread");
    setSide(null);
    setStake(1);
    setNote("");
    setFormOpen(true);
  }

  function openFormFromRadar(radar) {
    setMarket(radar.market);
    setSide({ label: radar.pick, odds: radar.odds });
    setStake(radar.stake);
    setNote(radar.note || "");
    setFormOpen(true);
  }

  function onCancelRadarClick(radar) {
    onRemoveRadar(radar.market, radar.pick);
  }

  function lockPick() {
    if (!side) return;
    onAddPick({ market, pick: side.label, odds: side.odds, stake, note });
    setFormOpen(false);
  }

  function radarPick() {
    if (!side) return;
    onAddRadar({ market, pick: side.label, odds: side.odds, stake, note });
    setFormOpen(false);
  }

  return (
    <div style={{ background: COLORS.surface2, borderRadius: 10, border: "1px solid " + COLORS.line, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px dashed " + COLORS.line }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.muted }}>{game.conf}</span>
          {myRadars.length > 0 && <Radar size={13} color={COLORS.gold} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.muted }}>
          <Clock size={13} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 12 }}>{game.kickoff}</span>
        </div>
      </div>

      <div style={{ padding: "14px 14px 4px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: COLORS.paper }}>
          {game.away} <span style={{ color: COLORS.muted, fontWeight: 500 }}>at</span> {game.home}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: COLORS.muted, marginTop: 2 }}>
          {lineSummary(game)}
        </div>
      </div>

      {grandTotal > 0 && (
        <div style={{ padding: "10px 14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, letterSpacing: 0.8, marginBottom: 6 }}>
            <span>{grandTotal} PICK{grandTotal !== 1 ? "S" : ""} LOGGED</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: COLORS.green, display: "inline-block" }} /> locked/tail
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: COLORS.blue, display: "inline-block" }} /> fade
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: "rgba(217,164,65,0.45)", display: "inline-block" }} /> radar
            </span>
          </div>
          {sides.map((s) => {
            const lockedCount = lockedCounts[s] || 0;
            const tailCount = tailCounts[s] || 0;
            const fadeCount = fadeCounts[s] || 0;
            const radarCount = radarCounts[s] || 0;
            const sideTotal = lockedCount + tailCount + fadeCount + radarCount;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <div style={{ fontSize: 12.5, width: 145, flexShrink: 0 }}>{s}</div>
                <div style={{ flex: 1, background: COLORS.surface3, borderRadius: 4, height: 7, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: ((lockedCount + tailCount) / grandTotal) * 100 + "%", background: COLORS.green, height: "100%" }} />
                  <div style={{ width: (fadeCount / grandTotal) * 100 + "%", background: COLORS.blue, height: "100%" }} />
                  <div style={{ width: (radarCount / grandTotal) * 100 + "%", background: "rgba(217,164,65,0.45)", height: "100%" }} />
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.muted, width: 16, textAlign: "right" }}>{sideTotal}</div>
              </div>
            );
          })}
        </div>
      )}

      {othersPicks.length > 0 && (
        <div style={{ padding: "8px 14px 4px" }}>
          {othersPicks.map((p) => {
            const u = USERS.find((x) => x.id === p.user);
            return (
              <button
                key={p.id}
                onClick={() => onOpenOverlay(p, game)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 4px",
                  background: "none", border: "none", cursor: "pointer", textAlign: "left", borderRadius: 6,
                }}
              >
                <Avatar user={u} size={22} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>{u.name}</span>
                  <span style={{ color: COLORS.muted }}>&middot; {p.market}</span>
                  {p.note && <MessageSquare size={13} color={COLORS.gold} />}
                </div>
                <div style={{ fontFamily: FONT_MONO, textAlign: "right", fontSize: 12.5 }}>
                  <div style={{ color: COLORS.paper }}>{p.pick}</div>
                  <div style={{ color: COLORS.muted }}>{signed(p.odds)} &middot; {p.stake}u</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* --- inline pick area, no navigation away from the slate --- */}
      <div style={{ padding: 14, borderTop: "1px solid " + COLORS.line, marginTop: 4 }}>
        {(myPicks.length > 0 || myTailFade || myRadars.length > 0) && (
          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
            {myPicks.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, background: "rgba(76,154,106,0.12)", border: "1px solid rgba(76,154,106,0.4)", borderRadius: 8, padding: "9px 12px" }}>
                <Check size={15} color={COLORS.green} />
                <span>Your pick: <strong>{p.pick}</strong> &middot; {signed(p.odds)} &middot; {p.stake}u</span>
              </div>
            ))}

            {myTailFade && (() => {
              const srcUser = USERS.find((x) => x.id === myTailFade.sourceUser);
              const isFade = myTailFade.type === "fade";
              return (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, fontSize: 13,
                  background: isFade ? "rgba(62,124,214,0.12)" : "rgba(76,154,106,0.12)",
                  border: "1px solid " + (isFade ? "rgba(62,124,214,0.4)" : "rgba(76,154,106,0.4)"),
                  borderRadius: 8, padding: "9px 12px",
                }}>
                  {isFade ? <Shuffle size={15} color={COLORS.blue} /> : <Copy size={15} color={COLORS.green} />}
                  <span>
                    {isFade ? "Fading" : "Tailing"} <strong>{srcUser ? srcUser.name : "a friend"}</strong>: <strong>{myTailFade.pick}</strong> &middot; {signed(myTailFade.odds)} &middot; {myTailFade.stake}u
                  </span>
                </div>
              );
            })()}

            {myRadars.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(217,164,65,0.12)", border: "1px solid rgba(217,164,65,0.4)", borderRadius: 8, padding: "9px 12px", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, minWidth: 0 }}>
                  <Radar size={15} color={COLORS.gold} />
                  <span>On your radar: <strong>{r.pick}</strong> &middot; {signed(r.odds)} &middot; {r.stake}u</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <button onClick={() => openFormFromRadar(r)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: COLORS.gold, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    <Lock size={13} /> Lock
                  </button>
                  <button onClick={() => onCancelRadarClick(r)} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!formOpen && (
          <button
            onClick={openForm}
            style={{ width: "100%", background: "transparent", border: "1px dashed " + COLORS.gold, color: COLORS.gold, borderRadius: 8, padding: "10px 0", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            + Make your pick
          </button>
        )}

        {formOpen && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {["Spread", "Moneyline", "Total"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMarket(m); setSide(null); }}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    border: "1px solid " + (market === m ? COLORS.gold : COLORS.line),
                    background: market === m ? "rgba(217,164,65,0.12)" : "transparent",
                    color: market === m ? COLORS.gold : COLORS.muted,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {sideOptions(game, market).map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSide(opt)}
                  style={{
                    flex: 1, borderRadius: 8, padding: "10px 8px", cursor: "pointer", textAlign: "left",
                    border: "1px solid " + (side && side.label === opt.label ? COLORS.gold : COLORS.line),
                    background: side && side.label === opt.label ? "rgba(217,164,65,0.14)" : COLORS.surface3,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.paper }}>{opt.label}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.muted }}>{signed(opt.odds)}</div>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>
                STAKE &mdash; {stake} UNIT{stake !== 1 ? "S" : ""}
              </div>
              <input
                type="range" min="0.5" max="5" step="0.5" value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                placeholder="Note to the group (optional)"
                maxLength={NOTE_MAX}
                rows={4}
                style={{
                  width: "100%", background: COLORS.surface3, color: COLORS.paper, border: "1px solid " + COLORS.line,
                  borderRadius: 7, padding: "10px 12px", fontSize: 13.5, boxSizing: "border-box", resize: "vertical",
                  fontFamily: FONT_BODY, lineHeight: 1.4, minHeight: 84,
                }}
              />
              <div style={{ textAlign: "right", fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, marginTop: 4 }}>
                {note.length}/{NOTE_MAX}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={() => setFormOpen(false)}
                style={{ flex: 1, background: "none", border: "1px solid " + COLORS.line, color: COLORS.muted, borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={radarPick}
                disabled={!side}
                style={{
                  flex: 1.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: "none", color: side ? COLORS.gold : COLORS.muted,
                  border: "1px solid " + (side ? COLORS.gold : COLORS.line), borderRadius: 8, padding: "9px 0", fontSize: 13, fontWeight: 600,
                  cursor: side ? "pointer" : "not-allowed",
                }}
              >
                <Radar size={14} /> Add to Radar
              </button>
            </div>
            <button
              onClick={lockPick}
              disabled={!side}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: side ? COLORS.gold : COLORS.surface3, color: side ? "#1A1305" : COLORS.muted,
                border: "none", borderRadius: 8, padding: "9px 0", fontSize: 13.5, fontWeight: 700,
                cursor: side ? "pointer" : "not-allowed",
              }}
            >
              <Lock size={14} />
              {isMatchingTailFade ? "Switch " + (myTailFade.type === "fade" ? "Fade" : "Tail") + " to Pick" : "Lock in pick"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Pick detail overlay (comment + tail/fade) ----------------
function PickOverlay({ pick, game, onClose, onAddToSheet, onTail, onFade }) {
  const u = USERS.find((x) => x.id === pick.user);
  const [stake, setStake] = useState(pick.stake);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(8,11,17,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.surface, width: "100%", maxWidth: 480, borderRadius: "18px 18px 0 0", border: "1px solid " + COLORS.line, borderBottom: "none", padding: 22, maxHeight: "85vh", overflowY: "auto", fontFamily: FONT_BODY }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar user={u} size={34} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.paper }}>{u.name}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.muted }}>{game.away} at {game.home}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: COLORS.surface2, border: "1px solid " + COLORS.line, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, letterSpacing: 0.8, marginBottom: 6 }}>{pick.market.toUpperCase()}</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: COLORS.paper }}>{pick.pick}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: COLORS.muted }}>{signed(pick.odds)}</div>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: COLORS.muted, marginTop: 2 }}>{u.name} bet {pick.stake} unit{pick.stake !== 1 ? "s" : ""}</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, letterSpacing: 0.8, marginBottom: 6 }}>COMMENT</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: pick.note ? COLORS.paper : COLORS.muted, fontStyle: pick.note ? "normal" : "italic" }}>
            {pick.note || "No comment left on this pick."}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>
            YOUR STAKE &mdash; {stake} UNIT{stake !== 1 ? "S" : ""}
          </div>
          <input
            type="range" min="0.5" max="5" step="0.5" value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <button
          onClick={() => onAddToSheet(stake)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: COLORS.gold, color: "#1A1305", border: "none", borderRadius: 10,
            padding: "13px 0", fontSize: 14.5, fontWeight: 700, cursor: "pointer",
          }}
        >
          <Plus size={16} strokeWidth={2.5} /> Add to sheet
        </button>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, textAlign: "center", marginTop: 6 }}>
          Makes {pick.pick} your own pick at {stake}u, graded in your main record
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: COLORS.line }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted }}>OR JUST GO WITH THEIRS</span>
          <div style={{ flex: 1, height: 1, background: COLORS.line }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onTail}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: "1px solid " + COLORS.line, color: COLORS.muted, borderRadius: 8, padding: "9px 0", cursor: "pointer" }}
          >
            <Copy size={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Tail</span>
          </button>
          <button
            onClick={onFade}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "none", border: "1px solid " + COLORS.line, color: COLORS.muted, borderRadius: 8, padding: "9px 0", cursor: "pointer" }}
          >
            <Shuffle size={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Fade</span>
          </button>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, textAlign: "center", marginTop: 8 }}>
          No thinking required — copies {u.name}'s side or takes the other one, at their stake, tracked in a separate record.
        </div>
      </div>
    </div>
  );
}

// ---------------- My Sheet tab ----------------
function SheetTab({ feed, tailsFades, radar }) {
  const myPicks = feed.filter((p) => p.user === ME.id);
  const [historySearch, setHistorySearch] = useState("");
  const term = historySearch.trim().toLowerCase();

  const allHistory = useMemo(
    () => HISTORY.filter((r) => r.user === ME.id).sort((a, b) => a.daysAgo - b.daysAgo),
    []
  );
  const history = useMemo(() => {
    const filtered = term
      ? allHistory.filter((r) => r.teamA.toLowerCase().includes(term) || r.teamB.toLowerCase().includes(term))
      : allHistory;
    return filtered.slice(0, 12);
  }, [allHistory, term]);

  return (
    <div>
      <SectionLabel eyebrow="YOUR BOARD" title="My sheet" />

      <ChartBlock title="Your picks" subtitle="Made directly from the slate — graded in your main win %">
        {myPicks.length === 0 && <EmptyRow text="No picks logged yet. Head to the Slate to add one." />}
        {myPicks.map((p) => (
          <SheetRow key={p.id} pick={p} tag={null} />
        ))}
      </ChartBlock>

      <ChartBlock title="Tails &amp; fades" subtitle="Copied from a friend's pick — graded in a separate win %, kept apart from your own picks">
        {tailsFades.length === 0 && <EmptyRow text="Tail or fade a friend's pick from the Slate to see it here." />}
        {tailsFades.map((p) => (
          <SheetRow key={p.id} pick={p} tag={p.type} />
        ))}
      </ChartBlock>

      <ChartBlock title="Radar" subtitle="Still looking into these — not locked in, doesn't count toward any record yet">
        {radar.length === 0 && <EmptyRow text="Add a pick to your radar from the Slate to see it here." />}
        {radar.map((r) => (
          <SheetRow key={r.id} pick={r} tag="radar" />
        ))}
      </ChartBlock>

      <ChartBlock title="History" subtitle="Settled picks from past weeks — demo data so Analytics has something to show">
        <SearchBox value={historySearch} onChange={setHistorySearch} placeholder="Search by team" />
        {history.length === 0 && <EmptyRow text={term ? "No settled picks match \u201c" + historySearch + "\u201d." : "Nothing graded yet."} />}
        {history.map((r) => (
          <HistoryRow key={r.id} row={r} />
        ))}
      </ChartBlock>
    </div>
  );
}

function EmptyRow({ text }) {
  return <div style={{ fontSize: 13, color: COLORS.muted, padding: "10px 2px" }}>{text}</div>;
}

function SheetRow({ pick, tag }) {
  const game = GAMES.find((g) => g.id === pick.game);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px", borderBottom: "1px solid " + COLORS.line }}>
      {tag && (
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, borderRadius: 5, padding: "2px 7px", flexShrink: 0,
          color: tag === "tail" ? COLORS.green : tag === "fade" ? COLORS.red : COLORS.gold,
          background: tag === "tail" ? "rgba(76,154,106,0.14)" : tag === "fade" ? "rgba(194,75,63,0.14)" : "rgba(217,164,65,0.14)",
        }}>
          {tag.toUpperCase()}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{game ? game.away + " @ " + game.home : pick.game}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.muted }}>{pick.market}</div>
      </div>
      <div style={{ fontFamily: FONT_MONO, textAlign: "right", fontSize: 12.5 }}>
        <div style={{ color: COLORS.paper }}>{pick.pick}</div>
        <div style={{ color: COLORS.muted }}>{signed(pick.odds)} &middot; {pick.stake}u</div>
      </div>
    </div>
  );
}

function historyPickLabel(row) {
  if (row.market === "Total") return row.overUnder + " (total)";
  return row.pickedTeam + (row.market === "Spread" ? " (spread)" : " (ML)");
}

function HistoryRow({ row }) {
  const resultColor = row.result === "win" ? COLORS.green : row.result === "loss" ? COLORS.red : COLORS.muted;
  const resultLabel = row.result === "win" ? "W" : row.result === "loss" ? "L" : "P";
  const units = payoutUnits(row.stake, row.result);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 2px", borderBottom: "1px solid " + COLORS.line }}>
      <span style={{
        fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, width: 22, height: 22, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        color: resultColor, background: "rgba(255,255,255,0.06)",
      }}>
        {resultLabel}
      </span>
      {row.source !== "own" && (
        <span style={{
          fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 6px", flexShrink: 0,
          color: row.source === "tail" ? COLORS.green : COLORS.red,
          background: row.source === "tail" ? "rgba(76,154,106,0.14)" : "rgba(194,75,63,0.14)",
        }}>
          {row.source.toUpperCase()}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{row.teamA} @ {row.teamB}</div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.muted }}>{row.sport} &middot; {row.daysAgo}d ago</div>
      </div>
      <div style={{ fontFamily: FONT_MONO, textAlign: "right", fontSize: 12.5 }}>
        <div style={{ color: COLORS.paper }}>{historyPickLabel(row)}</div>
        <div style={{ color: units >= 0 ? COLORS.green : COLORS.red }}>{units >= 0 ? "+" : ""}{Math.round(units * 10) / 10}u</div>
      </div>
    </div>
  );
}

// ---------------- Analytics tab ----------------
function AnalyticsTab({ analyticsUser, setAnalyticsUser }) {
  const rows = useMemo(() => HISTORY.filter((r) => r.user === analyticsUser), [analyticsUser]);
  const ownRows = useMemo(() => rows.filter((r) => r.source === "own"), [rows]);
  const tfRows = useMemo(() => rows.filter((r) => r.source !== "own"), [rows]);

  const bySport = useMemo(() => {
    const g = groupBy(rows, "sport");
    return Object.keys(g).map((k) => ({ name: k, ...aggregate(g[k]) }));
  }, [rows]);

  const byConf = useMemo(() => {
    const g = groupBy(rows, "conf");
    return Object.keys(g)
      .map((k) => ({ name: k, sport: g[k][0] ? g[k][0].sport : null, ...aggregate(g[k]) }))
      .sort((a, b) => b.units - a.units);
  }, [rows]);
  const byConfNFL = byConf.filter((c) => c.sport === "NFL");
  const byConfNCAAFB = byConf.filter((c) => c.sport === "NCAAFB");

  const byTeam = useMemo(() => teamStats(rows), [rows]);

  const byMarket = useMemo(() => {
    const g = groupBy(rows, "market");
    return Object.keys(g).map((k) => ({ name: k, ...aggregate(g[k]) }));
  }, [rows]);

  const trend = useMemo(() => {
    const byWeek = groupBy(rows, "week");
    const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);
    let cum = 0;
    return weeks.map((week) => {
      const rs = byWeek[week];
      cum += rs.reduce((s, r) => s + payoutUnits(r.stake, r.result), 0);
      return { week: "Wk " + week, units: Math.round(cum * 10) / 10 };
    });
  }, [rows]);

  const overall = aggregate(rows);
  const own = aggregate(ownRows);
  const tf = aggregate(tfRows);
  const last7 = aggregate(rows.filter((r) => r.daysAgo <= 7));
  const last30 = aggregate(rows.filter((r) => r.daysAgo <= 30));
  const allTime = overall;
  const user = USERS.find((u) => u.id === analyticsUser);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <SectionLabel eyebrow="PICK ANALYTICS" title="How everyone actually picks" />
        <UserPicker users={USERS} value={analyticsUser} onChange={setAnalyticsUser} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 20 }}>
        <StatCard label="Record" value={overall.wins + "-" + overall.losses + "-" + overall.pushes} />
        <StatCard label="Win %" value={overall.winPct + "%"} />
        <StatCard label="Net units" value={(overall.units >= 0 ? "+" : "") + overall.units} tone={overall.units >= 0 ? "up" : "down"} />
        <StatCard label="Avg. closing line value" value={(overall.avgClv >= 0 ? "+" : "") + overall.avgClv} tone={overall.avgClv >= 0 ? "up" : "down"} />
      </div>

      <ChartBlock title="Win % over time" subtitle="Success rate across three windows">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <TimeWindowStat label="LAST 7 DAYS" stat={last7} />
          <TimeWindowStat label="LAST 30 DAYS" stat={last30} />
          <TimeWindowStat label="ALL TIME" stat={allTime} />
        </div>
      </ChartBlock>

      <ChartBlock title="Own picks vs. tails &amp; fades" subtitle="Kept as two separate records, same as on My Sheet">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: COLORS.surface2, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, marginBottom: 8 }}>OWN PICKS &middot; N={own.n}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>{own.winPct}%</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted }}>win rate</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: own.units >= 0 ? COLORS.green : COLORS.red }}>
                  {own.units >= 0 ? "+" : ""}{own.units}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted }}>units</div>
              </div>
            </div>
          </div>
          <div style={{ background: COLORS.surface2, borderRadius: 10, padding: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, marginBottom: 8 }}>TAILS &amp; FADES &middot; N={tf.n}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>{tf.winPct}%</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted }}>win rate</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: tf.units >= 0 ? COLORS.green : COLORS.red }}>
                  {tf.units >= 0 ? "+" : ""}{tf.units}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted }}>units</div>
              </div>
            </div>
          </div>
        </div>
      </ChartBlock>

      <ChartBlock title={user.name + "'s units by week"}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={COLORS.line} vertical={false} />
            <XAxis dataKey="week" stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: COLORS.surface2, border: "1px solid " + COLORS.line, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: COLORS.paper }} />
            <Line type="monotone" dataKey="units" stroke={COLORS.gold} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.gold }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBlock>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginTop: 20 }}>
        <ChartBlock title="Win % by sport">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bySport} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="name" stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: COLORS.surface2, border: "1px solid " + COLORS.line, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: COLORS.paper }} />
              <Bar dataKey="winPct" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>

        <ChartBlock title="Net units by bet type">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMarket} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="name" stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={COLORS.muted} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: COLORS.surface2, border: "1px solid " + COLORS.line, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: COLORS.paper }} />
              <Bar dataKey="units" radius={[4, 4, 0, 0]}>
                {byMarket.map((entry, i) => (
                  <Cell key={i} fill={entry.units >= 0 ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
      </div>

      <ChartBlock title="By conference" subtitle="Smallest samples first — check the count before you trust the trend">
        <ConfStatsTable label="NFL" rows={byConfNFL} />
        <ConfStatsTable label="NCAAFB" rows={byConfNCAAFB} />
      </ChartBlock>

      <ChartBlock title="By team" subtitle="Win % betting for, against, on overs and unders for each team you've picked">
        <TeamStatsTable label="NFL" teams={byTeam.filter((t) => t.sport === "NFL")} />
        <TeamStatsTable label="NCAAFB" teams={byTeam.filter((t) => t.sport === "NCAAFB")} />
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
          &ldquo;For&rdquo; and &ldquo;against&rdquo; cover spread and moneyline picks on that team; &ldquo;over&rdquo; and &ldquo;under&rdquo; cover total bets on their games; &ldquo;combined&rdquo; is every graded pick touching that team. &mdash; is shown where there's no decided pick yet.
        </div>
      </ChartBlock>
    </div>
  );
}

function ConfStatsTable({ label, rows }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: COLORS.gold, letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.7fr 0.8fr", gap: 8, fontSize: 11, color: COLORS.muted, padding: "6px 4px", borderBottom: "1px solid " + COLORS.line }}>
        <span>CONFERENCE</span><span>N</span><span>WIN%</span><span style={{ textAlign: "right" }}>UNITS</span>
      </div>
      {rows.length === 0 && <div style={{ fontSize: 13, color: COLORS.muted, padding: "10px 4px" }}>No graded picks yet.</div>}
      {rows.map((c, i) => (
        <div key={c.name} style={{ fontFamily: FONT_MONO, display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.7fr 0.8fr", gap: 8, fontSize: 13, padding: "8px 4px", borderBottom: i < rows.length - 1 ? "1px solid " + COLORS.line : "none" }}>
          <span style={{ fontFamily: FONT_BODY }}>{c.name}</span>
          <span style={{ color: COLORS.muted }}>{c.n}</span>
          <span>{c.winPct}%</span>
          <span style={{ textAlign: "right", color: c.units >= 0 ? COLORS.green : COLORS.red }}>{c.units >= 0 ? "+" : ""}{c.units}</span>
        </div>
      ))}
    </div>
  );
}

function TeamStatsTable({ label, teams }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: COLORS.gold, letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, display: "grid", gridTemplateColumns: "1.3fr 0.75fr 0.75fr 0.75fr 0.75fr 0.85fr", gap: 6, fontSize: 10.5, color: COLORS.muted, padding: "6px 4px", borderBottom: "1px solid " + COLORS.line }}>
        <span>TEAM</span><span>FOR</span><span>AGAINST</span><span>OVER</span><span>UNDER</span><span style={{ textAlign: "right" }}>COMBINED</span>
      </div>
      {teams.length === 0 && <div style={{ fontSize: 13, color: COLORS.muted, padding: "10px 4px" }}>No graded picks yet.</div>}
      {teams.map((t, i) => (
        <div key={t.team} style={{ fontFamily: FONT_MONO, display: "grid", gridTemplateColumns: "1.3fr 0.75fr 0.75fr 0.75fr 0.75fr 0.85fr", gap: 6, fontSize: 12.5, padding: "8px 4px", borderBottom: i < teams.length - 1 ? "1px solid " + COLORS.line : "none" }}>
          <span style={{ fontFamily: FONT_BODY, fontWeight: 600 }}>{t.team}</span>
          <span>{pct(t.for)}</span>
          <span>{pct(t.against)}</span>
          <span>{pct(t.overs)}</span>
          <span>{pct(t.unders)}</span>
          <span style={{ textAlign: "right", fontWeight: 600, color: COLORS.paper }}>{pct(t.combined)}</span>
        </div>
      ))}
    </div>
  );
}

function UserPicker({ users, value, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none", background: COLORS.surface2, color: COLORS.paper,
          border: "1px solid " + COLORS.line, borderRadius: 8, padding: "8px 32px 8px 12px",
          fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: FONT_BODY,
        }}
      >
        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: COLORS.muted }} />
    </div>
  );
}

function TimeWindowStat({ label, stat }) {
  return (
    <div style={{ background: COLORS.surface2, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginBottom: 8, letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: COLORS.paper }}>{stat.winPct}%</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.muted, marginTop: 4 }}>{stat.wins}-{stat.losses}-{stat.pushes} &middot; n={stat.n}</div>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const color = tone === "up" ? COLORS.green : tone === "down" ? COLORS.red : COLORS.paper;
  return (
    <div style={{ background: COLORS.surface, border: "1px solid " + COLORS.line, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: COLORS.muted, letterSpacing: 0.8, marginBottom: 6 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function ChartBlock({ title, subtitle, children }) {
  return (
    <div style={{ background: COLORS.surface, border: "1px solid " + COLORS.line, borderRadius: 12, padding: "16px 18px", marginTop: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.paper }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
