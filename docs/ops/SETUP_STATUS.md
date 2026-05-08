# Setup Status

Last updated: 2026-05-08

## Done

- Local git repo initialized on `main`.
- Public GitHub repo created: https://github.com/PATELOM925/PredTibo
- Vercel project linked locally as `predtibo`.
- Production deployment is live: https://predtibo.vercel.app
- Public reads verified with Vercel prerender/CDN headers.
- Cron endpoints reject unauthenticated requests.
- Submission route fails closed when Supabase is not configured.

## Blocked

- Vercel Git integration did not connect from CLI. The local deployment works, but push-to-deploy needs the Vercel GitHub app to have access to `PATELOM925/PredTibo`. Tracking: https://github.com/PATELOM925/PredTibo/issues/1
- Supabase live project setup is not applied yet. The migration is ready, but the available CLI paths are blocked by missing Supabase auth/tooling and local Docker/Xcode toolchain issues. Tracking: https://github.com/PATELOM925/PredTibo/issues/2
- Restricted social ingestion needs official API adapters or manual approved entries before it can include X/LinkedIn signals. Tracking: https://github.com/PATELOM925/PredTibo/issues/3

## Next Required Secrets

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `RATE_LIMIT_SALT`

## Strategy Confidence

The strategy is sound for a high-read, low-write public app: public reads stay static or ISR-cached, writes use server routes, and source ingestion is scheduled. The remaining uncertainty is operational setup, not the app architecture:

- Supabase must be created and migrated before anonymous predictions can be durable.
- Vercel Git integration must be connected before GitHub pushes trigger deployments.
- Restricted platforms such as X and LinkedIn must use official APIs or manual approved entries.
