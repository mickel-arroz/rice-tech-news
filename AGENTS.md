# Rice Tech News

Bilingual (es/en) daily tech news site. A collector accumulates news from tech sources through the day, a nightly digest summarizes the closed day with Gemini and stores the result in Upstash Redis; an Astro site on Vercel (https://rice-tech-news.vercel.app) serves them. Default UI language is Spanish; code comments and pipeline logs are written in Spanish.

## Commands

```sh
npm run dev              # dev server at localhost:4321
npm run build            # production build (Vercel adapter)
npm run collect          # run the raw collector locally (needs Upstash env vars)
npm run pipeline         # run the digest locally (needs env vars)
npm run selftest         # pure-logic tests for date + digest rules (no network)
npm run pipeline -- --dry-run     # fetch sources only, list items, no Gemini/Redis
npm run pipeline -- --skip-write  # full run but print the record instead of writing to Redis
npx tsc --noEmit         # type check (no test suite or linter is configured)
```

When starting the dev server from an agent, use background mode: `astro dev --background` (manage with `astro dev stop` / `status` / `logs`).

Env vars (see `.env.example`): `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are needed by both the pipeline and the API routes; `GEMINI_API_KEY` (and optional `GEMINI_MODELS` fallback chain) only by the pipeline.

## Architecture

Two halves that share `src/lib/` (types, date logic, redis client):

**Pipeline (`scripts/`)** — two GitHub Actions, deliberately split:

*Collector* (`.github/workflows/collect-news.yml`, `scripts/collect.ts`, hourly) fetches every source and appends each item to the Redis hash `raw:<the item's own ET date>`, field = item URL so re-collecting dedupes. TTL 10 days. Never calls Gemini, never touches `news:*`. It exists because the feeds are shallow windows — The Verge exposes 10 items (~5 h), TechCrunch 20 (~24 h) — so a single daily fetch physically cannot see a whole day. Accumulating is the only way to have the day complete when it closes.

*Digest* (`.github/workflows/daily-news.yml`, `scripts/daily-news.ts`, `47 5,9,13,17 * * *` — four attempts 4 h apart):
1. `scripts/sources/factory.ts` holds `SOURCE_CONFIGS`, the source registry — adding a news source means adding one entry there (`RssSource` or `JsonApiSource` with a mapper).
2. Targets `latestPublishableDate()` — always **yesterday** in ET, derived from the ET *date*, never by subtracting hours. So any run time within the same ET day yields the same target and a delayed cron cannot shift the day. It reads `raw:<date>`, merges in a live fetch as a safety net, dedupes by URL, caps Hacker News to the top 50 by points (keeps Gemini's bilingual output clear of the 65536-token ceiling), then sorts and assigns each item an `index`.
3. `scripts/gemini.ts` sends all items in one structured-output call; Gemini clusters them into stories referencing items by `sourceIndexes` and returns everything bilingual. Falls back through a model chain on quota (429), availability (404) and overload (503) errors, flash → flash-lite → `gemma-4-31b-it` as a last resort. The chain exists because a Flash-family outage takes every Flash model down at once, which is what left days unpublished.
4. The resulting `DayRecord` is written to Redis key `news:YYYY-MM-DD` with RedisJSON (`DEL` first — `JSON.SET` fails with WRONGTYPE over a plain-string key).

`scripts/digest-rules.ts` holds the pure decisions, unit-tested by `scripts/selftest.ts`. Chief among them, `shouldKeepStored` refuses to overwrite a day with a run that collected *fewer* items, checked **before** spending a Gemini call — without it a thin run silently destroys a good day, which is how the site decayed from 21 stories to 1. On the automatic run it compares with `>=` instead of `>`, so the day's later attempts exit 0 without calling Gemini once one of them has published. That is deliberately a count comparison and not "the key exists": GitHub's `schedule` has been observed 5-12 h late, and a run delayed past ET midnight would publish the day barely after it closed — a later attempt that sees more items must still be able to improve it.

**Never rewrites a published day; does fill total gaps.** The digest never decides on its own to *rewrite* a day that already has a record — re-doing one is a deliberate, manual act. What it does do, after settling its target day, is `repairOneGap`: the most recent publishable date that has **no record at all** and still has a healthy `raw:` bucket gets rebuilt, one per run. `shouldRepairGap` requires `stored === 0`, so it can never overwrite anything — it and `shouldKeepStored` cover disjoint cases. This exists because all four of a day's attempts can fail (a long Gemini outage) and that day would otherwise never be published even though its raw data stays good for `RAW_RETENTION_DAYS`; that is how 2026-09-13, -14 and -15 were lost. Only the automatic run repairs; an explicit `--date=` is still one day and nothing else. Re-doing a published day:

```sh
npm run pipeline -- --date=2026-09-03          # respects shouldKeepStored
npm run pipeline -- --date=2026-09-03 --force  # overwrites regardless
```

The `MIN_ITEMS_TARGET` floor (which fails the run loudly rather than publishing a thin day) applies only to the automatic target, not to an explicit `--date=`, since feeds legitimately cannot reach old days.

**Web app (`src/`)** — a single static page whose UI is one React island (`<NewsApp client:load />`), plus two on-demand API routes (`prerender = false`) that run as Vercel functions:
- `/api/news?date&lang` reads only the requested language branch via `JSON.GET` with paths; rejects anything outside the publishable window (`LOOKBACK_DAYS` ending yesterday).
- `/api/dates` checks availability of the publishable days with a single `JSON.MGET`, returning at most `DISPLAY_DAYS`.
- Both set `Cache-Control: s-maxage` headers; the client also caches days in memory keyed `date:lang`.

Key design points:
- The "news day" is defined in `America/New_York` (`src/lib/date.ts`) — keep every date computation going through those helpers, and never re-introduce hour arithmetic to pick a day: `publishableDates` / `latestPublishableDate` are date-only on purpose, because GitHub's `schedule` runs are best-effort and have been observed 5-12 h late.
- **Cron delay is the default, not the exception — budget for it before changing any schedule.** Measured against the real run history: the digest asked for 08:47 UTC and was delivered between 13:00 and 15:20 UTC *every day* (4.5-6.5 h late), and the collector asked for 8 runs a day and got ~5, because GitHub **drops** scheduled runs as well as delaying them. Two rules follow:
  - *Digest slots*: a run only breaks if it crosses ET midnight (04:00 UTC in EDT, 05:00 in EST) and starts targeting a different day. Every slot must sit at or after 05:00 UTC (so zero delay cannot put it on the previous ET day) and leave hours of headroom before the next boundary. `47 5,9,13,17` leaves 22.2/18.2/14.2/**10.2** h — the tightest is still ~4 h above the worst delay ever observed. Do not add a slot after ~20:00 UTC.
  - *Collector cadence*: ask for far more runs than the shortest feed window needs, because a fraction will simply not happen. An item that scrolls out of a feed during a gap is lost permanently — that is why a day can reach the digest thin. The Verge's window is ~5 h, so hourly is the floor, not padding.
- **Today is never published.** The site's most recent day is always yesterday, so the day being summarized has closed and its sources are complete. `/api/news` returns `invalid_date` for today, `/api/dates` never offers it, and the newest tab is labelled `strings.<lang>.yesterday`.
- `DayRecord` stores each language as a self-contained branch (`es`/`en` each with summary + stories) precisely so the API can fetch one language without transferring the whole record. `DayResponse` is the flattened one-language shape the client consumes.
- All UI text lives in `src/lib/i18n.ts` (`strings.es` / `strings.en`); never hardcode user-facing strings in components. Language preference persists in `localStorage` under `rtn:lang`.
- `NewsApp.tsx` owns all client state, including the story modal; the modal pushes a history entry so the mobile back gesture closes it instead of leaving the page.

## Styling & UI

- Tailwind 4 via the Vite plugin — there is no `tailwind.config`; the theme is CSS variables in `src/styles/globals.css` (terminal-green cyberpunk look, `#00ed3f` on `#050505`).
- `src/components/ui/` are shadcn-style primitives (see `components.json`; registry `@scificn`); `src/components/neonblade-ui/` are the themed originals. App-level components live directly in `src/components/`.
- Path alias `@/*` → `./src/*` (tsconfig, strict mode).
- `src/layouts/Layout.astro` owns SEO/Open Graph tags; the canonical site URL is `site` in `astro.config.mjs`.

## Astro documentation

Full documentation: https://docs.astro.build — consult before working on [routing](https://docs.astro.build/en/guides/routing/), [Astro components](https://docs.astro.build/en/basics/astro-components/), [framework components](https://docs.astro.build/en/guides/framework-components/), or [styling/Tailwind](https://docs.astro.build/en/guides/styling/).
