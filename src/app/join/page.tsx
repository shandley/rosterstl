"use client";

import { redeemInvite } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, Suspense } from "react";

function JoinForm() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code") ?? "";

  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const code = formData.get("code") as string;
      if (!code) return { error: "Invite code is required" };
      const result = await redeemInvite(code);
      return result ?? null;
    },
    null
  );

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
      <h1 className="font-heading text-2xl font-bold">Join a Team</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the invite code shared by your coach or team manager.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="code">Invite Code</Label>
          <Input
            id="code"
            name="code"
            defaultValue={codeFromUrl}
            placeholder="Paste your invite code"
            required
            className="mt-1 font-mono"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          {pending ? "Joining..." : "Join Team"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-accent hover:underline">
          Back to Dashboard
        </Link>
      </p>
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense>
        <JoinForm />
      </Suspense>
    </div>
  );
}
