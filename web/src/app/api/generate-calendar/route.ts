import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai/anthropic";
import { GROW_CALENDAR_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { GrowSetup } from "@/types/grow";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────
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
            } catch { /* Server Component context — safe to ignore */ }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { demo, ...setupData } = body as GrowSetup & { demo?: boolean };
    const setup = setupData as GrowSetup;

    if (!user && !demo) {
      return NextResponse.json(
        { error: "unauthorized", message: "Please sign in to generate a grow calendar." },
        { status: 401 }
      );
    }

    // ── Subscription check: calendar generation requires paid tier ──
    // (Free trial users can generate one calendar to demo the feature)
    if (user && !demo) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, trial_start_date")
        .eq("id", user.id)
        .single();

      if (profile && profile.subscription_tier === "free") {
        const trialStart = new Date(profile.trial_start_date ?? 0);
        const hoursElapsed = (Date.now() - trialStart.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed > 48) {
          return NextResponse.json(
            { error: "upgrade_required", reason: "trial_expired", message: "Your free trial has ended. Upgrade to generate grow calendars." },
            { status: 402 }
          );
        }
      }
    }

    const userPrompt = buildCalendarPrompt(setup);

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8096,
      system: GROW_CALENDAR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse the JSON calendar from Claude's response
    let calendarData;
    try {
      // Strip any potential markdown code fences
      const cleaned = content.text
        .replace(/^```json\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      calendarData = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse calendar JSON:", content.text);
      throw new Error("Failed to parse grow calendar from AI response");
    }

    // ── Save to Supabase (authenticated users only) ─────────────────
    if (user && !demo) {
      try {
        const { saveGrowCalendar } = await import("@/lib/supabase/queries");
        const saved = await saveGrowCalendar(
          user.id,
          setup as unknown as Record<string, unknown>,
          calendarData.weeks,
          calendarData.totalWeeks,
          calendarData.estimatedHarvestDate
        );
        return NextResponse.json({ id: saved.id, ...calendarData });
      } catch (saveError) {
        console.error("Failed to save calendar to Supabase:", saveError);
        // Return without ID — client falls back to redirect without ID
        return NextResponse.json(calendarData);
      }
    }

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error("Generate calendar error:", error);
    return NextResponse.json(
      { error: "Failed to generate grow calendar" },
      { status: 500 }
    );
  }
}

function buildCalendarPrompt(setup: GrowSetup): string {
  const goals = setup.goals.join(", ");
  const lightDesc = setup.lightWattage
    ? `${setup.lightType?.toUpperCase()} (${setup.lightWattage})`
    : setup.lightType?.toUpperCase();

  // Medium-specific guidance hints
  const mediumGuidance: Record<string, string> = {
    soil: "Use soil pH targets 6.0–7.0. Water when top inch is dry. Slower nutrient uptake — adjust feed frequency accordingly.",
    living_soil: "Living soil — use organic top-dresses and compost teas instead of liquid feeds. pH self-regulates 6.2–7.0. Avoid synthetic inputs that kill microbial life. No pre-harvest flush needed.",
    coco: "Coco coir — pH 5.5–6.5. Daily or twice-daily fertigation. Never let coco dry out fully. Always include CalMag in every feed.",
    hydro: "Deep Water Culture / NFT — pH 5.5–6.5, monitor EC and DO (dissolved oxygen) daily. Reservoir changes every 7–10 days. Fast growth — update feeding every 3–4 days.",
    aeroponics: "Aeroponics — pH 5.5–6.2. Mist cycles every 3–5 min. Reservoir temp must stay below 68°F to prevent root rot. Maximum oxygen exposure — fastest growth possible. Advanced troubleshooting may be needed.",
    rockwool: "Rockwool / Stonewool — pre-soak in pH 5.5 water for 24hrs before use. pH 5.5–6.5. Daily drip irrigation with 10–20% runoff. Never reuse rockwool between grows.",
  };

  // Light-specific PPFD and heat guidance
  const lightGuidance: Record<string, string> = {
    led: `LED ${setup.lightWattage ?? ""} — energy-efficient, low heat, full spectrum. Run at 18–24" canopy distance. Dimming capability allows precise PPFD control per stage. Higher PPFD possible with less heat stress vs HPS. Check manufacturer DLI charts for optimal canopy distance per stage.`,
    hps: `High Pressure Sodium ${setup.lightWattage ?? ""} — intense heat output. Maintain 18–24" canopy distance for 1000W (further for larger wattages). Excellent for flowering. Use air-cooled hoods if possible. Monitor temps carefully — HPS can push room 10–15°F above ambient.`,
    hid: `High-Intensity Discharge ${setup.lightWattage ?? ""} — broad category. Use Metal Halide (MH) for veg (6500K) and HPS for flower (2700K) if switchable ballast. Heat management critical — use environmental controls accordingly.`,
    cmh: `Ceramic Metal Halide ${setup.lightWattage ?? ""} — full-spectrum output with excellent terpene and resin production. Run at 24" canopy distance. Moderate heat output. No UV blocking glass — do not touch bulb bare-handed.`,
    fluorescent: `Fluorescent T5 ${setup.lightWattage ?? ""} — low intensity, ideal for seedlings, clones, and propagation. Keep lights 4–6" above canopy. Suitable for vegetative phase only — supplement with HID or LED for flower.`,
    tungsten: `Tungsten ${setup.lightWattage ?? ""} — incandescent. Very low efficiency and PAR output. Primarily useful as supplemental warm-spectrum light. Not recommended as primary grow light — calibrate PPFD targets accordingly.`,
    under_canopy: `Under Canopy Lighting ${setup.lightWattage ?? ""} — supplemental lighting placed below main canopy. Target lower bud sites that receive less than 200 μmol. Schedule activation in mid to late flower to maximize lower cola development.`,
  };

  // Nutrient-specific guidance
  const nutrientGuidance = setup.nutrientType === "organic"
    ? "ORGANIC nutrient program: Use compost teas (aerated, 24-48hrs), top-dresses of dry amendments (e.g. BuildASoil Craft Blend, Bokashi, worm castings, kelp meal). No synthetic salt nutrients. Adjust inputs 7–10 days before needed due to slow release. No chemical flush required — organic grows finish clean naturally. pH guidance based on living soil (6.2–7.0 target)."
    : "SYNTHETIC nutrient program: Use Advanced Nutrients base (Micro / Grow / Bloom) with stage-appropriate boosters (Big Bud, Overdrive, Bud Candy). Adjust pH per medium. Include pre-harvest flush 5–7 days before cut. Provide weekly EC targets per stage.";

  const strainDisplay = setup.strainGenetics
    ? `${setup.strainType?.replace("_", "-")} — ${setup.strainGenetics}`
    : setup.strainType?.replace("_", "-");

  return `Generate a complete grow calendar for this specific cultivation setup:

GROW SETUP:
- Experience Level: ${setup.experienceLevel}
- Strain Type: ${strainDisplay}
${setup.strainGenetics ? `- Strain Genetics / Name: ${setup.strainGenetics}` : ""}
- Grow Medium: ${setup.medium?.replace("_", " ")}
- Lighting: ${lightDesc}
- Nutrient Program: ${setup.nutrientType}
- Space Size: ${setup.spaceSize} ft
- Start Date: ${setup.startDate}
- Goals: ${goals}
${setup.currentStage ? `- Currently in: ${setup.currentStage} (day ${setup.currentDayInStage || 1})` : "- Starting from: germination"}

MEDIUM-SPECIFIC REQUIREMENTS:
${mediumGuidance[setup.medium ?? "soil"] ?? ""}

LIGHT-SPECIFIC REQUIREMENTS:
${lightGuidance[setup.lightType ?? "led"] ?? ""}

NUTRIENT PROGRAM REQUIREMENTS:
${nutrientGuidance}

Create a complete week-by-week calendar from ${setup.currentStage ? "current stage" : "germination"} through dry and cure.

${setup.strainGenetics ? `STRAIN-SPECIFIC GUIDANCE: The user is growing "${setup.strainGenetics}". Use any known characteristics of this strain or its genetics to calibrate: expected flower time, typical stretch factor, terpene profile, known sensitivities (e.g. nutrient burn sensitivity, mold susceptibility, optimal harvest window), and any training notes specific to this genetics. If this is a well-known commercial strain, reference its specific traits directly.` : ""}

For ${setup.strainType === "autoflower" ? "this autoflower strain, total cycle is typically 10–12 weeks (no light flip needed)" : setup.strainType === "indica_dominant" ? "this indica-dominant photoperiod strain, include veg (4–5 weeks) and flower (8–9 weeks) stages" : setup.strainType === "sativa_dominant" ? "this sativa-dominant photoperiod strain, include veg (5–6 weeks) and flower (10–12 weeks) stages — account for significant stretch during flip" : "this hybrid photoperiod strain, include veg (4–6 weeks) and flower (8–10 weeks) stages"}.

Apply Dr. Pesos signature defoliation schedule:
- Vegetative stage: schedule defoliation every other week
- Flower stage: schedule defoliation exactly twice (early flower weeks 1–2, and mid flower weeks 4–5)

Calibrate ALL guidance to this exact combination: ${setup.medium?.replace("_", " ")} medium + ${lightDesc} + ${setup.nutrientType} nutrients + ${setup.spaceSize} space.
Every task, pH target, EC value, PPFD target, and watering frequency must be specific to THIS setup — not generic advice.

Tailor detail level to ${setup.experienceLevel} grower.
${goals.includes("yield") ? "Emphasize training techniques (LST, topping, SCROG) and canopy management for maximum yield." : ""}
${goals.includes("speed") ? "Optimize for fastest cycle time: shorter veg, consider early flip at day 30–35 of veg." : ""}
${goals.includes("quality") ? "Prioritize quality: slow dry (10–14 days at 60°F/60% RH), minimum 4-week cure, trichome-based harvest timing." : ""}`;
}
