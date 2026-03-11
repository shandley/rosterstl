"use client";

import { useState } from "react";
import { createEvent, createRecurringEvents } from "@/lib/actions/events";
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

const DAYS = [
  { value: 0, label: "S", full: "Sun" },
  { value: 1, label: "M", full: "Mon" },
  { value: 2, label: "T", full: "Tue" },
  { value: 3, label: "W", full: "Wed" },
  { value: 4, label: "T", full: "Thu" },
  { value: 5, label: "F", full: "Fri" },
  { value: 6, label: "S", full: "Sat" },
];

export function CreateEventDialog({ teamId, venues }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [eventType, setEventType] = useState<string | null>("practice");
  const [recurring, setRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function resetForm() {
    setEventType("practice");
    setRecurring(false);
    setSelectedDays([]);
    setError(null);
    setResultMessage(null);
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setResultMessage(null);

    if (recurring) {
      const venueId = formData.get("venueId") as string;
      const opponentName = formData.get("opponentName") as string;
      const isHomeGame = formData.get("isHomeGame") as string;

      const result = await createRecurringEvents({
        teamId,
        title: formData.get("title") as string,
        eventType: eventType ?? "practice",
        startTimeOfDay: formData.get("startTimeOfDay") as string,
        endTimeOfDay: formData.get("endTimeOfDay") as string,
        venueId: venueId || null,
        notes: (formData.get("notes") as string) || null,
        opponentName: opponentName || null,
        isHomeGame:
          isHomeGame === "true"
            ? true
            : isHomeGame === "false"
              ? false
              : null,
        days: selectedDays,
        rangeStart: formData.get("rangeStart") as string,
        rangeEnd: formData.get("rangeEnd") as string,
      });

      setPending(false);
      if (result.error) {
        setError(result.error);
      } else {
        setResultMessage(`Created ${result.count} events`);
        setTimeout(() => {
          setOpen(false);
          resetForm();
        }, 1200);
      }
    } else {
      formData.set("teamId", teamId);
      const result = await createEvent(formData);
      setPending(false);

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        resetForm();
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
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

          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setRecurring(!recurring)}
                className={`mb-0 w-full rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  recurring
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {recurring ? "Recurring ✓" : "Repeating..."}
              </button>
            </div>
          </div>

          {recurring ? (
            <>
              {/* Day-of-week picker */}
              <div>
                <Label>Repeat on</Label>
                <div className="mt-1 flex gap-1.5">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      title={d.full}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                        selectedDays.includes(d.value)
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rangeStart">From</Label>
                  <Input
                    id="rangeStart"
                    name="rangeStart"
                    type="date"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rangeEnd">To</Label>
                  <Input
                    id="rangeEnd"
                    name="rangeEnd"
                    type="date"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Time of day */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startTimeOfDay">Start Time</Label>
                  <Input
                    id="startTimeOfDay"
                    name="startTimeOfDay"
                    type="time"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endTimeOfDay">End Time</Label>
                  <Input
                    id="endTimeOfDay"
                    name="endTimeOfDay"
                    type="time"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </>
          ) : (
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
          )}

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
              rows={2}
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {resultMessage && (
            <p className="text-sm font-medium text-[#22C55E]">
              {resultMessage}
            </p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={pending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {pending
                ? "Creating..."
                : recurring
                  ? `Create ${selectedDays.length > 0 ? "Series" : "Events"}`
                  : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
