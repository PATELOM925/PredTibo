-- PredTibo launch hardening: immutable evidence snapshots, service-role server access,
-- and production smoke-test cleanup.

alter table public.model_runs
  add column if not exists evidence_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists score_breakdown jsonb not null default '{}'::jsonb;

create table if not exists public.prediction_snapshots (
  id uuid primary key default gen_random_uuid(),
  model_run_id uuid unique references public.model_runs(id) on delete set null,
  payload jsonb not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.prediction_snapshots enable row level security;

update public.model_runs as mr
set evidence_snapshot = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'title', s.summary,
        'sourceLabel', coalesce(si.title, si.author_name, src.name, 'Public source'),
        'url', coalesce(si.url, src.url),
        'excerpt', coalesce(s.evidence_quote, si.excerpt, s.summary),
        'signalType', s.signal_type,
        'confidence', s.confidence,
        'weight', s.weight,
        'observedAt', coalesce(si.published_at, si.fetched_at, s.created_at)
      )
      order by array_position(mr.evidence_signal_ids, s.id)
    )
    from public.signals as s
    left join public.source_items as si on si.id = s.source_item_id
    left join public.sources as src on src.id = si.source_id
    where s.id = any(mr.evidence_signal_ids)
      and coalesce(si.url, src.url) is not null
  ),
  '[]'::jsonb
)
where mr.evidence_snapshot = '[]'::jsonb;

update public.community_messages
set moderation_status = 'rejected'
where display_name = 'Codex tester'
  and body = 'Medium reset-signal day after the first production ingest.';

insert into public.prediction_snapshots (model_run_id, payload, is_public, created_at)
select
  mr.id,
  jsonb_build_object(
    'generatedAt', mr.created_at,
    'modelVersion', mr.model_version,
    'targetIso', mr.target_date,
    'targetDisplay', to_char(mr.target_date at time zone 'Asia/Kolkata', 'FMMonth FMDD, YYYY "at" FMHH12:MI AM "GMT+5:30"'),
    'targetUtcDisplay', to_char(mr.target_date at time zone 'UTC', 'FMMonth FMDD, YYYY "at" FMHH12:MI AM "UTC"'),
    'headline', 'PredTibo reads public Codex signals for ' ||
      case
        when mr.reset_signal_probability >= 75 then 'hot signal day.'
        when mr.reset_signal_probability >= 45 then 'watch the wires.'
        else 'quiet public signal day.'
      end,
    'pulseQuestion', 'Will Codex reset today?',
    'pulseAnswer',
      case
        when mr.reset_signal_probability >= 75 then 'Hot signal day'
        when mr.reset_signal_probability >= 45 then 'Watch the wires'
        else 'Quiet public signal day'
      end,
    'pulseSummary', 'PredTibo sees ' || mr.reset_signal_probability ||
      '% public reset-signal activity. ' || mr.confidence_label ||
      ' confidence, with a ' || mr.confidence_band_days || '-day milestone band.',
    'updatedDisplay', 'Updated ' || to_char(mr.created_at at time zone 'Asia/Kolkata', 'Mon FMDD, FMHH12:MI AM "GMT+5:30"'),
    'nextUpdateDisplay', 'Next scheduled update ' ||
      to_char((mr.created_at + interval '1 day') at time zone 'Asia/Kolkata', 'Mon FMDD, FMHH12:MI AM "GMT+5:30"'),
    'shareText', 'PredTibo reset weather: ' || mr.reset_signal_probability ||
      '% ' ||
      case
        when mr.reset_signal_probability >= 75 then 'Hot signal day'
        when mr.reset_signal_probability >= 45 then 'Watch the wires'
        else 'Quiet public signal day'
      end ||
      '. Fan forecast only, not official OpenAI data.',
    'confidence', mr.confidence_label,
    'confidenceWindow', 'Plus or minus ' || mr.confidence_band_days || ' days',
    'resetSignalProbability', mr.reset_signal_probability,
    'resetMeterLabel',
      case
        when mr.reset_signal_probability >= 75 then 'Hot public reset-signal weather'
        when mr.reset_signal_probability >= 45 then 'Watch public reset-signal weather'
        else 'Quiet public reset-signal weather'
      end,
    'rationale', mr.rationale,
    'uncertainty', 'This is not an actual reset detector. It estimates public reset or limit-change signal probability from approved public evidence.',
    'evidence', mr.evidence_snapshot,
    'sourcePolicy', 'Compliant broad discovery: official APIs where required, public official pages, approved manual entries, no login bypass.'
  ),
  true,
  mr.created_at
from public.model_runs as mr
where mr.is_public = true
  and jsonb_array_length(mr.evidence_snapshot) > 0
on conflict (model_run_id)
do update set
  payload = excluded.payload,
  is_public = excluded.is_public,
  created_at = excluded.created_at;

revoke all privileges on table public.model_runs from anon, authenticated;
revoke all privileges on table public.signals from anon, authenticated;
revoke all privileges on table public.community_messages from anon, authenticated;
revoke all privileges on table public.prediction_snapshots from anon, authenticated;

drop policy if exists "Public can read public model runs" on public.model_runs;
drop policy if exists "Public can read evidence signals" on public.signals;
drop policy if exists "Public can read approved community messages" on public.community_messages;

grant select, insert, update, delete on table public.model_runs to service_role;
grant select, insert, update, delete on table public.signals to service_role;
grant select, insert, update, delete on table public.community_messages to service_role;
grant select, insert, update, delete on table public.prediction_snapshots to service_role;
grant select (payload, is_public, created_at) on table public.prediction_snapshots to anon, authenticated;

drop policy if exists "Public can read prediction snapshots" on public.prediction_snapshots;
create policy "Public can read prediction snapshots"
on public.prediction_snapshots for select
to anon, authenticated
using (is_public = true);

revoke all on function public.consume_prediction_submission(text, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.consume_rate_limit_action(text, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.submit_user_prediction_from_server(text, timestamptz, text, text, text, text, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.submit_community_message_from_server(text, text, text, text, text, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.persist_ingestion_result_from_server(text, jsonb, text, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.insert_model_run_from_server(text, text, timestamptz, text, integer, integer, text, uuid[]) from public, anon, authenticated;

grant execute on function public.consume_prediction_submission(text, timestamptz, integer) to service_role;
grant execute on function public.consume_rate_limit_action(text, timestamptz, integer) to service_role;
grant execute on function public.submit_user_prediction_from_server(text, timestamptz, text, text, text, text, timestamptz, integer) to service_role;
grant execute on function public.submit_community_message_from_server(text, text, text, text, text, timestamptz, integer) to service_role;
grant execute on function public.persist_ingestion_result_from_server(text, jsonb, text, text, jsonb, jsonb) to service_role;
grant execute on function public.insert_model_run_from_server(text, text, timestamptz, text, integer, integer, text, uuid[]) to service_role;
