import { createClient } from "@/lib/supabase/server";
import { getTeamMembership } from "@/lib/utils/team-auth";
import { TeamTopbar } from "@/components/team-topbar";
import { PlayerCard } from "@/components/player-card";
import { AddPlayerDialog } from "@/components/add-player-dialog";

export default async function RosterPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { user, isCoachOrManager } = await getTeamMembership(teamId);
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, full_name, jersey_number, position, managed_by")
    .eq("team_id", teamId)
    .order("full_name");

  return (
    <>
      <TeamTopbar title="Roster">
        <AddPlayerDialog teamId={teamId} />
      </TeamTopbar>

      <div className="p-7">
        {players && players.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                canEdit={
                  isCoachOrManager || player.managed_by === user.id
                }
                teamId={teamId}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-popover p-12 text-center">
            <h2 className="font-heading text-xl font-bold">
              No players yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add players to your team roster to get started.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
