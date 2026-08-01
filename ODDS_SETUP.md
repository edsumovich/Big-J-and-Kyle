# Wiring up live odds (SportsGameOdds, free tier)

This adds a small pipeline: a GitHub Action polls the SportsGameOdds API three
times a day, writes the results to `data/games.json`, and the site fetches
that file at runtime — no server, no exposed API key, works on GitHub Pages.

## 1. Get a free API key
Sign up at https://sportsgameodds.com/pricing (Amateur / free plan). No
credit card required. You'll get a key emailed to you.

## 2. Add the files to your repo
Copy these into your repo, preserving the folder structure:
- `scripts/fetch-odds.js`
- `.github/workflows/update-odds.yml`
- `data/games.json` (placeholder — the Action overwrites this)

Your `index.html` should already be updated to fetch `./data/games.json` at
load time, falling back to the built-in mock schedule if that file is empty
or missing.

## 3. Add your API key as a repo secret
In your GitHub repo: **Settings → Secrets and variables → Actions → New
repository secret**
- Name: `SPORTSGAMEODDS_API_KEY`
- Value: the key you got in step 1

## 4. Turn on Actions and run it once
- Go to the **Actions** tab in your repo (enable workflows if prompted)
- Click **Update odds** → **Run workflow** to trigger it manually the first
  time, so `data/games.json` gets populated right away instead of waiting
  for the next scheduled run
- After that it runs automatically 3x/day (~7am, 1pm, 7:30pm ET — edit the
  `cron` lines in the workflow file if you want different times)

## 5. Verify
Open your deployed site. The small pill next to "SLATE" in the header reads
**LIVE ODDS** once `data/games.json` has real games in it, or **MOCK DATA**
if it's still empty / the fetch failed.

## Notes / things to double-check
- **Odds field parsing is a best effort.** I built `scripts/fetch-odds.js`
  from SportsGameOdds's public docs, but the exact key names inside each
  event's `odds` object weren't fully visible while writing this. Run the
  script once locally with `LOG_RAW=1 node scripts/fetch-odds.js` (with your
  key exported as `SPORTSGAMEODDS_API_KEY`) and check the printed sample
  event — if `total` values look wrong or missing, adjust the entity name
  guesses in `findOdd()` in `scripts/fetch-odds.js` to match what you see.
- **Free tier limits:** 2,500 "objects" per month, 10 requests/minute. Three
  polls a day is nowhere close to the rate limit. Watch your usage in the
  SportsGameOdds dashboard for the first few days to confirm you're also
  comfortably under the monthly object cap — the docs weren't fully explicit
  on whether objects are billed per unique game per month or per game
  returned per request.
- **The Odds API is not a fallback option here** — as of writing, their free
  tier is capped at 25 requests/day and limited to NBA/MLB only, so it can't
  cover NFL + NCAAFB.
