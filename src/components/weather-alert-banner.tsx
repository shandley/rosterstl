"use client";

import { useState } from "react";
import type { WeatherAlert } from "@/lib/weather";

const SEVERITY_STYLES: Record<string, string> = {
  Extreme: "border-destructive/40 bg-destructive/10 text-destructive",
  Severe: "border-destructive/30 bg-destructive/10 text-destructive",
  Moderate: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]",
  Minor: "border-primary/30 bg-primary/10 text-primary-foreground",
  Unknown: "border-border bg-popover text-muted-foreground",
};

export function WeatherAlertBanner({ alerts }: { alerts: WeatherAlert[] }) {
  const [expanded, setExpanded] = useState(false);

  if (alerts.length === 0) return null;

  // Deduplicate by headline
  const unique = alerts.filter(
    (a, i, arr) => arr.findIndex((b) => b.headline === a.headline) === i,
  );

  const shown = expanded ? unique : unique.slice(0, 1);
  const remaining = unique.length - 1;
  const topSeverity = unique[0].severity;

  return (
    <div
      className={`mb-4 rounded-lg border p-3 ${SEVERITY_STYLES[topSeverity] ?? SEVERITY_STYLES.Unknown}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-base">⚠️</span>
        <div className="min-w-0 flex-1">
          {shown.map((alert, i) => (
            <div key={alert.headline + i}>
              {i > 0 && <hr className="my-2 border-current/20" />}
              <p className="text-sm font-bold">{alert.headline}</p>
              <p className="mt-0.5 line-clamp-2 text-xs opacity-80">
                {alert.description}
              </p>
              {alert.instruction && (
                <p className="mt-1 text-xs font-medium opacity-90">
                  {alert.instruction}
                </p>
              )}
              <p className="mt-1 text-[10px] opacity-60">
                Affects: {alert.eventTitle}
                {alert.expires &&
                  ` · Expires ${new Date(alert.expires).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}`}
              </p>
            </div>
          ))}

          {!expanded && remaining > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-2 text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
            >
              +{remaining} more alert{remaining > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
