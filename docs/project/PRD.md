# PredTibo PRD

## Product Goal

PredTibo gives Codex fans a lightweight, transparent daily "Reset Weather" read: a public-signal forecast for Codex reset and limit-change speculation, without pretending to have official OpenAI data.

## Audience

- Codex users who enjoy community speculation.
- Builders watching OpenAI product adoption.
- People who want a fast shareable daily signal page rather than a dashboard.

## V2 Scope

- One public reset-weather score for today.
- One public system prediction for a Codex milestone date and time.
- Tibo Reset Meter for public reset or limit-change signal probability.
- Confidence band and source-backed reasoning.
- Evidence trail from source ingestion and extracted signals.
- Countdown to the prediction.
- Watchlist of public events that could move the prediction.
- Anonymous user prediction submission through server routes when Supabase is configured.
- Shareable Open Graph/Twitter image for the current reset-weather score.
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

1. Hero section asks "Will Codex reset today?" and shows the daily reset-weather score.
2. Receipt strip links to real public evidence, never placeholders.
3. Countdown section works as progressive enhancement.
4. Tibo Reset Meter explains the public-signal probability and uncertainty.
5. Watchlist section shows events that may update the read.
6. User prediction and community-call panels stay async, moderated, and rate-limited.

## Success Metrics

- Public page remains cacheable.
- No production HTML contains placeholder links, smoke-test posts, or internal model/debug labels.
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
