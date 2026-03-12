-- Push subscription storage
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: select own"
  on public.push_subscriptions for select to authenticated
  using ( user_id = (select auth.uid()) );

create policy "push_subscriptions: insert own"
  on public.push_subscriptions for insert to authenticated
  with check ( user_id = (select auth.uid()) );

create policy "push_subscriptions: delete own"
  on public.push_subscriptions for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- Allow service_role to insert notifications for other users
create policy "notifications: insert for service role"
  on public.notifications for insert to service_role
  with check ( true );

-- Add reminder_sent flag to events to prevent duplicate reminders
alter table public.events add column reminder_sent boolean not null default false;

-- Index for cron job query
create index idx_events_reminder_pending
  on public.events (start_time)
  where reminder_sent = false;

-- Enable Realtime on notifications
alter publication supabase_realtime add table notifications;
