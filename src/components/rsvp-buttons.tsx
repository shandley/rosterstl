"use client";

import { useOptimistic, useTransition } from "react";
import { setAvailability } from "@/lib/actions/availability";

type RsvpButtonsProps = {
  eventId: string;
  playerId: string;
  playerName: string;
  currentStatus: string | null;
  teamId: string;
};

const STATUSES = [
  { value: "yes", label: "✓", color: "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30" },
  { value: "no", label: "✗", color: "bg-destructive/15 text-destructive border-destructive/30" },
  { value: "maybe", label: "?", color: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30" },
] as const;

export function RsvpButtons({
  eventId,
  playerId,
  playerName,
  currentStatus,
  teamId,
}: RsvpButtonsProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [, startTransition] = useTransition();

  function handleClick(status: string) {
    startTransition(async () => {
      setOptimisticStatus(status);
      await setAvailability(eventId, playerId, status, teamId);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-[10px] text-muted-foreground">{playerName}</span>
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => handleClick(s.value)}
          className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold transition ${
            optimisticStatus === s.value
              ? s.color
              : "border-border bg-transparent text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
