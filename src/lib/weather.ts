// Weather.gov API integration for RosterSTL
// Free, no API key needed, US-only

const USER_AGENT = "(RosterSTL, rosterstl.app)";
const FETCH_TIMEOUT_MS = 5000;

// ── Types ──────────────────────────────────────────────────────────

export type WeatherIcon =
  | "sunny"
  | "partly-cloudy"
  | "cloudy"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "fog"
  | "wind";

export type WeatherInfo = {
  temperature: number;
  shortForecast: string;
  precipChance: number | null;
  icon: WeatherIcon;
  windSpeed: string;
};

export type WeatherAlert = {
  eventId: string;
  eventTitle: string;
  headline: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  description: string;
  instruction: string | null;
  expires: string;
};

export type EventWithVenue = {
  id: string;
  title: string;
  start_time: string;
  venues: {
    lat: number | null;
    lng: number | null;
  } | null;
};

type GridPoint = {
  office: string;
  gridX: number;
  gridY: number;
};

type HourlyPeriod = {
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  shortForecast: string;
  probabilityOfPrecipitation: { value: number | null } | null;
};

// ── Helpers ────────────────────────────────────────────────────────

function venueKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function mapForecastToIcon(forecast: string): WeatherIcon {
  const lower = forecast.toLowerCase();
  if (lower.includes("thunder") || lower.includes("tstm")) return "thunderstorm";
  if (lower.includes("snow") || lower.includes("blizzard") || lower.includes("sleet") || lower.includes("ice"))
    return "snow";
  if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return "fog";
  if (lower.includes("rain") || lower.includes("shower") || lower.includes("drizzle")) return "rain";
  if (lower.includes("wind") || lower.includes("breezy") || lower.includes("gusty")) return "wind";
  if (lower.includes("partly") || lower.includes("mostly cloudy")) return "partly-cloudy";
  if (lower.includes("cloud") || lower.includes("overcast")) return "cloudy";
  return "sunny";
}

async function fetchWithTimeout(
  url: string,
  revalidate: number,
): Promise<Response | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      next: { revalidate },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return response;
  } catch {
    return null;
  }
}

// ── API Functions ──────────────────────────────────────────────────

async function getGridPoint(lat: number, lng: number): Promise<GridPoint | null> {
  const response = await fetchWithTimeout(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
    86400, // 24 hours — grid mapping is stable
  );
  if (!response) return null;

  try {
    const data = await response.json();
    const props = data?.properties;
    if (!props?.cwa || props?.gridX == null || props?.gridY == null) return null;
    return { office: props.cwa, gridX: props.gridX, gridY: props.gridY };
  } catch {
    return null;
  }
}

async function getHourlyForecast(grid: GridPoint): Promise<HourlyPeriod[]> {
  const response = await fetchWithTimeout(
    `https://api.weather.gov/gridpoints/${grid.office}/${grid.gridX},${grid.gridY}/forecast/hourly`,
    1800, // 30 minutes
  );
  if (!response) return [];

  try {
    const data = await response.json();
    return (data?.properties?.periods as HourlyPeriod[]) ?? [];
  } catch {
    return [];
  }
}

async function getActiveAlerts(
  lat: number,
  lng: number,
): Promise<{ headline: string; severity: string; description: string; instruction: string | null; expires: string }[]> {
  const response = await fetchWithTimeout(
    `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`,
    900, // 15 minutes
  );
  if (!response) return [];

  try {
    const data = await response.json();
    const features = data?.features as Array<{
      properties: {
        headline: string;
        severity: string;
        description: string;
        instruction: string | null;
        expires: string;
      };
    }> | undefined;
    if (!features) return [];

    return features.map((f) => ({
      headline: f.properties.headline ?? "Weather Alert",
      severity: f.properties.severity ?? "Unknown",
      description: f.properties.description ?? "",
      instruction: f.properties.instruction ?? null,
      expires: f.properties.expires ?? "",
    }));
  } catch {
    return [];
  }
}

// ── Main Orchestrator ──────────────────────────────────────────────

export async function getWeatherForEvents(events: EventWithVenue[]): Promise<{
  weatherMap: Record<string, WeatherInfo | null>;
  alerts: WeatherAlert[];
}> {
  const weatherMap: Record<string, WeatherInfo | null> = {};
  const alerts: WeatherAlert[] = [];

  try {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;

    // Filter to events with venues that have coordinates, within 7 days
    const eligible = events.filter((e) => {
      if (!e.venues?.lat || !e.venues?.lng) return false;
      const eventTime = new Date(e.start_time).getTime();
      return eventTime > now && eventTime - now <= sevenDaysMs;
    });

    if (eligible.length === 0) return { weatherMap, alerts };

    // Deduplicate venues by rounded lat/lng
    const venueMap = new Map<
      string,
      { lat: number; lng: number; events: EventWithVenue[] }
    >();

    for (const event of eligible) {
      const lat = event.venues!.lat!;
      const lng = event.venues!.lng!;
      const key = venueKey(lat, lng);

      const existing = venueMap.get(key);
      if (existing) {
        existing.events.push(event);
      } else {
        venueMap.set(key, { lat, lng, events: [event] });
      }
    }

    // Fetch weather for each unique venue in parallel
    const venueEntries = Array.from(venueMap.entries());
    const results = await Promise.allSettled(
      venueEntries.map(async ([, venue]) => {
        const grid = await getGridPoint(venue.lat, venue.lng);
        if (!grid) return { venue, periods: [] as HourlyPeriod[], venueAlerts: [] as Awaited<ReturnType<typeof getActiveAlerts>> };

        // Fetch forecast and alerts in parallel
        const [periods, venueAlerts] = await Promise.all([
          getHourlyForecast(grid),
          // Only fetch alerts for events within 48 hours
          venue.events.some(
            (e) => new Date(e.start_time).getTime() - now <= fortyEightHoursMs,
          )
            ? getActiveAlerts(venue.lat, venue.lng)
            : Promise.resolve([]),
        ]);

        return { venue, periods, venueAlerts };
      }),
    );

    // Process results
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const { venue, periods, venueAlerts } = result.value;

      // Match each event to its hourly forecast period
      for (const event of venue.events) {
        const eventTime = new Date(event.start_time).getTime();
        const matchingPeriod = periods.find((p) => {
          const start = new Date(p.startTime).getTime();
          const end = new Date(p.endTime).getTime();
          return eventTime >= start && eventTime < end;
        });

        if (matchingPeriod) {
          weatherMap[event.id] = {
            temperature: matchingPeriod.temperature,
            shortForecast: matchingPeriod.shortForecast,
            precipChance:
              matchingPeriod.probabilityOfPrecipitation?.value ?? null,
            icon: mapForecastToIcon(matchingPeriod.shortForecast),
            windSpeed: matchingPeriod.windSpeed,
          };
        } else {
          weatherMap[event.id] = null;
        }

        // Attach alerts to events within 48 hours
        if (
          venueAlerts.length > 0 &&
          new Date(event.start_time).getTime() - now <= fortyEightHoursMs
        ) {
          for (const alert of venueAlerts) {
            alerts.push({
              eventId: event.id,
              eventTitle: event.title,
              headline: alert.headline,
              severity: (["Extreme", "Severe", "Moderate", "Minor"].includes(
                alert.severity,
              )
                ? alert.severity
                : "Unknown") as WeatherAlert["severity"],
              description: alert.description,
              instruction: alert.instruction,
              expires: alert.expires,
            });
          }
        }
      }
    }
  } catch {
    // Total failure — return empty results, events display normally
  }

  return { weatherMap, alerts };
}
