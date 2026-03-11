"use client";

import { useState } from "react";
import { EditPlayerDialog } from "./edit-player-dialog";

type PlayerCardProps = {
  player: {
    id: string;
    full_name: string;
    jersey_number: string | null;
    position: string | null;
    managed_by: string;
  };
  canEdit: boolean;
  teamId: string;
};

const AVATAR_COLORS = [
  "bg-primary/30 text-primary-foreground",
  "bg-[#22C55E]/20 text-[#22C55E]",
  "bg-accent/20 text-accent",
  "bg-destructive/20 text-destructive",
  "bg-[#8B5CF6]/20 text-[#8B5CF6]",
  "bg-[#06B6D4]/20 text-[#06B6D4]",
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PlayerCard({ player, canEdit, teamId }: PlayerCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => canEdit && setEditOpen(true)}
        disabled={!canEdit}
        className={`flex items-center gap-3 rounded-lg border border-border bg-popover p-3 text-left transition ${
          canEdit
            ? "cursor-pointer hover:border-accent/40"
            : "cursor-default"
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${hashColor(player.full_name)}`}
        >
          {getInitials(player.full_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{player.full_name}</p>
          {player.position && (
            <p className="text-[11px] text-muted-foreground">
              {player.position}
            </p>
          )}
        </div>
        {player.jersey_number && (
          <span className="font-heading text-xl font-black text-muted-foreground/40">
            {player.jersey_number}
          </span>
        )}
      </button>

      {canEdit && (
        <EditPlayerDialog
          player={player}
          teamId={teamId}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
}
