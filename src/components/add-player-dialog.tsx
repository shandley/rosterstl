"use client";

import { useState } from "react";
import { addPlayer } from "@/lib/actions/players";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddPlayerDialog({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("teamId", teamId);
    const result = await addPlayer(formData);
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
            + Add Player
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            Add Player
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="e.g., Alex Johnson"
              required
              autoComplete="off"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="jerseyNumber">Jersey #</Label>
              <Input
                id="jerseyNumber"
                name="jerseyNumber"
                placeholder="e.g., 10"
                autoComplete="off"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                name="position"
                placeholder="e.g., Midfielder"
                autoComplete="off"
                className="mt-1"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="submit"
              disabled={pending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {pending ? "Adding..." : "Add Player"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
