-- Auto-add team creator as team_manager when a team is created.
-- This solves the RLS bootstrapping problem: team_members INSERT requires
-- coach/manager role, but the creator isn't a member yet.

create or replace function public.handle_new_team()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, new.created_by, 'team_manager');
  return new;
end;
$$;

create trigger on_team_created
  after insert on public.teams
  for each row execute procedure public.handle_new_team();
