import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { upsertProgress } from "@/lib/supabase/queries";

// Shared auth helper
async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* ignore */ }
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// POST /api/progress — save completed task IDs for a calendar
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { calendarId, tasksCompleted } = await req.json() as {
    calendarId: string;
    tasksCompleted: string[];
  };

  if (!calendarId) {
    return NextResponse.json({ error: "calendarId required" }, { status: 400 });
  }

  try {
    // Use a fixed synthetic date key to store cumulative progress per calendar
    await upsertProgress(calendarId, user.id, "all", tasksCompleted);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress save error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
