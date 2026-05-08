-- PredTibo V2: sources, evidence, scoring, and anonymous predictions.
-- Apply this in the Supabase SQL editor or through the Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('openai', 'x', 'linkedin', 'web', 'rss', 'manual')),
  name text not null,
  handle text,
  url text not null unique,
  trust_weight numeric(4, 2) not null default 0.50 check (trust_weight >= 0 and trust_weight <= 1),
  crawl_policy text not null default 'official_or_allowed' check (crawl_policy in ('official_or_allowed', 'api_required', 'manual_only', 'disabled')),
  requires_api boolean not null default false,
  is_active boolean not null default true,
  last_fetch_status text,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources(id) on delete set null,
  external_id text,
  url text not null,
  author_name text,
  author_handle text,
  title text,
  excerpt text not null,
  content_hash text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  fetch_status text not null default 'fetched' check (fetch_status in ('fetched', 'skipped', 'credentials_missing', 'blocked', 'failed')),
  error_code text,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (url)
);

create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  source_item_id uuid references public.source_items(id) on delete cascade,
  signal_type text not null check (
    signal_type in (
      'codex_usage',
      'codex_launch',
      'limit_change',
      'free_access',
      'reset_language',
      'official_confirmation',
      'rumor',
      'contradiction'
    )
  ),
  confidence numeric(4, 2) not null check (confidence >= 0 and confidence <= 1),
  weight numeric(5, 2) not null,
  summary text not null,
  evidence_quote text,
  created_at timestamptz not null default now()
);

create table if not exists public.model_runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null default current_date,
  model_version text not null,
  target_date timestamptz not null,
  confidence_label text not null check (confidence_label in ('Low', 'Medium', 'High')),
  confidence_band_days integer not null check (confidence_band_days >= 0),
  reset_signal_probability integer not null check (reset_signal_probability >= 0 and reset_signal_probability <= 100),
  rationale text not null,
  evidence_signal_ids uuid[] not null default '{}',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.user_predictions (
  id uuid primary key default gen_random_uuid(),
  predicted_at timestamptz not null,
  display_name text,
  note_private text,
  rate_limit_hash text not null,
  user_agent_hash text,
  moderation_status text not null default 'private' check (moderation_status in ('private', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.prediction_submission_windows (
  rate_limit_hash text primary key,
  window_start timestamptz not null,
  submission_count integer not null default 0 check (submission_count >= 0),
  updated_at timestamptz not null default now()
);

create or replace function public.consume_prediction_submission(
  p_rate_limit_hash text,
  p_window_start timestamptz,
  p_max_submissions integer
)
returns boolean
language plpgsql
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

create index if not exists source_items_source_id_idx on public.source_items(source_id);
create index if not exists source_items_content_hash_idx on public.source_items(content_hash);
create index if not exists signals_source_item_id_idx on public.signals(source_item_id);
create index if not exists model_runs_public_created_idx on public.model_runs(is_public, created_at desc);
create index if not exists user_predictions_created_idx on public.user_predictions(created_at desc);
create index if not exists user_predictions_rate_hash_created_idx on public.user_predictions(rate_limit_hash, created_at desc);

alter table public.sources enable row level security;
alter table public.source_items enable row level security;
alter table public.signals enable row level security;
alter table public.model_runs enable row level security;
alter table public.user_predictions enable row level security;
alter table public.prediction_submission_windows enable row level security;

revoke all on table public.sources from anon, authenticated;
revoke all on table public.source_items from anon, authenticated;
revoke all on table public.signals from anon, authenticated;
revoke all on table public.model_runs from anon, authenticated;
revoke all on table public.user_predictions from anon, authenticated;
revoke all on table public.prediction_submission_windows from anon, authenticated;

grant select, insert, update, delete on table public.sources to service_role;
grant select, insert, update, delete on table public.source_items to service_role;
grant select, insert, update, delete on table public.signals to service_role;
grant select, insert, update, delete on table public.model_runs to service_role;
grant select, insert, update, delete on table public.user_predictions to service_role;
grant select, insert, update, delete on table public.prediction_submission_windows to service_role;
revoke all on function public.consume_prediction_submission(text, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.consume_prediction_submission(text, timestamptz, integer) to service_role;

drop policy if exists "No direct anonymous source access" on public.sources;
create policy "No direct anonymous source access"
on public.sources for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No direct anonymous source item access" on public.source_items;
create policy "No direct anonymous source item access"
on public.source_items for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No direct anonymous signal access" on public.signals;
create policy "No direct anonymous signal access"
on public.signals for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No direct anonymous model run access" on public.model_runs;
create policy "No direct anonymous model run access"
on public.model_runs for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No direct anonymous user prediction access" on public.user_predictions;
create policy "No direct anonymous user prediction access"
on public.user_predictions for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No direct anonymous rate window access" on public.prediction_submission_windows;
create policy "No direct anonymous rate window access"
on public.prediction_submission_windows for all
to anon, authenticated
using (false)
with check (false);
