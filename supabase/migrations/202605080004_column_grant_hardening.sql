-- PredTibo V2.3: replace public security-definer views with column grants.

drop view if exists public.public_model_runs;
drop view if exists public.public_signals;
drop view if exists public.public_community_messages;

revoke select on table public.model_runs from anon, authenticated;
revoke select on table public.signals from anon, authenticated;
revoke select on table public.community_messages from anon, authenticated;

grant select (
  id,
  run_date,
  model_version,
  target_date,
  confidence_label,
  confidence_band_days,
  reset_signal_probability,
  rationale,
  evidence_signal_ids,
  is_public,
  created_at
) on table public.model_runs to anon, authenticated;

grant select (
  id,
  source_item_id,
  signal_type,
  confidence,
  weight,
  summary,
  evidence_quote,
  created_at
) on table public.signals to anon, authenticated;

grant select (
  id,
  display_name,
  body,
  moderation_status,
  created_at
) on table public.community_messages to anon, authenticated;
