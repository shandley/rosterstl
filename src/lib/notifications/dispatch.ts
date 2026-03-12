import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmails } from "./email";
import { sendPushNotifications } from "./push";
import type { NotificationPayload } from "./types";

export async function dispatchNotifications(payload: NotificationPayload) {
  const recipients = payload.recipientUserIds.filter(
    (id) => id !== payload.actorUserId,
  );

  if (recipients.length === 0) return;

  const admin = createAdminClient();

  // 1. Insert in-app notifications
  const rows = recipients.map((userId) => ({
    user_id: userId,
    notification_type: payload.type,
    title: payload.title,
    body: payload.body,
    metadata: {
      team_id: payload.teamId,
      ...payload.metadata,
    },
  }));

  await admin.from("notifications").insert(rows);

  // 2. Fetch recipient emails + push subscriptions
  const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", recipients),
    admin
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", recipients),
  ]);

  // 3. Send emails (fire-and-forget)
  if (profiles && profiles.length > 0) {
    sendNotificationEmails({
      recipients: profiles.map((p) => ({
        email: p.email,
        full_name: p.full_name ?? "",
      })),
      teamName: payload.teamName,
      title: payload.title,
      body: payload.body,
    }).catch(console.error);
  }

  // 4. Send push notifications (fire-and-forget)
  if (subscriptions && subscriptions.length > 0) {
    sendPushNotifications({
      subscriptions,
      title: `[${payload.teamName}] ${payload.title}`,
      body: payload.body,
      metadata: {
        team_id: payload.teamId,
        type: payload.type,
        ...payload.metadata,
      },
    }).catch(console.error);
  }
}
