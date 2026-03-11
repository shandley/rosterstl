"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setAvailability(
  eventId: string,
  playerId: string,
  status: string,
  teamId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  if (!["yes", "no", "maybe"].includes(status)) {
    return { error: "Invalid status" };
  }

  const { error } = await supabase.from("availability").upsert(
    {
      event_id: eventId,
      player_id: playerId,
      status,
      responded_by: user.id,
    },
    { onConflict: "event_id,player_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}/schedule`);
  revalidatePath(`/teams/${teamId}/availability`);
  return { success: true };
}
