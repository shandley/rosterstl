"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { getTeamMemberUserIds, getTeamName } from "@/lib/notifications/helpers";

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const teamId = formData.get("teamId") as string;
  const title = (formData.get("title") as string) || null;
  const body = formData.get("body") as string;

  if (!teamId || !body) {
    return { error: "Announcement body is required" };
  }

  const { error } = await supabase.from("announcements").insert({
    team_id: teamId,
    author_id: user.id,
    title,
    body,
  });

  if (error) return { error: error.message };

  revalidatePath(`/teams/${teamId}/announcements`);
  revalidatePath(`/teams/${teamId}`);

  // Notify team members (fire-and-forget)
  Promise.all([getTeamMemberUserIds(teamId), getTeamName(teamId)])
    .then(([memberIds, teamName]) =>
      dispatchNotifications({
        type: "announcement",
        teamId,
        teamName,
        title: title || "New Announcement",
        body: body.length > 200 ? body.slice(0, 200) + "..." : body,
        recipientUserIds: memberIds,
        actorUserId: user.id,
      }),
    )
    .catch(console.error);

  return { success: true };
}
