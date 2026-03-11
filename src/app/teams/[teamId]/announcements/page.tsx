import { createClient } from "@/lib/supabase/server";
import { getTeamMembership } from "@/lib/utils/team-auth";
import { TeamTopbar } from "@/components/team-topbar";
import { CreateAnnouncementDialog } from "@/components/create-announcement-dialog";
import { relativeTime } from "@/lib/utils/date";

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { isCoachOrManager } = await getTeamMembership(teamId);
  const supabase = await createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, body, created_at, profiles:author_id(full_name)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  return (
    <>
      <TeamTopbar title="Announcements">
        {isCoachOrManager && (
          <CreateAnnouncementDialog teamId={teamId} />
        )}
      </TeamTopbar>

      <div className="p-7">
        {announcements && announcements.length > 0 ? (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => {
              const author = a.profiles as unknown as {
                full_name: string;
              } | null;
              return (
                <div
                  key={a.id}
                  className="rounded-lg border border-border border-l-[3px] border-l-primary bg-popover p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {a.title || "Announcement"}
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      {relativeTime(a.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>
                  {author && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[9px] font-bold text-accent">
                        {author.full_name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {author.full_name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-popover p-12 text-center text-sm text-muted-foreground">
            No announcements yet.
            {isCoachOrManager &&
              " Click the button above to post one."}
          </div>
        )}
      </div>
    </>
  );
}
