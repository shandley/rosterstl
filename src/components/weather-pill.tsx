"use client";

import type { WeatherInfo, WeatherIcon } from "@/lib/weather";

const ICONS: Record<WeatherIcon, string> = {
  sunny: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  thunderstorm: "⛈️",
  snow: "🌨️",
  fog: "🌫️",
  wind: "💨",
};

const STORM_ICONS: Set<WeatherIcon> = new Set(["thunderstorm", "snow"]);

export function WeatherPill({ weather }: { weather: WeatherInfo | null }) {
  if (!weather) return null;

  const isStorm = STORM_ICONS.has(weather.icon);

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
        isStorm
          ? "bg-destructive/15 text-destructive"
          : "bg-white/[0.06] text-muted-foreground"
      }`}
    >
      <span>{ICONS[weather.icon]}</span>
      <span>{weather.temperature}°</span>
      {weather.precipChance != null && weather.precipChance >= 30 && (
        <span className="text-accent">💧{weather.precipChance}%</span>
      )}
    </span>
  );
}
