import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      {/* Placeholder for sidebar — will be built out in next phase */}
      <div className="flex-1 p-8">
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back, {profile?.full_name || user.email}
        </p>
        <p className="mt-8 text-muted-foreground">
          Your teams will appear here once you create or join one.
        </p>
      </div>
    </div>
  );
}
