import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailParams = {
  recipients: { email: string; full_name: string }[];
  teamName: string;
  title: string;
  body: string;
};

export async function sendNotificationEmails(params: EmailParams) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "PLACEHOLDER_ADD_YOUR_KEY") {
    return;
  }

  const emails = params.recipients.map((r) => ({
    from: process.env.RESEND_FROM_EMAIL || "RosterSTL <onboarding@resend.dev>",
    to: r.email,
    subject: `[${params.teamName}] ${params.title}`,
    text: `Hi ${r.full_name || "there"},\n\n${params.body}\n\n---\nRosterSTL — https://rosterstl.app`,
  }));

  // Resend batch supports up to 100 per call
  const BATCH_SIZE = 100;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    try {
      await resend.batch.send(batch);
    } catch (err) {
      console.error("Email batch send failed:", err);
    }
  }
}
