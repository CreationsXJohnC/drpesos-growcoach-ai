import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: calendars } = await supabase
    .from("grow_calendars")
    .select("id, name, setup, total_weeks, estimated_harvest_date, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  // Compute trial status
  let trialHoursRemaining = 0;
  let trialActive = false;
  if (profile?.subscription_tier === "free" && profile.trial_start_date) {
    const elapsed =
      (Date.now() - new Date(profile.trial_start_date).getTime()) /
      (1000 * 60 * 60);
    trialHoursRemaining = Math.max(0, 48 - elapsed);
    trialActive = elapsed <= 48;
  }

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
      calendars={calendars ?? []}
      trialHoursRemaining={trialHoursRemaining}
      trialActive={trialActive}
    />
  );
}
