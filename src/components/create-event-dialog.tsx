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
import { VenuePicker } from "@/components/venue-picker";

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

// Generate time options in 15-min increments (5:00 AM – 10:45 PM)
function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 5; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`; // 24h format for server
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "AM" : "PM";
      const label = `${hour12}:${mm} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function twoWeeksFromNowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CreateEventDialog({ teamId, venues }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // All form state is controlled — no native form/FormData dependency
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<string | null>("practice");
  const [recurring, setRecurring] = useState(false);
  const [eventDate, setEventDate] = useState(todayStr);
  const [startTime, setStartTime] = useState<string | null>("18:00");
  const [endTime, setEndTime] = useState<string | null>("19:30");
  const [seriesEndDate, setSeriesEndDate] = useState(twoWeeksFromNowStr);
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
    setEventDate(todayStr());
    setStartTime("18:00");
    setEndTime("19:30");
    setSeriesEndDate(twoWeeksFromNowStr());
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

    if (!title.trim()) {
      setError("Title is required");
      setPending(false);
      return;
    }
    if (!eventDate || !startTime || !endTime) {
      setError("Date and times are required");
      setPending(false);
      return;
    }

    const type = eventType ?? "practice";

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
          isHomeGame === "true" ? true : isHomeGame === "false" ? false : null,
        days: selectedDays,
        rangeStart: eventDate,
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
      const formData = new FormData();
      formData.set("teamId", teamId);
      formData.set("title", title.trim());
      formData.set("eventType", type);
      formData.set("startTime", `${eventDate}T${startTime}`);
      formData.set("endTime", `${eventDate}T${endTime}`);
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

          {/* Date — controlled text input avoids Safari ghost-value bug */}
          <div>
            <Label htmlFor="eventDate">
              {recurring ? "Start Date" : "Date"}
            </Label>
            <Input
              id="eventDate"
              type="text"
              placeholder="YYYY-MM-DD"
              className="mt-1"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Format: YYYY-MM-DD (e.g., {todayStr()})
            </p>
          </div>

          {/* Start / End time — select dropdowns, works on all browsers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

              {/* Series end date — controlled text input */}
              <div>
                <Label htmlFor="seriesEnd">Repeat Until</Label>
                <Input
                  id="seriesEnd"
                  type="text"
                  placeholder="YYYY-MM-DD"
                  className="mt-1"
                  value={seriesEndDate}
                  onChange={(e) => setSeriesEndDate(e.target.value)}
                />
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Events created on selected days from start through this date.
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

          <VenuePicker
            venues={venues}
            value={venueId}
            onChange={setVenueId}
          />

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
