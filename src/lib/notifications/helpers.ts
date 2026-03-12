import { createAdminClient } from "@/lib/supabase/admin";

export async function getTeamMemberUserIds(teamId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId);

  return data?.map((m) => m.user_id) ?? [];
}

export async function getTeamName(teamId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .single();

  return data?.name ?? "Your Team";
}
