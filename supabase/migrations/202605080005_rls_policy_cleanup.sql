-- PredTibo V2.4: remove redundant deny-all policies where explicit read policies exist.
-- RLS denies writes by default when no insert/update/delete policy exists.

drop policy if exists "No direct anonymous community message writes" on public.community_messages;
drop policy if exists "No direct anonymous model run access" on public.model_runs;
drop policy if exists "No direct anonymous signal access" on public.signals;
