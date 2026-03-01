// Type-safe query helpers for Supabase
import { createAdminClient } from "./server";
import type { SubscriptionTier } from "./types";

// ─── Profile / Auth ────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function createProfile(userId: string, email: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      subscription_tier: "free",
      trial_start_date: new Date().toISOString(),
      questions_today: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubscriptionTier(
  userId: string,
  tier: SubscriptionTier,
  stripeData?: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionPeriodEnd?: string;
  }
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_tier: tier,
      stripe_customer_id: stripeData?.stripeCustomerId,
      stripe_subscription_id: stripeData?.stripeSubscriptionId,
      subscription_period_end: stripeData?.subscriptionPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}

// ─── Trial / Question Gating ────────────────────────────────────────

export async function checkAndIncrementQuestion(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_tier, trial_start_date, questions_today, last_question_date")
    .eq("id", userId)
    .single();

  if (error || !profile) return { allowed: false, reason: "Profile not found" };

  // Paid tiers — always allowed
  if (
    profile.subscription_tier === "grower_monthly" ||
    profile.subscription_tier === "commercial_monthly" ||
    profile.subscription_tier === "lifetime"
  ) {
    return { allowed: true };
  }

  // Free trial checks
  const now = new Date();

  // Check 48-hour trial window
  if (profile.trial_start_date) {
    const trialStart = new Date(profile.trial_start_date);
    const hoursElapsed = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60);
    if (hoursElapsed > 48) {
      return { allowed: false, reason: "trial_expired" };
    }
  }

  // Reset question count if it's a new day
  const today = now.toISOString().split("T")[0];
  const lastDate = profile.last_question_date?.split("T")[0];
  const questionsToday = lastDate === today ? profile.questions_today : 0;

  // Check 10 questions/day limit
  if (questionsToday >= 10) {
    return { allowed: false, reason: "daily_limit_reached" };
  }

  // Increment question count
  await supabase
    .from("profiles")
    .update({
      questions_today: questionsToday + 1,
      last_question_date: now.toISOString(),
    })
    .eq("id", userId);

  return { allowed: true };
}

// ─── Grow Calendars ────────────────────────────────────────────────

export async function saveGrowCalendar(
  userId: string,
  setup: Record<string, unknown>,
  weeks: Record<string, unknown>[],
  totalWeeks: number,
  estimatedHarvestDate: string
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("grow_calendars")
    .insert({ user_id: userId, setup, weeks, total_weeks: totalWeeks, estimated_harvest_date: estimatedHarvestDate })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getGrowCalendars(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("grow_calendars")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getGrowCalendar(calendarId: string, userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("grow_calendars")
    .select("*")
    .eq("id", calendarId)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

// ─── Progress Tracking ────────────────────────────────────────────

export async function upsertProgress(
  calendarId: string,
  userId: string,
  date: string,
  tasksCompleted: string[],
  notes?: string
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("grow_progress")
    .upsert(
      { calendar_id: calendarId, user_id: userId, date, tasks_completed: tasksCompleted, notes: notes ?? null },
      { onConflict: "calendar_id,date" }
    );
  if (error) throw error;
}

export async function getProgressForCalendar(calendarId: string, userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("grow_progress")
    .select("*")
    .eq("calendar_id", calendarId)
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
