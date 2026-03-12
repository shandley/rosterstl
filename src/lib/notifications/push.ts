import webpush from "web-push";

function initVapid() {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      "mailto:notifications@rosterstl.app",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  }
}

type PushParams = {
  subscriptions: {
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }[];
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export async function sendPushNotifications(params: PushParams) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return;
  }

  initVapid();

  const payload = JSON.stringify({
    title: params.title,
    body: params.body,
    data: params.metadata,
  });

  const results = await Promise.allSettled(
    params.subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );

  for (const [i, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(
        `Push failed for ${params.subscriptions[i].endpoint}:`,
        result.reason,
      );
    }
  }
}
