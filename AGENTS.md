# Rice Tech News

Bilingual (es/en) daily tech news site. A nightly pipeline aggregates news from tech sources, summarizes them with Gemini, and stores the result in Upstash Redis; an Astro site on Vercel (https://rice-tech-news.vercel.app) serves them. Default UI language is Spanish; code comments and pipeline logs are written in Spanish.

## Commands

```sh
npm run dev              # dev server at localhost:4321
npm run build            # production build (Vercel adapter)
npm run pipeline         # run the news pipeline locally (needs env vars)
npm run pipeline -- --dry-run     # fetch sources only, list items, no Gemini/Redis
npm run pipeline -- --skip-write  # full run but print the record instead of writing to Redis
npx tsc --noEmit         # type check (no test suite or linter is configured)
```

When starting the dev server from an agent, use background mode: `astro dev --background` (manage with `astro dev stop` / `status` / `logs`).

Env vars (see `.env.example`): `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are needed by both the pipeline and the API routes; `GEMINI_API_KEY` (and optional `GEMINI_MODELS` fallback chain) only by the pipeline.

## Architecture

Two halves that share `src/lib/` (types, date logic, redis client):

**Pipeline (`scripts/`)** — runs nightly via GitHub Action (`.github/workflows/daily-news.yml`, 03:00 UTC ≈ 11 PM ET, end of the US news day):
1. `scripts/sources/factory.ts` holds `SOURCE_CONFIGS`, the source registry — adding a news source means adding one entry there (`RssSource` or `JsonApiSource` with a mapper).
2. `scripts/daily-news.ts` fetches all sources in parallel (tolerates partial failures, aborts only if all fail), sorts items, and assigns each an `index`.
3. `scripts/gemini.ts` sends all items in one structured-output call; Gemini clusters them into stories referencing items by `sourceIndexes` and returns everything bilingual. Falls back through a model chain on quota/availability errors.
4. The resulting `DayRecord` is written to Redis key `news:YYYY-MM-DD` with RedisJSON (`DEL` first — `JSON.SET` fails with WRONGTYPE over a plain-string key).

**Web app (`src/`)** — a single static page whose UI is one React island (`<NewsApp client:load />`), plus two on-demand API routes (`prerender = false`) that run as Vercel functions:
- `/api/news?date&lang` reads only the requested language branch via `JSON.GET` with paths; rejects dates outside the last-7-days window.
- `/api/dates` checks availability of the 7 days with a single `JSON.MGET`.
- Both set `Cache-Control: s-maxage` headers; the client also caches days in memory keyed `date:lang`.

Key design points:
- The "news day" is defined in `America/New_York` (`src/lib/date.ts`) — keep every date computation going through those helpers.
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
