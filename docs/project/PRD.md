# PredTibo PRD

## Product Goal

PredTibo gives Codex fans a lightweight, transparent way to follow and guess the next major Codex adoption moment without pretending to have official OpenAI data.

## Audience

- Codex users who enjoy community speculation.
- Builders watching OpenAI product adoption.
- People who want a fast shareable countdown page rather than a dashboard.

## V2 Scope

- One public system prediction for a Codex milestone date and time.
- Tibo Reset Meter for public reset or limit-change signal probability.
- Confidence band and source-backed reasoning.
- Evidence trail from source ingestion and extracted signals.
- Countdown to the prediction.
- Watchlist of public events that could move the prediction.
- Anonymous user prediction submission through server routes when Supabase is configured.
- Local-only fallback when Supabase is not configured.
- Clear fan-project disclaimer.

## Non-Goals

- No public raw user-note feed.
- No leaderboard until moderation and anti-abuse controls exist.
- No official subscriber counter.
- No claims about private OpenAI systems, limit reset rules, or internal launch timing.
- No account system.
- No analytics dependency required for page load.

## Research Notes

OpenAI publicly described Codex as used weekly by more than 3 million developers on April 16, 2026. OpenAI Help states Codex is available across major ChatGPT plans and that exact usage limits vary by plan and task shape. OpenAI's access-limit writing emphasizes fairness, real-time controls, and auditable usage. PredTibo should therefore frame predictions as public-signal speculation only.

## UX Outline

1. Hero section with product name, prediction date/time, and fan disclaimer.
2. Countdown section that works as progressive enhancement.
3. Prediction model section with confidence band and reasoning.
4. Watchlist section for events that may update the prediction.
5. Tibo Reset Meter section with current probability and evidence.
6. User prediction panel with date/time input, display name, note, save, clear, and share link.

## Success Metrics

- Public page remains cacheable.
- Server write path rejects invalid or rate-limited predictions.
- Cron routes reject missing or invalid `CRON_SECRET`.
- Supabase migration enables RLS and avoids direct anonymous table access.
- Build and lint pass.
- Fixture tests pass for source ingestion and scoring.
- Core prediction content remains visible without JavaScript.
- Visitors can create and share a local guess when JavaScript is enabled, even before Supabase is configured.

## Future Metrics

- Percentage of requests served from CDN.
- Write rate per user/IP.
- Bot challenge rate.
- Queue latency.
- Storage error rate.
