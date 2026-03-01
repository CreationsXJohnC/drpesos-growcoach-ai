import { getAnthropicClient } from "@/lib/ai/anthropic";
import { GROW_CALENDAR_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { GrowSetup, CalendarData } from "@/types/grow";

// Edge runtime: 25-second streaming timeout on Hobby vs 10-second for Node.js.
// Also uses Haiku (3× faster than Sonnet) to stay well within the window.
export const runtime = "edge";

// Haiku is fast enough to complete a full calendar in ~15–20 seconds
const CALENDAR_MODEL = "claude-haiku-4-5-20251001";
const CALENDAR_MAX_TOKENS = 4000;

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
            } catch { /* edge/streaming context — ignore */ }
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
        { error: "Please sign in to generate a grow calendar." },
        { status: 401 }
      );
    }

    // ── Subscription check ────────────────────────────────────────
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
            { error: "Your free trial has ended. Upgrade to generate grow calendars." },
            { status: 402 }
          );
        }
      }
    }

    const userPrompt = buildCalendarPrompt(setup);
    const client = getAnthropicClient();

    // ── Stream so the edge connection stays alive ──────────────────
    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        let fullText = "";

        try {
          const anthropicStream = client.messages.stream({
            model: CALENDAR_MODEL,
            max_tokens: CALENDAR_MAX_TOKENS,
            system: GROW_CALENDAR_SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              fullText += event.delta.text;
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ progress: true })}\n\n`));
            }
          }

          // ── Parse JSON from complete response ──────────────────
          let calendarData: CalendarData & { id?: string };
          try {
            const jsonStart = fullText.indexOf("{");
            const jsonEnd = fullText.lastIndexOf("}");
            if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON in response");
            calendarData = JSON.parse(fullText.slice(jsonStart, jsonEnd + 1));
          } catch {
            console.error("Calendar JSON parse error. First 500 chars:", fullText.slice(0, 500));
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: "Dr. Pesos returned an unexpected format — please try again." })}\n\n`));
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          // ── Save to Supabase ────────────────────────────────────
          if (user && !demo) {
            try {
              const { saveGrowCalendar } = await import("@/lib/supabase/queries");
              const saved = await saveGrowCalendar(
                user.id,
                setup as unknown as Record<string, unknown>,
                calendarData.weeks as unknown as Record<string, unknown>[],
                calendarData.totalWeeks,
                calendarData.estimatedHarvestDate
              );
              calendarData.id = saved.id;
            } catch (saveError) {
              console.error("Supabase save error:", saveError);
            }
          }

          // ── Email calendar to user (if Resend is configured) ────
          if (user?.email && !demo) {
            sendCalendarEmail(user.email, calendarData, setup).catch((e) =>
              console.error("Email send error:", e)
            );
          }

          controller.enqueue(enc.encode(`data: ${JSON.stringify({ calendar: calendarData })}\n\n`));
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("Calendar stream error:", message);
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Generate calendar error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Email delivery (Resend) ──────────────────────────────────────────
// Requires RESEND_API_KEY and RESEND_FROM_EMAIL env vars.
// Sign up free at resend.com and verify your sending domain.
async function sendCalendarEmail(
  toEmail: string,
  calendar: CalendarData & { id?: string },
  setup: GrowSetup
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return; // Skip silently if not configured

  const strainDisplay = setup.strainGenetics
    ? `${setup.strainType?.replace(/_/g, "-")} — ${setup.strainGenetics}`
    : setup.strainType?.replace(/_/g, "-");
  const lightDesc = setup.lightWattage
    ? `${setup.lightType?.toUpperCase()} (${setup.lightWattage})`
    : setup.lightType?.toUpperCase();

  const weekRows = calendar.weeks.map((week) => {
    const taskList = week.dailyTasks
      .map((t) => `<li style="margin-bottom:4px;color:#333;">${t.task}</li>`)
      .join("");
    return `
      <div style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
        <h3 style="margin:0 0 2px;font-size:15px;color:#16a34a;">Week ${week.week} — ${week.stage.charAt(0).toUpperCase() + week.stage.slice(1)}</h3>
        <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;">${new Date(week.startDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})} → ${new Date(week.endDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</p>
        <ul style="margin:0 0 10px;padding-left:16px;font-size:13px;">${taskList}</ul>
        <div style="background:#f9fafb;border-radius:6px;padding:8px 12px;font-size:12px;color:#6b7280;">
          🌡️ ${week.envTargets.tempF} &nbsp;|&nbsp; 💧 RH ${week.envTargets.rh} &nbsp;|&nbsp; 💨 VPD ${week.envTargets.vpd} &nbsp;|&nbsp; ☀️ ${week.envTargets.lightSchedule}
        </div>
        ${week.drPesosNote ? `<p style="margin:8px 0 0;font-size:12px;color:#16a34a;font-style:italic;">"${week.drPesosNote}"</p>` : ""}
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Grow Calendar — Dr. Pesos</title></head>
<body style="margin:0;padding:20px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#16a34a;padding:28px 24px;color:#fff;">
      <h1 style="margin:0;font-size:22px;font-weight:700;">Your Grow Calendar is Ready 🌿</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:.9;">Generated by Dr. Pesos Grow Coach AI · Powered by Ori Company</p>
    </div>
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
      <h2 style="margin:0 0 12px;font-size:16px;color:#111;">Grow Setup Summary</h2>
      <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse;">
        <tr><td style="padding:3px 0;width:50%;">🌿 <strong>Strain:</strong> ${strainDisplay}</td><td style="padding:3px 0;">🪴 <strong>Medium:</strong> ${setup.medium?.replace(/_/g," ")}</td></tr>
        <tr><td style="padding:3px 0;">💡 <strong>Light:</strong> ${lightDesc}</td><td style="padding:3px 0;">🧪 <strong>Nutrients:</strong> ${setup.nutrientType}</td></tr>
        <tr><td style="padding:3px 0;">📐 <strong>Space:</strong> ${setup.spaceSize} ft</td><td style="padding:3px 0;">📅 <strong>Weeks:</strong> ${calendar.totalWeeks} total</td></tr>
        <tr><td style="padding:3px 0;" colspan="2">🎯 <strong>Goals:</strong> ${setup.goals.join(", ")}</td></tr>
      </table>
    </div>
    <div style="padding:0 24px 8px;">
      ${weekRows}
    </div>
    <div style="padding:16px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;">
      <p style="margin:0;">You can print this email as a PDF using your browser's print function (Ctrl/Cmd + P → Save as PDF).</p>
      <p style="margin:8px 0 0;">Dr. Pesos Grow Coach AI · <a href="https://drpesos-growcoach-ai.vercel.app" style="color:#16a34a;">Open App</a></p>
    </div>
  </div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail,
      subject: `Your ${strainDisplay ?? "Grow"} Calendar — Dr. Pesos (${calendar.totalWeeks} weeks)`,
      html,
    }),
  });
}

// ── Prompt builder ────────────────────────────────────────────────────
function buildCalendarPrompt(setup: GrowSetup): string {
  const goals = setup.goals.join(", ");
  const primaryLightBase = setup.lightWattage
    ? `${setup.lightType?.toUpperCase()} (${setup.lightWattage})`
    : setup.lightType?.toUpperCase();
  const lightDesc = setup.underCanopyLight
    ? `${primaryLightBase} + Under Canopy Supplemental Lighting`
    : primaryLightBase;

  const mediumGuidance: Record<string, string> = {
    soil: "Soil pH 6.0–7.0. Water when top inch dry. Slower nutrient uptake.",
    living_soil: "Living soil — organic top-dresses and compost teas only. pH 6.2–7.0. No synthetics.",
    coco: "Coco coir — pH 5.5–6.5. Daily fertigation. Never let dry. Always include CalMag.",
    hydro: "DWC/NFT — pH 5.5–6.5. Monitor EC and DO daily. Reservoir changes every 7–10 days.",
    aeroponics: "Aeroponics — pH 5.5–6.2. Mist cycles every 3–5 min. Reservoir temp below 68°F.",
    rockwool: "Rockwool — pre-soak pH 5.5 for 24hrs. pH 5.5–6.5. Daily drip with 10–20% runoff.",
  };

  const lightGuidance: Record<string, string> = {
    led: `LED ${setup.lightWattage ?? ""} — run at 18–24" canopy distance. Adjust PPFD per stage.`,
    hps: `HPS ${setup.lightWattage ?? ""} — intense heat. 18–24" distance. Monitor temps carefully.`,
    hid: `HID ${setup.lightWattage ?? ""} — MH for veg, HPS for flower. Heat management critical.`,
    cmh: `CMH ${setup.lightWattage ?? ""} — full spectrum. 24" canopy distance. No UV-blocking glass.`,
    fluorescent: `T5 ${setup.lightWattage ?? ""} — keep 4–6" above canopy. Veg and propagation only.`,
    tungsten: `Tungsten ${setup.lightWattage ?? ""} — low PAR output. Supplemental use only.`,
    under_canopy: `Under Canopy ${setup.lightWattage ?? ""} — activate mid-flower (wk 4–5). Target lower colas under 200 μmol.`,
  };

  const nutrientGuidance = setup.nutrientType === "organic"
    ? "ORGANIC: Compost teas, dry amendments (BuildASoil, Bokashi, worm castings). No synthetics. Adjust 7–10 days ahead. No flush needed."
    : "SYNTHETIC: Advanced Nutrients base (Micro/Grow/Bloom) + boosters. Adjust pH per medium. Provide weekly EC targets. Pre-harvest flush 5–7 days.";

  const strainDisplay = setup.strainGenetics
    ? `${setup.strainType?.replace(/_/g, "-")} — ${setup.strainGenetics}`
    : setup.strainType?.replace(/_/g, "-");

  return `Generate a complete, concise grow calendar as JSON.

SETUP:
- Experience: ${setup.experienceLevel}
- Strain: ${strainDisplay}
- Medium: ${setup.medium?.replace(/_/g, " ")}
- Light: ${lightDesc}
- Nutrients: ${setup.nutrientType}
- Space: ${setup.spaceSize} ft
- Start: ${setup.startDate}
- Goals: ${goals}
${setup.currentStage ? `- Current stage: ${setup.currentStage} (day ${setup.currentDayInStage || 1})` : "- Starting from: germination"}

MEDIUM: ${mediumGuidance[setup.medium ?? "soil"] ?? ""}
LIGHT: ${lightGuidance[setup.lightType ?? "led"] ?? ""}${setup.underCanopyLight ? " Activate under-canopy lights mid-flower (wk 4–5), target lower bud sites." : ""}
NUTRIENTS: ${nutrientGuidance}

${setup.strainGenetics ? `STRAIN NOTES: Use known traits of "${setup.strainGenetics}" — expected flower time, stretch, sensitivities, harvest window.` : ""}

Strain type guide:
- autoflower: 10–12 week total cycle, no light flip
- indica_dominant: veg 4–5 wks, flower 8–9 wks
- sativa_dominant: veg 5–6 wks, flower 10–12 wks
- hybrid: veg 4–6 wks, flower 8–10 wks

Dr. Pesos defoliation schedule: veg = every other week; flower = twice (early wk 1–2, mid wk 4–5).
Goals: ${goals.includes("yield") ? "Include LST, topping, SCROG." : ""}${goals.includes("speed") ? " Short veg, early flip." : ""}${goals.includes("quality") ? " Slow dry 10–14 days, 4-week cure, trichome harvest timing." : ""}

IMPORTANT: Be concise. Max 5–6 tasks per week. Short task descriptions (under 12 words each).

Return ONLY valid JSON — no markdown fences, no explanation text:
{
  "totalWeeks": <number>,
  "estimatedHarvestDate": "<ISO date>",
  "weeks": [
    {
      "week": 1,
      "stage": "<germination|seedling|vegetative|flower|harvest|dry|cure>",
      "startDate": "<ISO date>",
      "endDate": "<ISO date>",
      "dailyTasks": [
        { "id": "w1-t1", "task": "<task>", "category": "<watering|nutrients|training|ipm|environment|defoliation|observation|harvest>", "priority": "<required|recommended|optional>", "drPesosNote": "<optional short tip>" }
      ],
      "envTargets": { "tempF": "<range>", "rh": "<range>", "vpd": "<range>", "ppfd": "<range>", "lightSchedule": "<e.g. 18/6>" },
      "nutrients": "<brief nutrient note>",
      "defoliationScheduled": <true|false>,
      "drPesosNote": "<one encouraging sentence>"
    }
  ]
}`;
}
