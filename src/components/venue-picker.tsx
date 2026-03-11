"use client";

import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";

type Venue = { id: string; name: string; city: string };

type VenuePickerProps = {
  venues: Venue[];
  value: string | null;
  onChange: (venueId: string | null) => void;
};

export function VenuePicker({ venues, value, onChange }: VenuePickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = venues.find((v) => v.id === value);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter venues by query (matches name or city)
  const lowerQ = query.toLowerCase();
  const filtered = query
    ? venues.filter(
        (v) =>
          v.name.toLowerCase().includes(lowerQ) ||
          v.city.toLowerCase().includes(lowerQ)
      )
    : venues;

  // Group by city
  const grouped = new Map<string, Venue[]>();
  for (const v of filtered) {
    const group = grouped.get(v.city) ?? [];
    group.push(v);
    grouped.set(v.city, group);
  }
  // Sort cities alphabetically
  const sortedCities = [...grouped.keys()].sort();

  function handleSelect(venue: Venue) {
    onChange(venue.id);
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Label>Venue</Label>

      {selected && !open ? (
        // Show selected venue with clear button
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm">
          <span className="flex-1 truncate">
            {selected.name}{" "}
            <span className="text-muted-foreground">— {selected.city}</span>
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      ) : (
        // Search input
        <input
          type="text"
          placeholder="Search venues..."
          autoComplete="off"
          className="mt-1 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {sortedCities.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No venues found
            </div>
          ) : (
            sortedCities.map((city) => (
              <div key={city}>
                <div className="sticky top-0 bg-popover/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                  {city}
                </div>
                {grouped.get(city)!.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelect(v)}
                    className={`w-full px-3 py-1.5 text-left text-sm transition hover:bg-accent/10 ${
                      v.id === value
                        ? "font-medium text-accent"
                        : "text-foreground"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            ))
          )}

          {/* Optional: skip venue */}
          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setQuery("");
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/10"
            >
              No venue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
