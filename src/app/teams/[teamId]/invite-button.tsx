"use client";

import { createInvite } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function InviteButton({ teamId }: { teamId: string }) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateInvite() {
    setLoading(true);
    setError(null);

    const result = await createInvite(teamId, "parent");
    if (result.error) {
      setError(result.error);
    } else if (result.inviteCode) {
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/join?code=${result.inviteCode}`);
    }
    setLoading(false);
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {!inviteLink ? (
        <Button
          onClick={handleGenerateInvite}
          disabled={loading}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {loading ? "Generating..." : "Invite Members"}
        </Button>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Share this invite link:</p>
          <div className="mt-2 flex gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-background px-3 py-2 text-sm">
              {inviteLink}
            </code>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Expires in 7 days. New members will join as parents.
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <Button
            onClick={handleGenerateInvite}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            Generate new link
          </Button>
        </div>
      )}
    </div>
  );
}
