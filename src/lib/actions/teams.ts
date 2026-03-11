"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const sport = formData.get("sport") as string;
  const ageGroup = formData.get("ageGroup") as string;
  const season = formData.get("season") as string;

  if (!name || !sport || !ageGroup || !season) {
    return { error: "All fields are required" };
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name,
      sport,
      age_group: ageGroup,
      season,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  redirect(`/teams/${data.id}`);
}

export async function redeemInvite(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase.rpc("redeem_invite", {
    _invite_code: code,
  });

  if (error) {
    return { error: error.message };
  }

  const result = data as { team_id: string; role: string };
  redirect(`/teams/${result.team_id}`);
}

export async function createInvite(teamId: string, role: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("team_invites")
    .insert({
      team_id: teamId,
      role,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })
    .select("invite_code")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { inviteCode: data.invite_code };
}

export async function deleteTeam(teamId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // RLS enforces only the creator can delete
  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
