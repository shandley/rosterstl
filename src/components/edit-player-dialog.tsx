"use client";

import { useState } from "react";
import { updatePlayer, removePlayer } from "@/lib/actions/players";
import { SPORT_POSITIONS } from "@/lib/sport-positions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type EditPlayerDialogProps = {
  player: {
    id: string;
    full_name: string;
    jersey_number: string | null;
    position: string | null;
  };
  teamId: string;
  sport: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditPlayerDialog({
  player,
  teamId,
  sport,
  open,
  onOpenChange,
}: EditPlayerDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const positions = SPORT_POSITIONS[sport] ?? [];

  async function handleUpdate(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("playerId", player.id);
    formData.set("teamId", teamId);
    const result = await updatePlayer(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("playerId", player.id);
    formData.set("teamId", teamId);
    const result = await removePlayer(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        setConfirmDelete(false);
        setError(null);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            Edit Player
          </DialogTitle>
        </DialogHeader>

        <form action={handleUpdate} className="space-y-4">
          <div>
            <Label htmlFor="editFullName">Full Name</Label>
            <Input
              id="editFullName"
              name="fullName"
              defaultValue={player.full_name}
              required
              autoComplete="off"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editJerseyNumber">Jersey #</Label>
              <Input
                id="editJerseyNumber"
                name="jerseyNumber"
                defaultValue={player.jersey_number ?? ""}
                autoComplete="off"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Position</Label>
              {positions.length > 0 ? (
                <Select
                  name="position"
                  defaultValue={player.position ?? undefined}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  name="position"
                  defaultValue={player.position ?? ""}
                  autoComplete="off"
                  className="mt-1"
                />
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="justify-between sm:justify-between">
            {!confirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                disabled={pending}
              >
                {pending ? "Removing..." : "Confirm Remove"}
              </Button>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
