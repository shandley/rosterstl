"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EventCard } from "@/components/event-card";
import type { WeatherInfo } from "@/lib/weather";

type Event = {
  id: string;
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  opponent_name: string | null;
  is_home_game: boolean | null;
  notes: string | null;
  venues: { name: string; address: string; city: string; state: string; lat: number | null; lng: number | null } | null;
};

type ScheduleTabsProps = {
  upcomingEvents: Event[];
  pastEvents: Event[];
  myPlayers: { id: string; full_name: string }[];
  availability: Record<string, string>;
  teamId: string;
  weatherMap?: Record<string, WeatherInfo | null>;
};

function EventList({
  events,
  myPlayers,
  availability,
  teamId,
  markFirst,
  weatherMap,
}: {
  events: Event[];
  myPlayers: { id: string; full_name: string }[];
  availability: Record<string, string>;
  teamId: string;
  markFirst: boolean;
  weatherMap?: Record<string, WeatherInfo | null>;
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-popover p-12 text-center text-sm text-muted-foreground">
        No events found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {events.map((event, idx) => (
        <EventCard
          key={event.id}
          event={event}
          isNext={markFirst && idx === 0}
          myPlayers={myPlayers}
          availability={availability}
          teamId={teamId}
          weather={weatherMap?.[event.id] ?? null}
        />
      ))}
    </div>
  );
}

export function ScheduleTabs({
  upcomingEvents,
  pastEvents,
  myPlayers,
  availability,
  teamId,
  weatherMap,
}: ScheduleTabsProps) {
  return (
    <Tabs defaultValue="upcoming">
      <TabsList variant="line">
        <TabsTrigger value="upcoming">
          Upcoming ({upcomingEvents.length})
        </TabsTrigger>
        <TabsTrigger value="past">
          Past ({pastEvents.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        <EventList
          events={upcomingEvents}
          myPlayers={myPlayers}
          availability={availability}
          teamId={teamId}
          markFirst={true}
          weatherMap={weatherMap}
        />
      </TabsContent>

      <TabsContent value="past" className="mt-4">
        <EventList
          events={pastEvents}
          myPlayers={myPlayers}
          availability={availability}
          teamId={teamId}
          markFirst={false}
        />
      </TabsContent>
    </Tabs>
  );
}
