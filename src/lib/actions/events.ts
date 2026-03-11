"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const teamId = formData.get("teamId") as string;
  const title = formData.get("title") as string;
  const eventType = formData.get("eventType") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const venueId = (formData.get("venueId") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const opponentName = (formData.get("opponentName") as string) || null;
  const isHomeGame = formData.get("isHomeGame");

  if (!teamId || !title || !eventType || !startTime || !endTime) {
    return { error: "Title, type, start time, and end time are required" };
  }

  if (new Date(endTime) <= new Date(startTime)) {
    return { error: "End time must be after start time" };
  }

  const { error } = await supabase.from("events").insert({
    team_id: teamId,
    title,
    event_type: eventType,
    start_time: new Date(startTime).toISOString(),
    end_time: new Date(endTime).toISOString(),
    venue_id: venueId,
    notes,
    opponent_name: opponentName,
    is_home_game: isHomeGame === "true" ? true : isHomeGame === "false" ? false : null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}/schedule`);
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function updateEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const eventId = formData.get("eventId") as string;
  const teamId = formData.get("teamId") as string;
  const title = formData.get("title") as string;
  const eventType = formData.get("eventType") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const venueId = (formData.get("venueId") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const opponentName = (formData.get("opponentName") as string) || null;
  const isHomeGame = formData.get("isHomeGame");

  if (!eventId || !title || !eventType || !startTime || !endTime) {
    return { error: "Required fields are missing" };
  }

  const { error } = await supabase
    .from("events")
    .update({
      title,
      event_type: eventType,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      venue_id: venueId,
      notes,
      opponent_name: opponentName,
      is_home_game: isHomeGame === "true" ? true : isHomeGame === "false" ? false : null,
    })
    .eq("id", eventId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}/schedule`);
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const eventId = formData.get("eventId") as string;
  const teamId = formData.get("teamId") as string;

  if (!eventId) return { error: "Event ID is required" };

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}/schedule`);
  revalidatePath(`/teams/${teamId}`);
  return { success: true };
}
