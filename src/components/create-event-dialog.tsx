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
      // For recurring: use startTime/endTime datetime-local to get the time-of-day,
      // and seriesEnd date input for the end of the series range.
      const startTime = formData.get("startTime") as string;
      const endTime = formData.get("endTime") as string;
      const seriesEnd = formData.get("seriesEnd") as string;
      const venueId = formData.get("venueId") as string;
      const opponentName = formData.get("opponentName") as string;
      const isHomeGame = formData.get("isHomeGame") as string;

      if (!startTime || !endTime || !seriesEnd) {
        setError("Start time, end time, and series end date are required");
        setPending(false);
        return;
      }

      // Extract time-of-day from the datetime-local values (HH:MM)
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      const startTimeOfDay = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
      const endTimeOfDay = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

      // Range: from the start date to the series end date
      const rangeStart = startTime.split("T")[0];

      const result = await createRecurringEvents({
        teamId,
        title: formData.get("title") as string,
        eventType: eventType ?? "practice",
        startTimeOfDay,
        endTimeOfDay,
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
        rangeStart,
        rangeEnd: seriesEnd,
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

          {/* Start / End time — always datetime-local */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime">
                {recurring ? "First Start" : "Start Time"}
              </Label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endTime">
                {recurring ? "First End" : "End Time"}
              </Label>
              <Input
                id="endTime"
                name="endTime"
                type="datetime-local"
                required
                className="mt-1"
              />
            </div>
          </div>

          {recurring && (
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

              {/* Series end date */}
              <div>
                <Label htmlFor="seriesEnd">Repeat Until</Label>
                <Input
                  id="seriesEnd"
                  name="seriesEnd"
                  type="datetime-local"
                  required
                  className="mt-1"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Events will be created on selected days from the first start
                  date through this date, using the same time each day.
                </p>
              </div>
            </>
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
                  ? "Create Series"
                  : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
