# Setup Status

Last updated: 2026-05-09

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
- Launch hardening branch adds Reset Weather product framing, evidence snapshots, service-role-only launch mode, generated social image metadata, and smoke-test community cleanup.
- Backward-compatible live Supabase cleanup applied: `model_runs.evidence_snapshot` / `score_breakdown` columns were added, existing evidence snapshots were backfilled where possible, and the `Codex tester` approved message was rejected.
- Launch hardening revoke migration is applied in production: anonymous/authenticated execution is removed from server-only Supabase RPCs.
- The public latest-state route is currently backed by an anonymous-only `prediction_snapshots` projection until `SUPABASE_SERVICE_ROLE_KEY` is available in Vercel.

## Blocked

- Vercel Git integration did not connect from CLI. The local deployment works, but push-to-deploy needs the Vercel GitHub app to have access to `PATELOM925/PredTibo`. Tracking: https://github.com/PATELOM925/PredTibo/issues/1
- Service-role key retrieval is blocked by available tooling/account privileges. Launch-grade writes and cron database mutations require `SUPABASE_SERVICE_ROLE_KEY`; the old publishable-key plus `SERVER_ACTION_SECRET` RPC fallback is disabled unless explicitly opted into with `PREDTIBO_ALLOW_SERVER_RPC_FALLBACK=1`.
- Final "no raw Supabase surface" launch gate is still blocked until `SUPABASE_SERVICE_ROLE_KEY` is added to Vercel and the `prediction_snapshots` anonymous grant can be revoked.
- Restricted social ingestion needs official API adapters or manual approved entries before it can include X/LinkedIn signals. Tracking: https://github.com/PATELOM925/PredTibo/issues/3

## Next Required Secrets

- Production: configured in Vercel.
- Preview/development: not configured because Vercel CLI requires a preview branch target in this linked setup.
- Required for launch: `SUPABASE_SERVICE_ROLE_KEY`
- Recommended: `NEXT_PUBLIC_SITE_URL=https://predtibo.vercel.app`

## Strategy Confidence

The corrected strategy is sound for a high-read, low-write public app: public reads stay static or ISR-cached, writes use server routes, and source ingestion is scheduled. The remaining uncertainty is operational setup, not the app architecture:

- Supabase launch mode needs service-role server credentials before anonymous predictions can be durable and before the public snapshot projection can be replaced by service-role-only API reads.
- Vercel Git integration must be connected before GitHub pushes trigger deployments; direct deploy remains the fallback release path.
- Restricted platforms such as X and LinkedIn must use official APIs or manual approved entries.
