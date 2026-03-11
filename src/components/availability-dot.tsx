"use client";

import { useOptimistic, useTransition } from "react";
import { setAvailability } from "@/lib/actions/availability";

type AvailabilityDotProps = {
  eventId: string;
  playerId: string;
  status: "yes" | "no" | "maybe" | null;
  canEdit: boolean;
  teamId: string;
};

const STATUS_CYCLE: ("yes" | "no" | "maybe")[] = ["yes", "no", "maybe"];

const STATUS_STYLES = {
  yes: "bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30",
  no: "bg-destructive/20 text-destructive border-destructive/30",
  maybe: "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30",
} as const;

const STATUS_LABELS = {
  yes: "✓",
  no: "✗",
  maybe: "?",
} as const;

export function AvailabilityDot({
  eventId,
  playerId,
  status,
  canEdit,
  teamId,
}: AvailabilityDotProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [, startTransition] = useTransition();

  function handleClick() {
    if (!canEdit) return;

    const currentIdx = optimisticStatus
      ? STATUS_CYCLE.indexOf(optimisticStatus)
      : -1;
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      await setAvailability(eventId, playerId, nextStatus, teamId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={!canEdit}
      className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold transition ${
        optimisticStatus
          ? STATUS_STYLES[optimisticStatus]
          : "border-border bg-background/50 text-muted-foreground/30"
      } ${canEdit ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
      title={optimisticStatus ?? "No response"}
    >
      {optimisticStatus ? STATUS_LABELS[optimisticStatus] : "–"}
    </button>
  );
}
