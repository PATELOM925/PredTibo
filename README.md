# PredTibo

PredTibo is a small fan-made prediction web app for guessing when Codex reaches its next visible adoption milestone and which public OpenAI/Codex events might line up with free-limit or reset speculation.

This project is not affiliated with OpenAI, Sam Altman, Tibor Blaho, or any OpenAI employee. It does not claim private knowledge of OpenAI limits, resets, subscriber counts, or launch plans.

## What It Does

- Shows one public-signal prediction for the next Codex adoption moment.
- Displays a countdown to the predicted date and time.
- Explains the confidence band and public sources behind the estimate.
- Lists watch events that could change the estimate.
- Shows a Tibo Reset Meter for public reset or limit-change signal probability.
- Accepts anonymous user predictions through a server route when Supabase is configured.
- Falls back to local-only guesses when the database is not configured.

## Architecture

PredTibo is designed as a read-heavy app with database-backed evidence:

- Next.js App Router with TypeScript.
- Supabase schema for sources, source items, extracted signals, model runs, and anonymous user predictions.
- Vercel/CDN-first caching for public reads.
- Server routes for prediction submission, latest public state, and secured cron jobs.
- Rules-first scoring engine with explicit evidence and uncertainty.
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

Deploy to Vercel as a standard Next.js project. Configure these environment variables in Vercel, not in git:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `RATE_LIMIT_SALT`
- Optional: `X_BEARER_TOKEN`
- Optional: `LINKEDIN_ACCESS_TOKEN`
- Optional: `OPENAI_API_KEY`

Apply the SQL migration in `supabase/migrations/` to the connected Supabase project before enabling write routes.

## Docs

- [PRD](docs/project/PRD.md)
- [Rules](docs/project/RULES.md)
- [Q and Brain](docs/project/Q_AND_BRAIN.md)
- [ADRs](docs/project/ADR.md)

## Sources

- OpenAI Codex adoption signal: https://openai.com/index/codex-for-almost-everything/
- OpenAI Codex access and plan limits: https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- OpenAI access-limit architecture context: https://openai.com/index/beyond-rate-limits/
- Vercel CDN caching: https://vercel.com/docs/caching/cdn-cache
- Vercel Edge Config: https://vercel.com/docs/edge-config
