import { createClient } from "@/lib/supabase/server";
import { getTeamMembership } from "@/lib/utils/team-auth";
import { TeamTopbar } from "@/components/team-topbar";
import { InviteButton } from "./invite-button";
import { DeleteTeamDialog } from "@/components/delete-team-dialog";
import Link from "next/link";

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { user, isCoachOrManager } = await getTeamMembership(teamId);
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!team) return null;

  const { data: members } = await supabase
    .from("team_members")
    .select("id, role, joined_at, profiles(full_name, email)")
    .eq("team_id", teamId);

  const { data: players } = await supabase
    .from("players")
    .select("id")
    .eq("team_id", teamId);

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("id, title, event_type, start_time, opponent_name, venues(name, address, city, state)")
    .eq("team_id", teamId)
    .gte("start_time", new Date().toISOString())
    .order("start_time")
    .limit(3);

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, profiles:author_id(full_name)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <>
      <TeamTopbar title="Dashboard">
        {isCoachOrManager && <InviteButton teamId={teamId} />}
        {team.created_by === user.id && (
          <DeleteTeamDialog teamId={teamId} teamName={team.name} />
        )}
      </TeamTopbar>

      <div className="p-7">
        {/* Team info */}
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded bg-primary/20 px-2 py-0.5 text-primary-foreground">
            {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)}
          </span>
          <span>{team.age_group}</span>
          <span>{team.season}</span>
        </div>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Roster"
            value={String(players?.length ?? 0)}
            subtext="players"
            color="blue"
            href={`/teams/${teamId}/roster`}
          />
          <StatCard
            label="Members"
            value={String(members?.length ?? 0)}
            subtext="coaches & parents"
            color="gold"
            href={`/teams/${teamId}`}
          />
          <StatCard
            label="Upcoming"
            value={String(upcomingEvents?.length ?? 0)}
            subtext="events scheduled"
            color="green"
            href={`/teams/${teamId}/schedule`}
          />
        </div>

        {/* Two-column layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">
                Upcoming Events
              </h2>
              <a
                href={`/teams/${teamId}/schedule`}
                className="text-xs font-semibold text-muted-foreground hover:text-accent"
              >
                View All →
              </a>
            </div>
            <div className="mt-3 space-y-2">
              {upcomingEvents && upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  const date = new Date(event.start_time);
                  const venue = event.venues as unknown as { name: string; address: string; city: string; state: string } | null;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-popover p-3"
                    >
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-white/[0.04]">
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                        <span className="font-heading text-lg font-black leading-none text-accent">
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {venue ? (
                            <>
                              {" · "}
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}, ${venue.state}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                              >
                                {venue.name}
                              </a>
                            </>
                          ) : ""}
                          {event.opponent_name
                            ? ` · vs ${event.opponent_name}`
                            : ""}
                        </p>
                      </div>
                      <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                        {event.event_type}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-border bg-popover p-8 text-center text-sm text-muted-foreground">
                  No upcoming events.{" "}
                  {isCoachOrManager && (
                    <a
                      href={`/teams/${teamId}/schedule`}
                      className="text-accent hover:underline"
                    >
                      Create one
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">Announcements</h2>
              <a
                href={`/teams/${teamId}/announcements`}
                className="text-xs font-semibold text-muted-foreground hover:text-accent"
              >
                View All →
              </a>
            </div>
            <div className="mt-3 space-y-2">
              {announcements && announcements.length > 0 ? (
                announcements.map((a) => {
                  const author = a.profiles as unknown as {
                    full_name: string;
                  } | null;
                  const ago = getRelativeTime(a.created_at);
                  return (
                    <div
                      key={a.id}
                      className="rounded-lg border border-border border-l-[3px] border-l-primary bg-popover p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {a.title || "Announcement"}
                        </p>
                        <span className="text-[10px] text-muted-foreground">
                          {ago}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {a.body}
                      </p>
                      {author && (
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          — {author.full_name}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-border bg-popover p-8 text-center text-sm text-muted-foreground">
                  No announcements yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="mt-8">
          <h2 className="font-heading text-lg font-bold">
            Members ({members?.length ?? 0})
          </h2>
          <div className="mt-3 space-y-2">
            {members?.map((member) => {
              const profile = member.profiles as unknown as {
                full_name: string;
                email: string;
              } | null;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-popover px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {profile?.full_name || profile?.email || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {member.role.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  subtext,
  color,
  href,
}: {
  label: string;
  value: string;
  subtext: string;
  color: "blue" | "gold" | "green" | "red";
  href: string;
}) {
  const borderColors = {
    blue: "border-t-primary",
    gold: "border-t-accent",
    green: "border-t-[#22C55E]",
    red: "border-t-destructive",
  };

  return (
    <Link
      href={href}
      className={`block rounded-lg border border-border border-t-2 ${borderColors[color]} bg-popover p-4 transition hover:border-accent/40`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-4xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
    </Link>
  );
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
