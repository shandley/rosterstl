-- Fix: INSERT ... RETURNING checks SELECT policy, but the AFTER INSERT trigger
-- that adds the creator to team_members hasn't fired yet. Allow creator to
-- always see their own team.

drop policy "teams: select for members" on public.teams;

create policy "teams: select for members or creator"
  on public.teams for select to authenticated
  using (
    created_by = (select auth.uid())
    or id in (select private.get_team_ids_for_user())
  );
