"use client";

import { useState } from "react";
import { deleteTeam } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteTeamDialog({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmation === teamName;

  async function handleDelete() {
    if (!confirmed) return;
    setPending(true);
    setError(null);
    const result = await deleteTeam(teamId);
    // redirect happens on success, so we only get here on error
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setConfirmation("");
        setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" className="text-destructive hover:text-destructive">
            Delete Team
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-destructive">
            Delete Team
          </DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{teamName}</strong> and all its
            data including players, events, and announcements. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Type <strong>{teamName}</strong> to confirm:
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={teamName}
            autoComplete="off"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!confirmed || pending}
            onClick={handleDelete}
          >
            {pending ? "Deleting..." : "Delete Team Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
