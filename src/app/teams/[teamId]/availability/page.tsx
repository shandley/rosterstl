import { createClient } from "@/lib/supabase/server";
import { getTeamMembership } from "@/lib/utils/team-auth";
import { TeamTopbar } from "@/components/team-topbar";
import { AvailabilityDot } from "@/components/availability-dot";
import { formatEventDate } from "@/lib/utils/date";

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { user, isCoachOrManager } = await getTeamMembership(teamId);
  const supabase = await createClient();

  // Fetch upcoming events (next 10)
  const { data: events } = await supabase
    .from("events")
    .select("id, title, event_type, start_time")
    .eq("team_id", teamId)
    .gte("start_time", new Date().toISOString())
    .order("start_time")
    .limit(10);

  // Fetch all players
  const { data: players } = await supabase
    .from("players")
    .select("id, full_name, managed_by")
    .eq("team_id", teamId)
    .order("full_name");

  // Fetch availability
  const eventIds = events?.map((e) => e.id) ?? [];
  let availMap: Record<string, "yes" | "no" | "maybe"> = {};

  if (eventIds.length > 0) {
    const { data: avail } = await supabase
      .from("availability")
      .select("event_id, player_id, status")
      .in("event_id", eventIds);

    if (avail) {
      for (const a of avail) {
        availMap[`${a.event_id}:${a.player_id}`] = a.status as
          | "yes"
          | "no"
          | "maybe";
      }
    }
  }

  const hasEvents = events && events.length > 0;
  const hasPlayers = players && players.length > 0;

  return (
    <>
      <TeamTopbar title="Availability" />

      <div className="p-7">
        {!hasEvents || !hasPlayers ? (
          <div className="rounded-lg border border-border bg-popover p-12 text-center text-sm text-muted-foreground">
            {!hasPlayers
              ? "Add players to the roster first."
              : "No upcoming events to show availability for."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-popover">
            <table className="w-full border-collapse">
              {/* Header row with events */}
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-[140px] min-w-[140px] bg-popover px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Player
                  </th>
                  {events.map((event) => {
                    const { month, day } = formatEventDate(event.start_time);
                    return (
                      <th
                        key={event.id}
                        className="px-1.5 py-2 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-semibold uppercase text-muted-foreground">
                            {month}
                          </span>
                          <span className="font-heading text-lg font-black leading-none text-accent">
                            {day}
                          </span>
                          <span className="mt-0.5 text-[9px] text-muted-foreground">
                            {event.event_type === "game"
                              ? "🎮"
                              : event.event_type === "practice"
                                ? "⚡"
                                : "📌"}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {players.map((player) => (
                  <tr
                    key={player.id}
                    className="border-t border-border"
                  >
                    <td className="sticky left-0 z-10 bg-popover px-3 py-2 text-[13px] font-medium">
                      {player.full_name}
                    </td>
                    {events.map((event) => (
                      <td key={event.id} className="px-1.5 py-2 text-center">
                        <div className="flex justify-center">
                          <AvailabilityDot
                            eventId={event.id}
                            playerId={player.id}
                            status={
                              availMap[`${event.id}:${player.id}`] ?? null
                            }
                            canEdit={
                              isCoachOrManager ||
                              player.managed_by === user.id
                            }
                            teamId={teamId}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Summary row */}
                <tr className="border-t-2 border-border">
                  <td className="sticky left-0 z-10 bg-popover px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Confirmed
                  </td>
                  {events.map((event) => {
                    const confirmed = players.filter(
                      (p) =>
                        availMap[`${event.id}:${p.id}`] === "yes"
                    ).length;
                    return (
                      <td
                        key={event.id}
                        className="px-1.5 py-2 text-center"
                      >
                        <span className="text-sm font-bold text-[#22C55E]">
                          {confirmed}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          /{players.length}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
