# PredTibo Rules

## Prediction Rules

- Every prediction must include a date, time, timezone, confidence band, and source note.
- Prediction copy must say when it is speculative.
- If a public OpenAI source contradicts a prediction, the prediction must be revised or marked stale.
- Do not treat social posts, rumors, screenshots, or memes as confirmed facts.

## Data-Source Rules

- Prefer OpenAI primary sources for Codex access, usage, and limits.
- Prefer Vercel primary docs for hosting and caching claims.
- Use dated source notes so readers know when a signal was observed.
- Do not invent exact subscriber counts, reset schedules, or internal OpenAI policy details.
- Broad crawling means compliant source discovery, not login bypass, platform-control bypass, paywall bypass, or private data collection.
- X and LinkedIn sources require official API credentials or approved manual entries.

## Anti-Hallucination Rules

- Say "unknown" when a fact is not public.
- Label community guesses as guesses.
- Do not imply that PredTibo has private access to OpenAI, Codex telemetry, Sam Altman, Tibor Blaho, or OpenAI employees.
- Do not use fake precision such as second-level confidence when the source data is coarse.

## Legal and Disclosure Rules

- Always include: "Fan project. Not affiliated with OpenAI."
- Do not use OpenAI logos or brand assets unless permission is clear.
- Do not ask users for API keys, OpenAI account details, or private plan information.
- Do not publish user guesses server-side without an explicit future consent flow.

## Scaling Rules

- Public reads must remain CDN-friendly.
- Server writes must stay outside the page-rendering hot path.
- User prediction writes require validation and rate limiting.
- Cron routes must require `CRON_SECRET`.
- Any high-traffic endpoint must define cache headers and a failure mode before deployment.
