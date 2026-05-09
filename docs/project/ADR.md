# Architecture Decision Records

## ADR-0001: Use a Static/CDN-First Architecture

Date: 2026-05-07

Status: Accepted

Decision: PredTibo v1 will be a static-first Next.js app deployed to Vercel.

Context: The project goal includes handling extreme burst traffic from many unique users. The safest v1 architecture is to keep the public page cacheable and avoid per-request compute.

Consequences:

- Public traffic can be served mostly from CDN.
- The app has no backend dependency for first load.
- Prediction updates require a deploy in v1.
- Edge Config can be added later if live copy updates become important.

## ADR-0002: Keep Guesses Local-Only in V1

Date: 2026-05-07

Status: Accepted

Decision: User guesses are stored in `localStorage` and optionally encoded into share links.

Context: Server-side guess collection would require rate limiting, storage, bot protection, privacy copy, and moderation. That is too much operational surface for a small fun v1.

Consequences:

- Visitors can still play with the prediction flow.
- No database write bottleneck exists.
- There is no global leaderboard in v1.
- Future collection can be added behind a feature flag.

Superseded by ADR-0004 for V2.

## ADR-0003: Do Not Claim Unofficial Reset Knowledge

Date: 2026-05-07

Status: Accepted

Decision: PredTibo will label reset/free-limit content as speculation based on public signals only.

Context: OpenAI plan limits and resets are not fully public and may vary by plan, task, or account state. The app should not mislead users into thinking it has insider knowledge.

Consequences:

- Copy must include disclaimers.
- Prediction data must include source notes.
- Watchlist events can describe "signals to watch" but not guaranteed outcomes.
- Unknown facts must be called unknown.

## ADR-0004: Add Supabase-Backed Evidence and Anonymous Predictions

Date: 2026-05-08

Status: Accepted

Decision: PredTibo V2 uses Supabase for sources, source items, signals, model runs, anonymous predictions, and rate-limit windows. Public reads still go through cacheable app routes.

Context: The product now needs a system prediction, evidence trail, user submissions, and daily reset-meter scoring. Local-only storage is not enough.

Consequences:

- A Supabase migration becomes part of release setup.
- RLS is enabled on all tables.
- Direct anonymous table access is denied.
- Server routes use the service role key only on the server.
- Missing database credentials must degrade clearly instead of crashing builds.

## ADR-0005: Compliant Broad Discovery

Date: 2026-05-08

Status: Accepted

Decision: Broad crawling means approved public sources and API-backed restricted platforms. X and LinkedIn are not scraped behind login or platform controls.

Context: The user wants wide signal coverage, including X, LinkedIn, articles, releases, and statements. Some platforms restrict programmatic access.

Consequences:

- X/LinkedIn sources can exist in the allowlist but return `credentials_missing` or `api_adapter_not_configured` until official API access is configured.
- Manual source entries are acceptable for restricted posts.
- The ingestion pipeline stores skips as evidence of safe behavior, not silent failures.

## ADR-0006: Launch as Daily Reset Weather

Date: 2026-05-09

Status: Accepted

Decision: PredTibo launches as a daily Codex Reset Weather page rather than a generic prediction dashboard.

Context: The first production UI was technically functional but exposed implementation details and did not create a clear shareable hook. The launch page needs one public question, one score, and attached receipts.

Consequences:

- The hero asks about today's Codex reset signal activity.
- Model/version/debug labels stay out of public launch copy.
- Evidence links must point to real source URLs.
- Share metadata and generated social imagery are part of launch readiness.
- The community feature remains async and moderated, not realtime chat.

## ADR-0007: Require Service-Role Server Access for Launch

Date: 2026-05-09

Status: Accepted

Decision: Launch-grade Supabase reads and writes require `SUPABASE_SERVICE_ROLE_KEY` on the server. The publishable-key plus server-secret RPC path is legacy fallback only and must be explicitly opted into outside launch.

Context: Supabase advisors flagged anonymous visibility for raw public tables and public-callable `SECURITY DEFINER` RPCs. Even when secret-guarded, that is below the launch bar.

Consequences:

- Public users interact with Next.js routes, not raw Supabase tables or RPCs.
- Missing service-role credentials disable database-backed writes instead of exposing fallback RPCs.
- The launch hardening migration revokes public table/RPC grants after compatible Vercel env vars and deployment are in place.
