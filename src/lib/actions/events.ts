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

export async function createRecurringEvents(data: {
  teamId: string;
  title: string;
  eventType: string;
  startTimeOfDay: string; // "HH:MM" format
  endTimeOfDay: string;
  venueId: string | null;
  notes: string | null;
  opponentName: string | null;
  isHomeGame: boolean | null;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  rangeStart: string; // "YYYY-MM-DD"
  rangeEnd: string; // "YYYY-MM-DD"
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  if (!data.teamId || !data.title || !data.eventType || !data.startTimeOfDay || !data.endTimeOfDay) {
    return { error: "Required fields are missing" };
  }

  if (data.days.length === 0) {
    return { error: "Select at least one day" };
  }

  // Generate all dates in the range that match the selected days
  const events: {
    team_id: string;
    title: string;
    event_type: string;
    start_time: string;
    end_time: string;
    venue_id: string | null;
    notes: string | null;
    opponent_name: string | null;
    is_home_game: boolean | null;
    created_by: string;
  }[] = [];

  // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM" formats
  const rangeStartDate = data.rangeStart.split("T")[0];
  const rangeEndDate = data.rangeEnd.split("T")[0];
  const current = new Date(rangeStartDate + "T00:00:00");
  const end = new Date(rangeEndDate + "T23:59:59");

  while (current <= end) {
    if (data.days.includes(current.getDay())) {
      const dateStr = current.toISOString().split("T")[0];
      events.push({
        team_id: data.teamId,
        title: data.title,
        event_type: data.eventType,
        start_time: new Date(`${dateStr}T${data.startTimeOfDay}`).toISOString(),
        end_time: new Date(`${dateStr}T${data.endTimeOfDay}`).toISOString(),
        venue_id: data.venueId,
        notes: data.notes,
        opponent_name: data.opponentName,
        is_home_game: data.isHomeGame,
        created_by: user.id,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  if (events.length === 0) {
    return { error: "No events match the selected days in the date range" };
  }

  const { error } = await supabase.from("events").insert(events);

  if (error) return { error: error.message };

  revalidatePath(`/teams/${data.teamId}/schedule`);
  revalidatePath(`/teams/${data.teamId}`);
  return { success: true, count: events.length };
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
