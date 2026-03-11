"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPlayer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const teamId = formData.get("teamId") as string;
  const fullName = formData.get("fullName") as string;
  const jerseyNumber = (formData.get("jerseyNumber") as string) || null;
  const position = (formData.get("position") as string) || null;

  if (!teamId || !fullName) {
    return { error: "Team and player name are required" };
  }

  const { error } = await supabase.from("players").insert({
    team_id: teamId,
    managed_by: user.id,
    full_name: fullName,
    jersey_number: jerseyNumber,
    position,
  });

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}/roster`);
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function updatePlayer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const playerId = formData.get("playerId") as string;
  const teamId = formData.get("teamId") as string;
  const fullName = formData.get("fullName") as string;
  const jerseyNumber = (formData.get("jerseyNumber") as string) || null;
  const position = (formData.get("position") as string) || null;

  if (!playerId || !fullName) {
    return { error: "Player ID and name are required" };
  }

  const { error } = await supabase
    .from("players")
    .update({ full_name: fullName, jersey_number: jerseyNumber, position })
    .eq("id", playerId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}/roster`);
  return { success: true };
}

export async function removePlayer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const playerId = formData.get("playerId") as string;
  const teamId = formData.get("teamId") as string;

  if (!playerId) return { error: "Player ID is required" };

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}/roster`);
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}
