# PredTibo Agent Instructions

Be direct, evidence-driven, and pragmatic. Do not claim certainty without fresh verification.

## Working Rules

- Keep folders, subfolders, and files neat and intentional.
- Maintain a task list for every implementation pass and keep statuses current.
- Use a measure-twice-cut-once policy: inspect, decide, then edit.
- Do not overcomplicate the workflow, but do not skip security, data, or deployment basics.
- Avoid dead code, unused files, duplicate docs, and generated artifacts in git.
- Never commit secrets, API keys, tokens, `.env` files, `.next/`, `node_modules/`, or Playwright artifacts.

## Product Rules

- PredTibo is a fan project and must not imply private OpenAI access.
- The Tibo Reset Meter predicts public reset or limit-change signals, not actual account reset state.
- X and LinkedIn access must use official APIs, approved manual source entries, or compliant public pages only.
- Every system prediction must be explainable through stored evidence, score weights, and model version.

## Verification Rules

- Run `npm run lint`, `npm run test`, `npm run build`, and `npm audit --json` before claiming implementation is complete.
- Browser-check the public page and user prediction flow after UI changes.
- Verify Supabase RLS and cron auth when a real Supabase project is connected.
