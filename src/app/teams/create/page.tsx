"use client";

import { createTeam } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useActionState } from "react";

const SPORTS = [
  "soccer",
  "baseball",
  "softball",
  "basketball",
  "volleyball",
  "hockey",
  "lacrosse",
] as const;

export default function CreateTeamPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await createTeam(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <h1 className="font-heading text-2xl font-bold">Create a Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up your team and start inviting players.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., FC STL U18 Blue"
              required
              autoComplete="off"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="sport">Sport</Label>
            <Select name="sport" required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ageGroup">Age Group</Label>
            <Input
              id="ageGroup"
              name="ageGroup"
              placeholder="e.g., U18, U14, Adult"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="season">Season</Label>
            <Input
              id="season"
              name="season"
              placeholder="e.g., Spring 2026"
              required
              className="mt-1"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {pending ? "Creating..." : "Create Team"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-accent hover:underline">
            Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
