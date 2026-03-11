"use client";

import { useState } from "react";
import { createAnnouncement } from "@/lib/actions/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateAnnouncementDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("teamId", teamId);
    const result = await createAnnouncement(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            + New Announcement
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            Post Announcement
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="announcementTitle">Title (optional)</Label>
            <Input
              id="announcementTitle"
              name="title"
              placeholder="e.g., Schedule Change"
              autoComplete="off"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="announcementBody">Message</Label>
            <Textarea
              id="announcementBody"
              name="body"
              placeholder="Write your announcement..."
              required
              rows={5}
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="submit"
              disabled={pending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {pending ? "Posting..." : "Post Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
