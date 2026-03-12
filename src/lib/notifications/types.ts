export type NotificationType =
  | "announcement"
  | "event_created"
  | "event_updated"
  | "event_cancelled"
  | "event_reminder"
  | "recurring_events_created";

export type NotificationPayload = {
  type: NotificationType;
  teamId: string;
  teamName: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  recipientUserIds: string[];
  actorUserId: string;
};
