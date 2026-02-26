import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai/anthropic";
import { GROW_CALENDAR_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { NextRequest, NextResponse } from "next/server";
import type { GrowSetup } from "@/types/grow";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const setup: GrowSetup = await req.json();

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
  return `Generate a complete grow calendar for this setup:

GROW SETUP:
- Experience Level: ${setup.experienceLevel}
- Strain Type: ${setup.strainType}
- Grow Medium: ${setup.medium}
- Light Type: ${setup.lightType}
- Space Size: ${setup.spaceSize}
- Start Date: ${setup.startDate}
- Goals: ${goals}
${setup.currentStage ? `- Currently in: ${setup.currentStage} (day ${setup.currentDayInStage || 1})` : "- Starting from: germination"}

Create a complete week-by-week calendar from ${setup.currentStage ? "current stage" : "germination"} through dry and cure.

For ${setup.strainType === "autoflower" ? "this autoflower strain, total cycle is typically 10-12 weeks" : "this photoperiod strain, include veg (4-6 weeks) and flower (8-10 weeks) stages"}.

Apply Dr. Pesos signature defoliation schedule:
- Vegetative stage: schedule defoliation every other week
- Flower stage: schedule defoliation exactly twice (early flower weeks 1-2, and mid flower weeks 4-5)

Tailor guidance to ${setup.experienceLevel} level grower.
Use ${setup.medium}-appropriate nutrient and watering guidance.
${setup.lightType === "led" ? "Adjust PPFD targets for LED efficiency (LEDs can run slightly higher PPFD)." : ""}
${goals.includes("yield") ? "Emphasize training techniques and canopy management for maximum yield." : ""}
${goals.includes("speed") ? "Optimize for faster cycle time where possible." : ""}
${goals.includes("quality") ? "Prioritize quality: slower dry, proper cure, trichome timing for harvest." : ""}`;
}
