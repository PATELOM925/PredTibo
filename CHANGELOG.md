# Changelog

All notable changes to PredTibo will be documented in this file.

## Unreleased

### Added

- Initial project documentation for README, PRD, rules, Q and brain, ADR, and changelog.
- Static Next.js app plan for CDN-first traffic handling.
- Local-only prediction guess model for v1.
- Supabase-backed V2 schema for sources, evidence, model runs, user predictions, and rate limits.
- Rules-first prediction engine and compliant source-ingestion layer.
- Cacheable latest prediction API, secured cron routes, and anonymous prediction submission route.
- Tibo Reset Meter UI with evidence trail and local fallback.
- Public GitHub and Vercel deployment status documentation.
- Dark/light theme toggle with a black, royal orange, blue, and purple interface refresh.
- Supabase-backed community message board and server-gated RPC write path.
- GitHub Actions CI for lint, tests, build, and dependency audit.
- Supabase advisor hardening migrations for fixed function search paths, column-level public grants, and redundant RLS policy cleanup.

### Changed

- Use daily Vercel cron schedules so the project deploys on Hobby accounts.
- Replace read-then-write submission throttling with an atomic database function.
- Allow production writes through a publishable Supabase key plus server-only action secret when no service-role key is available.
- Route public reads through RLS-protected, column-limited Supabase tables instead of exposing private write metadata.

### Fixed

- Prevent repeated ingestion runs from duplicating signals for the same source item.
- Add copy-safety tests to block guaranteed-reset claims.
- Force no-store responses for write and cron API routes.
