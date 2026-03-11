import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InviteButton } from "./invite-button";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!team) redirect("/dashboard");

  const { data: members } = await supabase
    .from("team_members")
    .select("id, role, joined_at, profiles(full_name, email)")
    .eq("team_id", teamId);

  // Check if current user is a coach or manager
  const currentMember = members?.find((m) => m.profiles && "email" in m.profiles);
  const userMembership = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  const isManager =
    userMembership?.data?.role === "coach" ||
    userMembership?.data?.role === "team_manager";

  return (
    <div className="min-h-screen p-8">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-accent"
      >
        &larr; Back to Dashboard
      </Link>

      <div className="mt-6">
        <h1 className="font-heading text-3xl font-bold">{team.name}</h1>
        <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
          <span className="rounded bg-primary/20 px-2 py-0.5 text-primary-foreground">
            {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)}
          </span>
          <span>{team.age_group}</span>
          <span>{team.season}</span>
        </div>
      </div>

      {isManager && (
        <div className="mt-6">
          <InviteButton teamId={teamId} />
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-heading text-xl font-bold">
          Members ({members?.length ?? 0})
        </h2>
        <div className="mt-4 space-y-2">
          {members?.map((member) => {
            const profile = member.profiles as unknown as {
              full_name: string;
              email: string;
            } | null;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
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
  );
}
