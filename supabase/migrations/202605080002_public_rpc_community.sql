-- PredTibo V2.1: public reads, server-gated RPC writes, and community messages.
-- This keeps anonymous table writes blocked while allowing Next.js route handlers
-- to write through SECURITY DEFINER functions guarded by SERVER_ACTION_SECRET.

create table if not exists public.app_private_config (
  config_key text primary key,
  value_sha256 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limit_windows (
  rate_limit_key text primary key,
  window_start timestamptz not null,
  action_count integer not null default 0 check (action_count >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  body text not null check (char_length(body) between 1 and 280),
  rate_limit_hash text not null,
  user_agent_hash text,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_windows_updated_idx on public.rate_limit_windows(updated_at desc);
create index if not exists community_messages_public_created_idx
  on public.community_messages(moderation_status, created_at desc);
create index if not exists community_messages_rate_hash_created_idx
  on public.community_messages(rate_limit_hash, created_at desc);

alter table public.app_private_config enable row level security;
alter table public.rate_limit_windows enable row level security;
alter table public.community_messages enable row level security;

revoke all on table public.app_private_config from anon, authenticated;
revoke all on table public.rate_limit_windows from anon, authenticated;
revoke all on table public.community_messages from anon, authenticated;

grant select, insert, update, delete on table public.app_private_config to service_role;
grant select, insert, update, delete on table public.rate_limit_windows to service_role;
grant select, insert, update, delete on table public.community_messages to service_role;
grant select on table public.model_runs to anon, authenticated;
grant select on table public.signals to anon, authenticated;
grant select on table public.community_messages to anon, authenticated;

drop policy if exists "No direct anonymous config access" on public.app_private_config;
create policy "No direct anonymous config access"
on public.app_private_config for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No direct anonymous generic rate window access" on public.rate_limit_windows;
create policy "No direct anonymous generic rate window access"
on public.rate_limit_windows for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Public can read public model runs" on public.model_runs;
create policy "Public can read public model runs"
on public.model_runs for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Public can read evidence signals" on public.signals;
create policy "Public can read evidence signals"
on public.signals for select
to anon, authenticated
using (true);

drop policy if exists "Public can read approved community messages" on public.community_messages;
create policy "Public can read approved community messages"
on public.community_messages for select
to anon, authenticated
using (moderation_status = 'approved');

drop policy if exists "No direct anonymous community message writes" on public.community_messages;
create policy "No direct anonymous community message writes"
on public.community_messages for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.is_valid_server_action_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when p_secret is null or char_length(p_secret) < 32 then false
    else coalesce(
      (
        select value_sha256 = encode(extensions.digest(p_secret, 'sha256'), 'hex')
        from public.app_private_config
        where config_key = 'server_action_secret'
        limit 1
      ),
      false
    )
  end
$$;

create or replace function public.consume_rate_limit_action(
  p_rate_limit_key text,
  p_window_start timestamptz,
  p_max_actions integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  if p_rate_limit_key is null or p_max_actions < 1 then
    return false;
  end if;

  insert into public.rate_limit_windows (
    rate_limit_key,
    window_start,
    action_count,
    updated_at
  )
  values (p_rate_limit_key, p_window_start, 1, now())
  on conflict (rate_limit_key)
  do update set
    window_start = case
      when public.rate_limit_windows.window_start < p_window_start
        then p_window_start
      else public.rate_limit_windows.window_start
    end,
    action_count = case
      when public.rate_limit_windows.window_start < p_window_start
        then 1
      else public.rate_limit_windows.action_count + 1
    end,
    updated_at = now()
  returning action_count into next_count;

  return next_count <= p_max_actions;
end;
$$;

create or replace function public.submit_user_prediction_from_server(
  p_server_secret text,
  p_predicted_at timestamptz,
  p_display_name text,
  p_note_private text,
  p_rate_limit_hash text,
  p_user_agent_hash text,
  p_window_start timestamptz,
  p_max_submissions integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
  inserted_id uuid;
  inserted_at timestamptz;
begin
  if not public.is_valid_server_action_secret(p_server_secret) then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  allowed := public.consume_rate_limit_action(
    'prediction:' || p_rate_limit_hash,
    p_window_start,
    p_max_submissions
  );

  if not allowed then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into public.user_predictions (
    predicted_at,
    display_name,
    note_private,
    rate_limit_hash,
    user_agent_hash,
    moderation_status
  )
  values (
    p_predicted_at,
    nullif(left(coalesce(p_display_name, ''), 40), ''),
    nullif(left(coalesce(p_note_private, ''), 240), ''),
    p_rate_limit_hash,
    p_user_agent_hash,
    'private'
  )
  returning id, created_at into inserted_id, inserted_at;

  return jsonb_build_object(
    'ok', true,
    'predictionId', inserted_id,
    'createdAt', inserted_at
  );
end;
$$;

create or replace function public.submit_community_message_from_server(
  p_server_secret text,
  p_display_name text,
  p_body text,
  p_rate_limit_hash text,
  p_user_agent_hash text,
  p_window_start timestamptz,
  p_max_messages integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed boolean;
  cleaned_body text;
  cleaned_name text;
  inserted_id uuid;
  inserted_at timestamptz;
begin
  if not public.is_valid_server_action_secret(p_server_secret) then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  cleaned_body := trim(coalesce(p_body, ''));
  cleaned_name := nullif(left(trim(coalesce(p_display_name, '')), 40), '');

  if char_length(cleaned_body) < 1 or char_length(cleaned_body) > 280 then
    return jsonb_build_object('ok', false, 'error', 'message_invalid');
  end if;

  allowed := public.consume_rate_limit_action(
    'community_message:' || p_rate_limit_hash,
    p_window_start,
    p_max_messages
  );

  if not allowed then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into public.community_messages (
    display_name,
    body,
    rate_limit_hash,
    user_agent_hash,
    moderation_status
  )
  values (
    cleaned_name,
    cleaned_body,
    p_rate_limit_hash,
    p_user_agent_hash,
    'pending'
  )
  returning id, created_at into inserted_id, inserted_at;

  return jsonb_build_object(
    'ok', true,
    'messageId', inserted_id,
    'createdAt', inserted_at,
    'moderationStatus', 'pending'
  );
end;
$$;

create or replace function public.persist_ingestion_result_from_server(
  p_server_secret text,
  p_source jsonb,
  p_fetch_status text,
  p_fetch_reason text,
  p_item jsonb default null,
  p_signals jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  stored_source public.sources%rowtype;
  stored_item public.source_items%rowtype;
  next_signal jsonb;
  signal_count integer := 0;
begin
  if not public.is_valid_server_action_secret(p_server_secret) then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  insert into public.sources (
    platform,
    name,
    handle,
    url,
    trust_weight,
    crawl_policy,
    requires_api,
    is_active,
    last_fetch_status,
    last_fetched_at,
    updated_at
  )
  values (
    p_source->>'platform',
    p_source->>'name',
    nullif(p_source->>'handle', ''),
    p_source->>'url',
    least(1, greatest(0, coalesce((p_source->>'trust_weight')::numeric, 0.5))),
    p_source->>'crawl_policy',
    coalesce((p_source->>'requires_api')::boolean, false),
    coalesce((p_source->>'is_active')::boolean, true),
    p_fetch_status,
    now(),
    now()
  )
  on conflict (url)
  do update set
    platform = excluded.platform,
    name = excluded.name,
    handle = excluded.handle,
    trust_weight = excluded.trust_weight,
    crawl_policy = excluded.crawl_policy,
    requires_api = excluded.requires_api,
    is_active = excluded.is_active,
    last_fetch_status = excluded.last_fetch_status,
    last_fetched_at = excluded.last_fetched_at,
    updated_at = now()
  returning * into stored_source;

  if p_fetch_status <> 'fetched' or p_item is null then
    return jsonb_build_object(
      'ok', true,
      'itemStored', false,
      'signalsStored', 0,
      'reason', p_fetch_reason
    );
  end if;

  insert into public.source_items (
    source_id,
    external_id,
    url,
    author_name,
    author_handle,
    title,
    excerpt,
    content_hash,
    raw_metadata,
    fetch_status,
    error_code,
    published_at,
    fetched_at
  )
  values (
    stored_source.id,
    nullif(p_item->>'external_id', ''),
    p_item->>'url',
    nullif(p_item->>'author_name', ''),
    nullif(p_item->>'author_handle', ''),
    nullif(p_item->>'title', ''),
    p_item->>'excerpt',
    p_item->>'content_hash',
    coalesce(p_item->'raw_metadata', '{}'::jsonb),
    coalesce(p_item->>'fetch_status', 'fetched'),
    nullif(p_item->>'error_code', ''),
    nullif(p_item->>'published_at', '')::timestamptz,
    now()
  )
  on conflict (url)
  do update set
    source_id = excluded.source_id,
    external_id = excluded.external_id,
    author_name = excluded.author_name,
    author_handle = excluded.author_handle,
    title = excluded.title,
    excerpt = excluded.excerpt,
    content_hash = excluded.content_hash,
    raw_metadata = excluded.raw_metadata,
    fetch_status = excluded.fetch_status,
    error_code = excluded.error_code,
    published_at = excluded.published_at,
    fetched_at = now()
  returning * into stored_item;

  delete from public.signals where source_item_id = stored_item.id;

  for next_signal in select * from jsonb_array_elements(coalesce(p_signals, '[]'::jsonb))
  loop
    insert into public.signals (
      source_item_id,
      signal_type,
      confidence,
      weight,
      summary,
      evidence_quote
    )
    values (
      stored_item.id,
      next_signal->>'signal_type',
      least(1, greatest(0, coalesce((next_signal->>'confidence')::numeric, 0.5))),
      coalesce((next_signal->>'weight')::numeric, 0.5),
      next_signal->>'summary',
      nullif(next_signal->>'evidence_quote', '')
    );
    signal_count := signal_count + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'itemStored', true,
    'signalsStored', signal_count,
    'sourceId', stored_source.id,
    'sourceItemId', stored_item.id
  );
end;
$$;

create or replace function public.insert_model_run_from_server(
  p_server_secret text,
  p_model_version text,
  p_target_date timestamptz,
  p_confidence_label text,
  p_confidence_band_days integer,
  p_reset_signal_probability integer,
  p_rationale text,
  p_evidence_signal_ids uuid[]
)
returns public.model_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_run public.model_runs%rowtype;
begin
  if not public.is_valid_server_action_secret(p_server_secret) then
    raise exception 'invalid_server_action_secret' using errcode = '28000';
  end if;

  insert into public.model_runs (
    model_version,
    target_date,
    confidence_label,
    confidence_band_days,
    reset_signal_probability,
    rationale,
    evidence_signal_ids,
    is_public
  )
  values (
    p_model_version,
    p_target_date,
    p_confidence_label,
    p_confidence_band_days,
    p_reset_signal_probability,
    p_rationale,
    p_evidence_signal_ids,
    true
  )
  returning * into inserted_run;

  return inserted_run;
end;
$$;

revoke all on function public.is_valid_server_action_secret(text) from public, anon, authenticated;
revoke all on function public.consume_rate_limit_action(text, timestamptz, integer) from public, anon, authenticated;
revoke all on function public.submit_user_prediction_from_server(text, timestamptz, text, text, text, text, timestamptz, integer) from public;
revoke all on function public.submit_community_message_from_server(text, text, text, text, text, timestamptz, integer) from public;
revoke all on function public.persist_ingestion_result_from_server(text, jsonb, text, text, jsonb, jsonb) from public;
revoke all on function public.insert_model_run_from_server(text, text, timestamptz, text, integer, integer, text, uuid[]) from public;

grant execute on function public.submit_user_prediction_from_server(text, timestamptz, text, text, text, text, timestamptz, integer) to anon, authenticated, service_role;
grant execute on function public.submit_community_message_from_server(text, text, text, text, text, timestamptz, integer) to anon, authenticated, service_role;
grant execute on function public.persist_ingestion_result_from_server(text, jsonb, text, text, jsonb, jsonb) to anon, authenticated, service_role;
grant execute on function public.insert_model_run_from_server(text, text, timestamptz, text, integer, integer, text, uuid[]) to anon, authenticated, service_role;
grant execute on function public.consume_rate_limit_action(text, timestamptz, integer) to service_role;
