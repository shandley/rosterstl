import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TeamSidebar } from "@/components/team-sidebar";
import { NotificationBell } from "@/components/notification-bell";

export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
    .select("id, name, sport, season")
    .eq("id", teamId)
    .single();

  if (!team) redirect("/dashboard");

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { count: announcementCount } = await supabase
    .from("announcements")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  return (
    <div className="flex min-h-screen">
      <TeamSidebar
        team={team}
        profile={
          profile ?? { full_name: "", email: user.email ?? "" }
        }
        role={membership.role}
        announcementCount={announcementCount ?? 0}
      />
      <main className="min-h-screen flex-1 md:ml-[220px]">
        <div className="pointer-events-none fixed right-4 top-3 z-30 flex justify-end md:right-7">
          <div className="pointer-events-auto">
            <NotificationBell userId={user.id} />
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
