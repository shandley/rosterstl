import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Fetch teams the user belongs to with member count
  const { data: memberships } = await supabase
    .from("team_members")
    .select("role, teams(id, name, sport, age_group, season)")
    .eq("user_id", user.id);

  const teams =
    memberships
      ?.map((m) => ({
        ...(m.teams as unknown as {
          id: string;
          name: string;
          sport: string;
          age_group: string;
          season: string;
        }),
        role: m.role,
      }))
      .filter((t) => t.id) ?? [];

  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {profile?.full_name || user.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      {teams.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <h2 className="font-heading text-xl font-bold">
            No teams yet
          </h2>
          <p className="mt-2 text-muted-foreground">
            Create a team or join one with an invite code.
          </p>
          <div className="mt-6 flex gap-4">
            <Link
              href="/teams/create"
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent/90 transition"
            >
              Create a Team
            </Link>
            <Link
              href="/join"
              className="rounded-lg border border-border px-6 py-3 font-semibold text-foreground hover:bg-secondary transition"
            >
              Join a Team
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">
              Your Teams ({teams.length})
            </h2>
            <div className="flex gap-3">
              <Link
                href="/teams/create"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition"
              >
                + New Team
              </Link>
              <Link
                href="/join"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition"
              >
                Join Team
              </Link>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="rounded-xl border border-border bg-card p-5 transition hover:border-accent/50"
              >
                <h3 className="font-heading text-lg font-bold">
                  {team.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-primary-foreground">
                    {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)}
                  </span>
                  <span>{team.age_group}</span>
                  <span>{team.season}</span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {team.role.replace("_", " ")}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
