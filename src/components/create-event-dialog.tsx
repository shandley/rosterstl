"use client";

import { useState } from "react";
import { createEvent } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";

type CreateEventDialogProps = {
  teamId: string;
  venues: { id: string; name: string; city: string }[];
};

export function CreateEventDialog({ teamId, venues }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [eventType, setEventType] = useState<string | null>("practice");

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("teamId", teamId);
    const result = await createEvent(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setEventType("practice");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            + New Event
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold">
            Create Event
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="eventTitle">Title</Label>
            <Input
              id="eventTitle"
              name="title"
              placeholder="e.g., Practice at Tower Grove"
              required
              autoComplete="off"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Event Type</Label>
            <Select
              name="eventType"
              required
              value={eventType}
              onValueChange={setEventType}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="game">Game</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                name="endTime"
                type="datetime-local"
                required
                className="mt-1"
              />
            </div>
          </div>

          {eventType === "game" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="opponentName">Opponent</Label>
                <Input
                  id="opponentName"
                  name="opponentName"
                  placeholder="e.g., Chesterfield FC"
                  autoComplete="off"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Home/Away</Label>
                <Select name="isHomeGame">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Home</SelectItem>
                    <SelectItem value="false">Away</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label>Venue</Label>
            <Select name="venueId">
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select venue (optional)" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} — {v.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="eventNotes">Notes</Label>
            <Textarea
              id="eventNotes"
              name="notes"
              placeholder="Any additional details..."
              rows={3}
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
              {pending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
