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

### Changed

- Use daily Vercel cron schedules so the project deploys on Hobby accounts.
- Replace read-then-write submission throttling with an atomic database function.

### Fixed

- Prevent repeated ingestion runs from duplicating signals for the same source item.
- Add copy-safety tests to block guaranteed-reset claims.
- Force no-store responses for write and cron API routes.
