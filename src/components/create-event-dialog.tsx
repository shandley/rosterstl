"use client";

import { useState, useRef } from "react";
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

// Same classes as shadcn Input, but we use native <input> for date/time
// because Base UI's InputPrimitive doesn't fire onChange for these types.
const nativeInputClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function CreateEventDialog({ teamId, venues }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string | null>("practice");
  const [recurring, setRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [isHomeGame, setIsHomeGame] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function resetForm() {
    formRef.current?.reset();
    setEventType("practice");
    setRecurring(false);
    setSelectedDays([]);
    setVenueId(null);
    setIsHomeGame(null);
    setError(null);
    setResultMessage(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResultMessage(null);

    // Read all values from the native form — avoids controlled state issues
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement)?.value?.trim();
    const date = (form.elements.namedItem("eventDate") as HTMLInputElement)?.value;
    const start = (form.elements.namedItem("startTime") as HTMLInputElement)?.value;
    const end = (form.elements.namedItem("endTime") as HTMLInputElement)?.value;
    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement)?.value;
    const opponent = (form.elements.namedItem("opponentName") as HTMLInputElement)?.value;
    const type = eventType ?? "practice";

    if (!title) {
      setError("Title is required");
      setPending(false);
      return;
    }
    if (!date || !start || !end) {
      setError("Date and times are required");
      setPending(false);
      return;
    }

    if (recurring) {
      const seriesEnd = (form.elements.namedItem("seriesEnd") as HTMLInputElement)?.value;

      if (selectedDays.length === 0) {
        setError("Select at least one day of the week");
        setPending(false);
        return;
      }
      if (!seriesEnd) {
        setError("Series end date is required");
        setPending(false);
        return;
      }

      const result = await createRecurringEvents({
        teamId,
        title,
        eventType: type,
        startTimeOfDay: start,
        endTimeOfDay: end,
        venueId: venueId || null,
        notes: notes || null,
        opponentName: opponent || null,
        isHomeGame:
          isHomeGame === "true" ? true : isHomeGame === "false" ? false : null,
        days: selectedDays,
        rangeStart: date,
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
      // Single event
      const formData = new FormData();
      formData.set("teamId", teamId);
      formData.set("title", title);
      formData.set("eventType", type);
      formData.set("startTime", `${date}T${start}`);
      formData.set("endTime", `${date}T${end}`);
      if (venueId) formData.set("venueId", venueId);
      if (notes) formData.set("notes", notes);
      if (opponent) formData.set("opponentName", opponent);
      if (isHomeGame) formData.set("isHomeGame", isHomeGame);

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

        <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="eventTitle">Title</Label>
            <Input
              id="eventTitle"
              name="title"
              placeholder="e.g., Practice at Tower Grove"
              autoComplete="off"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
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

          {/* Date — native <input> to avoid Base UI onChange issues */}
          <div>
            <Label htmlFor="eventDate">
              {recurring ? "Start Date" : "Date"}
            </Label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              className={nativeInputClass + " mt-1"}
            />
          </div>

          {/* Start / End time — native <input> */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eventStartTime">Start Time</Label>
              <input
                id="eventStartTime"
                name="startTime"
                type="time"
                className={nativeInputClass + " mt-1"}
              />
            </div>
            <div>
              <Label htmlFor="eventEndTime">End Time</Label>
              <input
                id="eventEndTime"
                name="endTime"
                type="time"
                className={nativeInputClass + " mt-1"}
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

              {/* Series end date — native <input> */}
              <div>
                <Label htmlFor="seriesEnd">Repeat Until</Label>
                <input
                  id="seriesEnd"
                  name="seriesEnd"
                  type="date"
                  className={nativeInputClass + " mt-1"}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Events will be created on selected days from the start date
                  through this date, using the same time each day.
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
                <Select value={isHomeGame} onValueChange={setIsHomeGame}>
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
            <Select value={venueId} onValueChange={setVenueId}>
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
