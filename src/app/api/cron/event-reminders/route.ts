import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotifications } from "@/lib/notifications/dispatch";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  // Find events starting in 22-26 hours that haven't had reminders sent
  const { data: events } = await admin
    .from("events")
    .select("id, title, event_type, start_time, team_id, teams(name)")
    .eq("reminder_sent", false)
    .gte("start_time", windowStart.toISOString())
    .lte("start_time", windowEnd.toISOString());

  if (!events || events.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sentCount = 0;

  for (const event of events) {
    const teamName =
      (event.teams as unknown as { name: string })?.name ?? "Your Team";

    const { data: members } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", event.team_id);

    if (members && members.length > 0) {
      const date = new Date(event.start_time);
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      });

      await dispatchNotifications({
        type: "event_reminder",
        teamId: event.team_id,
        teamName,
        title: `Reminder: ${event.title} tomorrow`,
        body: `${event.event_type === "game" ? "Game" : "Event"} at ${timeStr} CT`,
        recipientUserIds: members.map((m) => m.user_id),
        actorUserId: "",
        metadata: { event_id: event.id },
      });

      sentCount++;
    }

    // Mark reminder as sent
    await admin
      .from("events")
      .update({ reminder_sent: true })
      .eq("id", event.id);
  }

  return NextResponse.json({ sent: sentCount });
}
