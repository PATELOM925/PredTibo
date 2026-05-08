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
- Supabase connector is available, and the empty project `PATELOM925's Project` was selected for PredTibo.
- Supabase V2 migrations are applied to project `zpspjezeyvjcyurcngou`.
- Production Vercel env vars are set for Supabase URL, publishable key, server action secret, cron secret, and rate-limit salt.
- Direct anonymous table writes are blocked; direct reads cannot select community rate-limit hashes.

## Blocked

- Vercel Git integration did not connect from CLI. The local deployment works, but push-to-deploy needs the Vercel GitHub app to have access to `PATELOM925/PredTibo`. Tracking: https://github.com/PATELOM925/PredTibo/issues/1
- Service-role key retrieval is blocked by Supabase account privileges, so production uses publishable key plus `SERVER_ACTION_SECRET` guarded RPCs instead. Remaining Supabase advisor warnings are for intentional public read objects and public RPC endpoints protected by the server action secret. Tracking: https://github.com/PATELOM925/PredTibo/issues/2
- Restricted social ingestion needs official API adapters or manual approved entries before it can include X/LinkedIn signals. Tracking: https://github.com/PATELOM925/PredTibo/issues/3

## Next Required Secrets

- Production: configured in Vercel.
- Preview/development: not configured because Vercel CLI requires a preview branch target in this linked setup.
- Optional: `SUPABASE_SERVICE_ROLE_KEY`

## Strategy Confidence

The strategy is sound for a high-read, low-write public app: public reads stay static or ISR-cached, writes use server routes, and source ingestion is scheduled. The remaining uncertainty is operational setup, not the app architecture:

- Supabase must be created and migrated before anonymous predictions can be durable.
- Vercel Git integration must be connected before GitHub pushes trigger deployments.
- Restricted platforms such as X and LinkedIn must use official APIs or manual approved entries.
