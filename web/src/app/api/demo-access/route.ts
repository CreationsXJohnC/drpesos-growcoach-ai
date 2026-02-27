import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email, name, company } = await req.json() as {
      email: string;
      name?: string;
      company?: string;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const admin = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // ── 1. Save lead to demo_leads table ──────────────────────────
    await admin.from("demo_leads").upsert(
      { email, name: name ?? null, company: company ?? null },
      { onConflict: "email" }
    );

    // ── 2. Find or create Supabase auth user ──────────────────────
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new confirmed user — no email verification step needed
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name: name ?? "", company: company ?? "" },
      });

      if (createError || !newUser?.user) {
        console.error("Failed to create demo user:", createError);
        return NextResponse.json({ error: "Failed to create access. Please try again." }, { status: 500 });
      }

      userId = newUser.user.id;
    }

    // ── 3. Ensure profile exists with lifetime access ─────────────
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, subscription_tier")
      .eq("id", userId)
      .single();

    if (!existingProfile) {
      await admin.from("profiles").insert({
        id: userId,
        email,
        subscription_tier: "lifetime",
        trial_start_date: new Date().toISOString(),
        questions_today: 0,
      });
    } else if (existingProfile.subscription_tier === "free") {
      // Upgrade free users to lifetime for demo purposes
      await admin
        .from("profiles")
        .update({ subscription_tier: "lifetime" })
        .eq("id", userId);
    }

    // ── 4. Generate magic link → redirect to /demo after sign-in ──
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${appUrl}/demo`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Failed to generate magic link:", linkError);
      return NextResponse.json({ error: "Failed to generate access link. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ url: linkData.properties.action_link });
  } catch (error) {
    console.error("Demo access error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
