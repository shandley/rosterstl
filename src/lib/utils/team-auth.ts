import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export type TeamMembership = {
  user: User;
  role: string;
  isCoachOrManager: boolean;
};

export async function getTeamMembership(
  teamId: string
): Promise<TeamMembership> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/dashboard");

  return {
    user,
    role: membership.role,
    isCoachOrManager:
      membership.role === "coach" || membership.role === "team_manager",
  };
}
