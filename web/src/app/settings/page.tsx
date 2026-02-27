import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./settings-client";

export const metadata = {
  title: "Settings — Dr. Pesos Grow Coach AI",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "subscription_tier, trial_start_date, subscription_period_end, stripe_subscription_id, stripe_customer_id, created_at"
    )
    .eq("id", user.id)
    .single();

  return (
    <SettingsClient
      user={{ id: user.id, email: user.email ?? "" }}
      profile={profile}
    />
  );
}
