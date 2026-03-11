"use client";

import { formatEventDate, formatTime } from "@/lib/utils/date";
import { RsvpButtons } from "./rsvp-buttons";

type EventCardProps = {
  event: {
    id: string;
    title: string;
    event_type: string;
    start_time: string;
    end_time: string;
    opponent_name: string | null;
    is_home_game: boolean | null;
    notes: string | null;
    venues: { name: string; address: string; city: string; state: string } | null;
  };
  isNext: boolean;
  myPlayers: { id: string; full_name: string }[];
  availability: Record<string, string>;
  teamId: string;
};

export function EventCard({
  event,
  isNext,
  myPlayers,
  availability,
  teamId,
}: EventCardProps) {
  const { month, day } = formatEventDate(event.start_time);
  const time = formatTime(event.start_time);

  return (
    <div
      className={`grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-lg border p-3 transition hover:translate-x-0.5 ${
        isNext
          ? "border-accent bg-accent/[0.04]"
          : "border-border bg-popover"
      }`}
    >
      {/* Date block */}
      <div className="flex flex-col items-center justify-center rounded-lg bg-white/[0.04] py-2">
        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
          {month}
        </span>
        <span className="font-heading text-[28px] font-black leading-none text-accent">
          {day}
        </span>
      </div>

      {/* Event info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-semibold">{event.title}</p>
          {isNext && (
            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
              Next
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {time}
          {event.venues ? (
            <>
              {" · "}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${event.venues.name}, ${event.venues.address}, ${event.venues.city}, ${event.venues.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {event.venues.name}
              </a>
            </>
          ) : ""}
          {event.opponent_name
            ? ` · ${event.is_home_game ? "vs" : "@"} ${event.opponent_name}`
            : ""}
        </p>
      </div>

      {/* RSVP actions */}
      <div className="flex flex-col gap-1">
        {myPlayers.map((player) => (
          <RsvpButtons
            key={player.id}
            eventId={event.id}
            playerId={player.id}
            playerName={myPlayers.length > 1 ? player.full_name.split(" ")[0] : ""}
            currentStatus={availability[`${event.id}:${player.id}`] ?? null}
            teamId={teamId}
          />
        ))}
      </div>
    </div>
  );
}
