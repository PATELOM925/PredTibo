# Q and Brain

## Locked Answers

- V1 scope: static plus local-only guesses.
- Hosting target: Vercel.
- Backend: none for v1.
- Guess storage: browser `localStorage`.
- Share format: URL parameters.
- Tone: fun, direct, and clearly unofficial.
- Launch pivot: daily Codex Reset Weather, with one score and receipts.
- Community launch mode: async moderated calls, not realtime chat.

## Open Questions

- Should future versions collect anonymous guesses server-side?
- Should the prediction track "weekly active developers", "paid subscribers", or a broader "Codex users" milestone?
- Should a future leaderboard rank closeness after the event happens?
- Should the app expose a small public JSON prediction feed for others to remix?
- Should Edge Config be used later to update prediction copy without redeploying?
- Should the share card get daily archive URLs after launch traffic proves demand?

## Brain

- Add a "prediction market without money" mode where users vote on event timing.
- Add source cards that show why the date moved.
- Add a daily static snapshot archive.
- Add a widget embed for blogs or X profiles.
- Add a "reset rumor thermometer" that only uses public signals.
- Add daily share cards: quiet, watch, and hot signal variants.
- Add a post-event scorecard after the milestone is confirmed.
- Add a human-approved evidence queue for public X/LinkedIn URLs when official API adapters are not available.

## Future Backend Gate

Before collecting guesses server-side, add:

- Privacy copy and consent.
- Per-IP and per-browser rate limits.
- Bot filtering.
- Queue-backed writes.
- Moderation for free-text notes.
- Public aggregate only, not raw personal guess data.
