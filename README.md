# PredTibo

PredTibo is a small fan-made Codex Reset Weather app: a daily public-signal forecast for whether Codex reset or limit-change chatter looks quiet, worth watching, or hot.

This project is not affiliated with OpenAI, Sam Altman, Tibor Blaho, or any OpenAI employee. It does not claim private knowledge of OpenAI limits, resets, subscriber counts, or launch plans.

## What It Does

- Shows one public-signal reset-weather score for today.
- Shows one public-signal prediction for the next Codex adoption moment.
- Displays a countdown to the predicted date and time.
- Explains the confidence band and public sources behind the estimate.
- Lists watch events that could change the estimate.
- Shows a Tibo Reset Meter for public reset or limit-change signal probability.
- Generates a shareable Open Graph/Twitter card for the daily score.
- Accepts anonymous user predictions through a server route when Supabase is configured.
- Provides a Supabase-backed community board for short moderated reset-signal takes.
- Falls back to local-only guesses when the database is not configured.

## Architecture

PredTibo is designed as a read-heavy app with database-backed evidence:

- Next.js App Router with TypeScript.
- Supabase schema for sources, source items, extracted signals, model runs, and anonymous user predictions.
- Vercel/CDN-first caching for public reads.
- Server routes for prediction submission, latest public state, and secured cron jobs.
- Service-role-only server access for launch-grade Supabase reads and writes.
- Legacy server-gated Postgres RPC fallback is disabled unless `PREDTIBO_ALLOW_SERVER_RPC_FALLBACK=1` is explicitly set.
- Rules-first scoring engine with explicit evidence and uncertainty.
- Evidence snapshots stored with model runs so public predictions stay explainable.
- Client-side progressive enhancement for countdown and local fallback.

The 1M-user target is handled by keeping public reads cacheable and keeping writes out of the page-rendering path. User submissions are rate-limited and routed through server code.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run test
npm run build
npm audit --json
```

## Deployment

Current deployment:

- Public GitHub repo: https://github.com/PATELOM925/PredTibo
- Vercel production URL: https://predtibo.vercel.app

Deploy to Vercel as a standard Next.js project. Configure these environment variables in Vercel, not in git:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SERVER_ACTION_SECRET`
- `CRON_SECRET`
- `RATE_LIMIT_SALT`
- Optional: `X_BEARER_TOKEN`
- Optional: `LINKEDIN_ACCESS_TOKEN`
- Optional: `OPENAI_API_KEY`

Apply the SQL migrations in `supabase/migrations/` to the connected Supabase project before enabling write routes. Launch mode requires `SUPABASE_SERVICE_ROLE_KEY`; if you temporarily use `SERVER_ACTION_SECRET` RPC fallback, store its SHA-256 hash in `public.app_private_config` under `config_key = 'server_action_secret'` and keep `PREDTIBO_ALLOW_SERVER_RPC_FALLBACK=1` limited to non-launch environments.

The default `vercel.json` cron schedule is daily so it works on Vercel Hobby. More frequent scoring requires Vercel Pro or an external scheduler.

## Docs

- [PRD](docs/project/PRD.md)
- [Rules](docs/project/RULES.md)
- [Q and Brain](docs/project/Q_AND_BRAIN.md)
- [ADRs](docs/project/ADR.md)
- [Setup Status](docs/ops/SETUP_STATUS.md)

## Sources

- OpenAI Codex adoption signal: https://openai.com/index/codex-for-almost-everything/
- OpenAI Codex access and plan limits: https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- OpenAI access-limit architecture context: https://openai.com/index/beyond-rate-limits/
- Vercel CDN caching: https://vercel.com/docs/caching/cdn-cache
- Vercel Edge Config: https://vercel.com/docs/edge-config
