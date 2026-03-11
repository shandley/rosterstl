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
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Controlled form state — avoids native browser validation issues
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<string | null>("practice");
  const [recurring, setRecurring] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [seriesEndDate, setSeriesEndDate] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("");
  const [isHomeGame, setIsHomeGame] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function resetForm() {
    setTitle("");
    setEventType("practice");
    setRecurring(false);
    setStartDate("");
    setStartTime("");
    setEndTime("");
    setSeriesEndDate("");
    setSelectedDays([]);
    setVenueId(null);
    setOpponentName("");
    setIsHomeGame(null);
    setNotes("");
    setError(null);
    setResultMessage(null);
  }

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setResultMessage(null);

    // Validate common fields
    if (!title.trim()) {
      setError("Title is required");
      setPending(false);
      return;
    }
    if (!startDate || !startTime || !endTime) {
      setError("Date and times are required");
      setPending(false);
      return;
    }

    const type = eventType ?? "practice";
    const startISO = `${startDate}T${startTime}`;
    const endISO = `${startDate}T${endTime}`;

    if (recurring) {
      if (selectedDays.length === 0) {
        setError("Select at least one day of the week");
        setPending(false);
        return;
      }
      if (!seriesEndDate) {
        setError("Series end date is required");
        setPending(false);
        return;
      }

      const result = await createRecurringEvents({
        teamId,
        title: title.trim(),
        eventType: type,
        startTimeOfDay: startTime,
        endTimeOfDay: endTime,
        venueId: venueId || null,
        notes: notes || null,
        opponentName: opponentName || null,
        isHomeGame:
          isHomeGame === "true"
            ? true
            : isHomeGame === "false"
              ? false
              : null,
        days: selectedDays,
        rangeStart: startDate,
        rangeEnd: seriesEndDate,
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
      // Single event — build FormData for the server action
      const formData = new FormData();
      formData.set("teamId", teamId);
      formData.set("title", title.trim());
      formData.set("eventType", type);
      formData.set("startTime", startISO);
      formData.set("endTime", endISO);
      if (venueId) formData.set("venueId", venueId);
      if (notes) formData.set("notes", notes);
      if (opponentName) formData.set("opponentName", opponentName);
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

        <div className="space-y-4">
          <div>
            <Label htmlFor="eventTitle">Title</Label>
            <Input
              id="eventTitle"
              placeholder="e.g., Practice at Tower Grove"
              autoComplete="off"
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Event Type</Label>
              <Select
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

          {/* Date */}
          <div>
            <Label htmlFor="eventDate">
              {recurring ? "Start Date" : "Date"}
            </Label>
            <Input
              id="eventDate"
              type="date"
              className="mt-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Start / End time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="eventStartTime">Start Time</Label>
              <Input
                id="eventStartTime"
                type="time"
                className="mt-1"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="eventEndTime">End Time</Label>
              <Input
                id="eventEndTime"
                type="time"
                className="mt-1"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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
                  type="date"
                  className="mt-1"
                  value={seriesEndDate}
                  onChange={(e) => setSeriesEndDate(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Events will be created on selected days from the start
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
                  placeholder="e.g., Chesterfield FC"
                  autoComplete="off"
                  className="mt-1"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                />
              </div>
              <div>
                <Label>Home/Away</Label>
                <Select
                  value={isHomeGame}
                  onValueChange={setIsHomeGame}
                >
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
            <Select
              value={venueId}
              onValueChange={setVenueId}
            >
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
              placeholder="Any additional details..."
              rows={2}
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              type="button"
              disabled={pending}
              onClick={handleSubmit}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {pending
                ? "Creating..."
                : recurring
                  ? "Create Series"
                  : "Create Event"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
