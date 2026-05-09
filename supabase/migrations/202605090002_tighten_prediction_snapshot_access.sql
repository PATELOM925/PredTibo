-- Keep the public snapshot projection anonymous-only.
-- Authenticated users do not need a broader direct Supabase surface for launch.

revoke all privileges on table public.prediction_snapshots from authenticated;

drop policy if exists "Public can read prediction snapshots" on public.prediction_snapshots;
create policy "Public can read prediction snapshots"
on public.prediction_snapshots for select
to anon
using (is_public = true);
