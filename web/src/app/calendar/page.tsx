import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGrowCalendar, getProgressForCalendar } from "@/lib/supabase/queries";
import CalendarClient from "./calendar-client";
import type { CalendarData } from "@/types/grow";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  // ── No ID — fall through to client (sessionStorage / demo path) ─
  if (!id) {
    return <CalendarClient calendar={null} initialCompleted={[]} />;
  }

  // ── Load from Supabase ─────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let calendar: CalendarData & { id: string; name: string | null };
  let initialCompleted: string[] = [];

  try {
    const row = await getGrowCalendar(id, user.id);
    calendar = {
      id: row.id,
      name: row.name,
      totalWeeks: row.total_weeks,
      estimatedHarvestDate: row.estimated_harvest_date,
      weeks: row.weeks as unknown as CalendarData["weeks"],
    };

    const progressRows = await getProgressForCalendar(id, user.id);
    // Merge all completed task IDs across all saved progress rows
    initialCompleted = progressRows.flatMap((r) => r.tasks_completed as string[]);
  } catch {
    redirect("/dashboard");
  }

  return (
    <CalendarClient
      calendar={calendar}
      initialCompleted={initialCompleted}
    />
  );
}
