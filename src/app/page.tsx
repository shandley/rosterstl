import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="font-heading text-5xl font-black tracking-tight">
          <span className="text-white">Roster</span>
          <span className="text-accent">STL</span>
        </h1>
        <p className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
          Gateway Youth Athletics
        </p>
        <p className="mt-6 max-w-md text-muted-foreground">
          Team management built for St. Louis families, coaches, and leagues.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent/90 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
