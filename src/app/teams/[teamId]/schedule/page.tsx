import { createClient } from "@/lib/supabase/server";
import { getTeamMembership } from "@/lib/utils/team-auth";
import { TeamTopbar } from "@/components/team-topbar";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { WeatherAlertBanner } from "@/components/weather-alert-banner";
import { ScheduleTabs } from "./schedule-tabs";
import { getWeatherForEvents } from "@/lib/weather";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { user, isCoachOrManager } = await getTeamMembership(teamId);
  const supabase = await createClient();

  // Fetch all events for the team
  const { data: events } = await supabase
    .from("events")
    .select("id, title, event_type, start_time, end_time, opponent_name, is_home_game, notes, venues(name, address, city, state, lat, lng)")
    .eq("team_id", teamId)
    .order("start_time");

  // Fetch venues for the create event dialog
  const { data: venues } = await supabase
    .from("venues")
    .select("id, name, city")
    .order("name");

  // Fetch current user's managed players
  const { data: myPlayers } = await supabase
    .from("players")
    .select("id, full_name")
    .eq("team_id", teamId)
    .eq("managed_by", user.id);

  // Fetch availability for user's players
  const playerIds = myPlayers?.map((p) => p.id) ?? [];
  let availabilityMap: Record<string, string> = {};

  if (playerIds.length > 0) {
    const { data: avail } = await supabase
      .from("availability")
      .select("event_id, player_id, status")
      .in("player_id", playerIds);

    if (avail) {
      for (const a of avail) {
        availabilityMap[`${a.event_id}:${a.player_id}`] = a.status;
      }
    }
  }

  const now = new Date().toISOString();
  const upcomingEvents =
    events?.filter((e) => e.start_time >= now) ?? [];
  const pastEvents =
    events
      ?.filter((e) => e.start_time < now)
      .reverse() ?? [];

  // Fetch weather for upcoming events
  const { weatherMap, alerts } = await getWeatherForEvents(
    upcomingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      start_time: e.start_time,
      venues: e.venues as { lat: number | null; lng: number | null } | null,
    })),
  );

  return (
    <>
      <TeamTopbar title="Schedule">
        {isCoachOrManager && (
          <CreateEventDialog teamId={teamId} venues={venues ?? []} />
        )}
      </TeamTopbar>

      <div className="p-7">
        {alerts.length > 0 && <WeatherAlertBanner alerts={alerts} />}
        <ScheduleTabs
          upcomingEvents={upcomingEvents}
          pastEvents={pastEvents}
          myPlayers={myPlayers ?? []}
          availability={availabilityMap}
          teamId={teamId}
          weatherMap={weatherMap}
        />
      </div>
    </>
  );
}
