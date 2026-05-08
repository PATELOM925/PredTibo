-- PredTibo V2.2: advisor hardening after live Supabase lint checks.

create or replace function public.consume_prediction_submission(
  p_rate_limit_hash text,
  p_window_start timestamptz,
  p_max_submissions integer
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  next_count integer;
begin
  insert into public.prediction_submission_windows (
    rate_limit_hash,
    window_start,
    submission_count,
    updated_at
  )
  values (p_rate_limit_hash, p_window_start, 1, now())
  on conflict (rate_limit_hash)
  do update set
    window_start = case
      when public.prediction_submission_windows.window_start < p_window_start
        then p_window_start
      else public.prediction_submission_windows.window_start
    end,
    submission_count = case
      when public.prediction_submission_windows.window_start < p_window_start
        then 1
      else public.prediction_submission_windows.submission_count + 1
    end,
    updated_at = now()
  returning submission_count into next_count;

  return next_count <= p_max_submissions;
end;
$$;

create or replace view public.public_model_runs as
select
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
from public.model_runs
where is_public = true;

create or replace view public.public_signals as
select
  id,
  source_item_id,
  signal_type,
  confidence,
  weight,
  summary,
  evidence_quote,
  created_at
from public.signals;

create or replace view public.public_community_messages as
select
  id,
  display_name,
  body,
  created_at
from public.community_messages
where moderation_status = 'approved';

revoke select on table public.model_runs from anon, authenticated;
revoke select on table public.signals from anon, authenticated;
revoke select on table public.community_messages from anon, authenticated;

grant select on table public.public_model_runs to anon, authenticated;
grant select on table public.public_signals to anon, authenticated;
grant select on table public.public_community_messages to anon, authenticated;

revoke execute on function public.submit_user_prediction_from_server(text, timestamptz, text, text, text, text, timestamptz, integer) from authenticated;
revoke execute on function public.submit_community_message_from_server(text, text, text, text, text, timestamptz, integer) from authenticated;
revoke execute on function public.persist_ingestion_result_from_server(text, jsonb, text, text, jsonb, jsonb) from authenticated;
revoke execute on function public.insert_model_run_from_server(text, text, timestamptz, text, integer, integer, text, uuid[]) from authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and p.pronargs = 0
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
