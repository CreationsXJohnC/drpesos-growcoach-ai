"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Leaf,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Loader2,
} from "lucide-react";
import type {
  ExperienceLevel,
  StrainType,
  GrowMedium,
  LightType,
  NutrientType,
  GrowGoal,
} from "@/types/grow";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GrowSetupForm {
  experienceLevel: ExperienceLevel | null;
  strainType: StrainType | null;
  strainGenetics: string;
  medium: GrowMedium | null;
  lightType: LightType | null;
  lightWattage: string;
  underCanopyLight: boolean;
  nutrientType: NutrientType | null;
  spaceSize: string;
  startDate: string;
  goals: GrowGoal[];
}

const STEPS = [
  "Experience Level",
  "Strain Type",
  "Grow Medium",
  "Lighting",
  "Nutrients",
  "Setup Details",
  "Goals",
];

const DISCHARGE_WATTAGES = ["400W", "600W", "650W", "750W", "1000W", "1150W"];

export default function NewCalendarPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [form, setForm] = useState<GrowSetupForm>({
    experienceLevel: null,
    strainType: null,
    strainGenetics: "",
    medium: null,
    lightType: null,
    lightWattage: "",
    underCanopyLight: false,
    nutrientType: null,
    spaceSize: "4x4",
    startDate: new Date().toISOString().split("T")[0],
    goals: ["quality"],
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const isDischargeLight =
    form.lightType === "hps" ||
    form.lightType === "hid" ||
    form.lightType === "cmh";

  const canAdvance = () => {
    switch (step) {
      case 0: return form.experienceLevel !== null;
      case 1: return form.strainType !== null;
      case 2: return form.medium !== null;
      case 3: return form.lightType !== null && form.lightWattage.trim() !== "";
      case 4: return form.nutrientType !== null;
      case 5: return form.spaceSize !== "" && form.startDate !== "";
      case 6: return form.goals.length > 0;
      default: return false;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError("");
    try {
      const res = await fetch("/api/generate-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceLevel: form.experienceLevel,
          strainType: form.strainType,
          strainGenetics: form.strainGenetics,
          medium: form.medium,
          lightType: form.lightType,
          lightWattage: form.lightWattage,
          underCanopyLight: form.underCanopyLight,
          nutrientType: form.nutrientType,
          spaceSize: form.spaceSize,
          startDate: form.startDate,
          goals: form.goals,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to generate calendar");
      }

      // ── Consume SSE stream ───────────────────────────────────────
      // Buffer incomplete lines across chunks — the large calendar JSON
      // will almost always be split across multiple network packets.
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.calendar) {
              const calendar = parsed.calendar;
              if (calendar.id) {
                router.push(`/calendar?id=${calendar.id}`);
              } else {
                sessionStorage.setItem("growCalendar", JSON.stringify(calendar));
                sessionStorage.setItem("growSetup", JSON.stringify(form));
                router.push("/calendar");
              }
              return;
            }
            // parsed.progress — heartbeat, keep waiting
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      throw new Error("No calendar was returned — please try again.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      console.error("Calendar generation error:", msg);
      setGenerateError(msg);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Leaf className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">Dr. Pesos Grow Coach AI</span>
          </Link>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">
            <CalendarDays className="mr-1 h-3 w-3" />
            New Grow Calendar
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 pt-6">
        <div className="mx-auto max-w-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-2xl">

          {/* Step 0 — Experience Level */}
          {step === 0 && (
            <StepCard
              title="What's your experience level?"
              subtitle="Dr. Pesos will tailor your calendar to match where you are in your journey."
            >
              <OptionGrid
                options={[
                  { value: "beginner", label: "Beginner", desc: "First or second grow. Need clear step-by-step guidance." },
                  { value: "intermediate", label: "Intermediate", desc: "A few grows under my belt. Ready for more advanced techniques." },
                  { value: "commercial", label: "Commercial", desc: "Licensed cultivator. Need SOP-style plans with KPIs and workflows." },
                ]}
                selected={form.experienceLevel}
                onSelect={(v) => setForm({ ...form, experienceLevel: v as ExperienceLevel })}
              />
            </StepCard>
          )}

          {/* Step 1 — Strain Type + Genetics */}
          {step === 1 && (
            <StepCard
              title="What are you growing?"
              subtitle="Select your strain type, then enter the specific strain name or genetics for personalized guidance."
            >
              <div className="space-y-6">
                <OptionGrid
                  options={[
                    { value: "indica_dominant", label: "Indica-Dominant", desc: "Shorter flower time (~8 weeks). Dense, bushy structure. Heavy body effect. Great for yield." },
                    { value: "sativa_dominant", label: "Sativa-Dominant", desc: "Longer flower time (~10–12 weeks). Tall, stretchy growth. Cerebral effect. Longer cure recommended." },
                    { value: "hybrid", label: "Hybrid", desc: "Balanced indica/sativa characteristics. Most common commercial strains. Versatile training response." },
                    { value: "autoflower", label: "Auto-Flower", desc: "No light schedule change needed. Completes full cycle in 10–12 weeks. Ruderalis genetics." },
                  ]}
                  selected={form.strainType}
                  onSelect={(v) => setForm({ ...form, strainType: v as StrainType })}
                />

                {form.strainType && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Strain Name / Genetics{" "}
                      <span className="text-xs font-normal text-muted-foreground">(optional but recommended)</span>
                    </label>
                    <input
                      type="text"
                      value={form.strainGenetics}
                      onChange={(e) => setForm({ ...form, strainGenetics: e.target.value })}
                      placeholder="e.g. Gorilla Glue #4, OG Kush × White Widow, Bruce Banner, Wedding Cake"
                      className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Enter the strain name, breeder cross, or parent genetics. Dr. Pesos uses this to calibrate flower time, stretch prediction, terpene profile, and harvest timing specific to your genetics.
                    </p>
                  </div>
                )}
              </div>
            </StepCard>
          )}

          {/* Step 2 — Grow Medium */}
          {step === 2 && (
            <StepCard
              title="What grow medium are you using?"
              subtitle="Your medium determines watering frequency, nutrient delivery, and pH targets."
            >
              <OptionGrid
                options={[
                  { value: "soil", label: "Soil", desc: "Most forgiving for beginners. pH 6.0–7.0. Natural buffer, slower feed uptake." },
                  { value: "living_soil", label: "Living Soil", desc: "Amended super soil with beneficial microbes. Minimal synthetic inputs. pH 6.2–7.0." },
                  { value: "coco", label: "Coco Coir", desc: "Fast growth, high yield potential. pH 5.5–6.5. Daily fertigation required." },
                  { value: "hydro", label: "Hydroponics (DWC / NFT)", desc: "Fastest growth. pH 5.5–6.5. Precise EC monitoring essential." },
                  { value: "aeroponics", label: "Aeroponics", desc: "Roots misted in air. Maximum oxygen and uptake speed. Advanced setup required." },
                  { value: "rockwool", label: "Rockwool / Stonewool", desc: "Common in commercial setups. pH 5.5–6.5. Sterile inert substrate." },
                ]}
                selected={form.medium}
                onSelect={(v) => setForm({ ...form, medium: v as GrowMedium })}
              />
            </StepCard>
          )}

          {/* Step 3 — Lighting */}
          {step === 3 && (
            <StepCard
              title="What type of lights are you running?"
              subtitle="Your light type and wattage determine PPFD targets, heat load, and canopy distance."
            >
              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-medium text-muted-foreground">Primary Light Type</p>
                  <OptionGrid
                    options={[
                      { value: "led", label: "LED", desc: "Light-Emitting Diode. Energy-efficient, low heat, adjustable spectrum and intensity." },
                      { value: "hps", label: "HPS", desc: "High Pressure Sodium. Proven yields, intense heat output, orange/red spectrum." },
                      { value: "hid", label: "HID", desc: "High-Intensity Discharge. Broad category covering HPS and Metal Halide. Industry standard." },
                      { value: "cmh", label: "CMH", desc: "Ceramic Metal Halide. Full-spectrum output — excellent terpene expression and quality finish." },
                      { value: "fluorescent", label: "Fluorescent (T5)", desc: "Low-intensity fluorescent tubes. Best for seedlings, clones, and propagation stages." },
                      { value: "tungsten", label: "Tungsten / Incandescent", desc: "Traditional incandescent bulbs. Low efficiency, warm spectrum. Supplemental use only." },
                    ]}
                    selected={form.lightType}
                    onSelect={(v) => setForm({ ...form, lightType: v as LightType, lightWattage: "" })}
                  />
                </div>

                {form.lightType && (
                  <div>
                    <p className="mb-3 text-sm font-medium text-muted-foreground">
                      {form.lightType === "led"
                        ? "LED Wattage (actual draw watts from wall)"
                        : "Light Wattage"}
                    </p>

                    {isDischargeLight ? (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {DISCHARGE_WATTAGES.map((w) => (
                          <button
                            key={w}
                            onClick={() => setForm({ ...form, lightWattage: w })}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                              form.lightWattage === w
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={form.lightWattage}
                          onChange={(e) => setForm({ ...form, lightWattage: e.target.value })}
                          placeholder={
                            form.lightType === "led"
                              ? "e.g. 480W, 640W, 1000W"
                              : form.lightType === "fluorescent"
                              ? "e.g. 216W (4× 54W T5)"
                              : "e.g. 300W"
                          }
                          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {form.lightType === "led"
                            ? "Enter the actual draw wattage from the wall, not the equivalent wattage in the product name."
                            : "Enter the total wattage of your lighting setup."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Under Canopy — always optional add-on, works alongside any primary light */}
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Add-On Lighting <span className="text-xs font-normal">(optional)</span>
                  </p>
                  <button
                    onClick={() => setForm({ ...form, underCanopyLight: !form.underCanopyLight })}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all",
                      form.underCanopyLight
                        ? "border-primary bg-primary/10 glow-green"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm mb-1">Under Canopy Lighting</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Supplemental lighting placed below the main canopy to illuminate lower bud sites.
                          Can be selected alongside any primary light. Significantly improves lower-cola yield.
                        </p>
                      </div>
                      <div className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all",
                        form.underCanopyLight
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-transparent"
                      )}>
                        ✓
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </StepCard>
          )}

          {/* Step 4 — Nutrients */}
          {step === 4 && (
            <StepCard
              title="What type of nutrients are you using?"
              subtitle="Your nutrient program determines feeding schedules, pH targets, and soil biology management."
            >
              <OptionGrid
                options={[
                  {
                    value: "synthetic",
                    label: "Synthetic / Salt-Based",
                    desc: "Fast-acting, precise dosing. Examples: Advanced Nutrients, General Hydroponics, Flora Series, Jack's 3-2-1. Requires regular pH adjustment.",
                  },
                  {
                    value: "organic",
                    label: "Organic / Living",
                    desc: "Slow-release, soil biology driven. Examples: BuildASoil, TLO, Craft Blend, ROLS inputs. pH often self-regulates in living soil.",
                  },
                ]}
                selected={form.nutrientType}
                onSelect={(v) => setForm({ ...form, nutrientType: v as NutrientType })}
              />

              {form.nutrientType && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1.5">
                  {form.nutrientType === "synthetic" ? (
                    <>
                      <p className="font-medium text-primary">Synthetic program notes:</p>
                      <p>• Dr. Pesos default schedule uses Advanced Nutrients base (Micro / Grow / Bloom)</p>
                      <p>• pH targets: soil 6.0–7.0 · coco / hydro / rockwool 5.5–6.5</p>
                      <p>• Weekly EC targets provided per grow stage in your calendar</p>
                      <p>• Pre-harvest flush recommended for cleanest finish</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-primary">Organic program notes:</p>
                      <p>• Top-dresses and compost teas replace liquid feeds — schedule included in calendar</p>
                      <p>• pH self-regulates in active living soil (target 6.2–7.0)</p>
                      <p>• Slow-release inputs need 7–10 days to become available — plan ahead</p>
                      <p>• No chemical flush needed — organic finish is naturally clean</p>
                    </>
                  )}
                </div>
              )}
            </StepCard>
          )}

          {/* Step 5 — Setup Details */}
          {step === 5 && (
            <StepCard
              title="Tell me about your setup"
              subtitle="This calibrates plant counts, canopy targets, and environmental recommendations."
            >
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">Grow Space Size</label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {["2x2", "3x3", "4x4", "5x5", "4x8", "8x8", "10x10", "Custom"].map((size) => (
                      <button
                        key={size}
                        onClick={() => setForm({ ...form, spaceSize: size })}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                          form.spaceSize === size
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    The date you plan to germinate — or the date you started if you&apos;re mid-grow.
                  </p>
                </div>
              </div>
            </StepCard>
          )}

          {/* Step 6 — Goals */}
          {step === 6 && (
            <StepCard
              title="What are your grow goals?"
              subtitle="Select all that apply — Dr. Pesos will optimize your calendar accordingly."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  { value: "yield", label: "Maximize Yield", desc: "Aggressive training, defoliation, and canopy optimization." },
                  { value: "quality", label: "Top Quality", desc: "Slower dry, longer cure, precise trichome harvest timing." },
                  { value: "speed", label: "Fastest Cycle", desc: "Shorter veg, early flip, efficient schedule." },
                ] as { value: GrowGoal; label: string; desc: string }[]).map((opt) => {
                  const selected = form.goals.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const goals = selected
                          ? form.goals.filter((g) => g !== opt.value)
                          : [...form.goals, opt.value];
                        setForm({ ...form, goals: goals.length ? goals : [opt.value] });
                      }}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/10 glow-green"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <p className="font-medium text-sm mb-1">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Full Summary */}
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-medium text-primary mb-3">Your Full Grow Setup</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span>Experience: <strong className="text-foreground capitalize">{form.experienceLevel}</strong></span>
                  <span>
                    Strain:{" "}
                    <strong className="text-foreground capitalize">
                      {form.strainType?.replace("_", "-")}
                      {form.strainGenetics && ` — ${form.strainGenetics}`}
                    </strong>
                  </span>
                  <span>Medium: <strong className="text-foreground capitalize">{form.medium?.replace("_", " ")}</strong></span>
                  <span>
                    Light:{" "}
                    <strong className="text-foreground uppercase">
                      {form.lightType?.replace("_", " ")}
                      {form.lightWattage && ` · ${form.lightWattage}`}
                      {form.underCanopyLight && " + Under Canopy"}
                    </strong>
                  </span>
                  <span>Nutrients: <strong className="text-foreground capitalize">{form.nutrientType}</strong></span>
                  <span>Space: <strong className="text-foreground">{form.spaceSize} ft</strong></span>
                  <span>Start: <strong className="text-foreground">{form.startDate}</strong></span>
                  <span>Goals: <strong className="text-foreground capitalize">{form.goals.join(", ")}</strong></span>
                </div>
              </div>
            </StepCard>
          )}

          {/* Navigation */}
          <div className="mt-6 space-y-2">
            {!canAdvance() && step === 3 && form.lightType && !form.lightWattage && (
              <p className="text-center text-xs text-amber-400">
                ↑ Please enter your light wattage above to continue
              </p>
            )}
            {generateError && (
              <p className="text-center text-xs text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                {generateError}
              </p>
            )}
            {isGenerating && (
              <p className="text-center text-xs text-muted-foreground">
                Calendar generation takes 30–60 seconds — hang tight...
              </p>
            )}
            <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canAdvance()}
                className="gap-2 glow-green"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!canAdvance() || isGenerating}
                className="gap-2 glow-green px-6"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Dr. Pesos is building your calendar...
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4" />
                    Generate My Grow Calendar
                  </>
                )}
              </Button>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function OptionGrid({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string; desc: string }[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={cn(
            "rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5",
            selected === opt.value
              ? "border-primary bg-primary/10 glow-green"
              : "border-border bg-card hover:border-primary/40"
          )}
        >
          <p className="font-semibold text-sm mb-1">{opt.label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
        </button>
      ))}
    </div>
  );
}
