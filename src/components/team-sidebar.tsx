"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type TeamSidebarProps = {
  team: { id: string; name: string; sport: string; season: string };
  profile: { full_name: string; email: string };
  role: string;
  announcementCount: number;
};

const NAV_ITEMS = [
  {
    section: "Team",
    items: [
      { label: "Dashboard", icon: "⊞", path: "" },
      { label: "Schedule", icon: "📅", path: "/schedule" },
      { label: "Roster", icon: "👥", path: "/roster" },
      { label: "Availability", icon: "✓", path: "/availability" },
    ],
  },
  {
    section: "Communication",
    items: [{ label: "Announcements", icon: "📣", path: "/announcements" }],
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamSidebar({
  team,
  profile,
  role,
  announcementCount,
}: TeamSidebarProps) {
  const pathname = usePathname();
  const basePath = `/teams/${team.id}`;
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(itemPath: string) {
    const fullPath = basePath + itemPath;
    if (itemPath === "") {
      return pathname === basePath || pathname === basePath + "/";
    }
    return pathname.startsWith(fullPath);
  }

  const sidebar = (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="px-5 pt-5 pb-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-heading text-sm font-bold text-accent-foreground">
            R
          </div>
          <div>
            <span className="font-heading text-base font-bold">RosterSTL</span>
            <span className="block text-[10px] text-muted-foreground">
              Team Management
            </span>
          </div>
        </Link>
      </div>

      {/* Team pill */}
      <div className="mx-3 mt-3 mb-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 transition hover:border-accent/40"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/30 font-heading text-xs font-bold text-primary-foreground">
            {getInitials(team.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{team.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {team.sport.charAt(0).toUpperCase() + team.sport.slice(1)} ·{" "}
              {team.season}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="mb-3">
            <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
              {section.section}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={basePath + item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition ${
                    active
                      ? "border-l-[3px] border-accent bg-accent/[0.06] pl-[5px] text-accent"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span className="w-5 text-center text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.label === "Announcements" && announcementCount > 0 && (
                    <span className="ml-auto rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                      {announcementCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
            {getInitials(profile.full_name || profile.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {profile.full_name || profile.email}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {role.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card md:hidden"
        aria-label="Open navigation"
      >
        <span className="text-lg">☰</span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="md:hidden">{sidebar}</div>
        </>
      )}
    </>
  );
}
