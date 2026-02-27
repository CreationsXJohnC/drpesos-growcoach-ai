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
  GrowGoal,
} from "@/types/grow";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GrowSetupForm {
  experienceLevel: ExperienceLevel | null;
  strainType: StrainType | null;
  medium: GrowMedium | null;
  lightType: LightType | null;
  spaceSize: string;
  startDate: string;
  goals: GrowGoal[];
}

const STEPS = [
  "Experience Level",
  "Strain Type",
  "Grow Medium",
  "Lighting",
  "Setup Details",
  "Goals",
];

export default function NewCalendarPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [form, setForm] = useState<GrowSetupForm>({
    experienceLevel: null,
    strainType: null,
    medium: null,
    lightType: null,
    spaceSize: "4x4",
    startDate: new Date().toISOString().split("T")[0],
    goals: ["quality"],
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const canAdvance = () => {
    switch (step) {
      case 0: return form.experienceLevel !== null;
      case 1: return form.strainType !== null;
      case 2: return form.medium !== null;
      case 3: return form.lightType !== null;
      case 4: return form.spaceSize && form.startDate;
      case 5: return form.goals.length > 0;
      default: return false;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceLevel: form.experienceLevel,
          strainType: form.strainType,
          medium: form.medium,
          lightType: form.lightType,
          spaceSize: form.spaceSize,
          startDate: form.startDate,
          goals: form.goals,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate calendar");
      const calendar = await res.json();

      if (calendar.id) {
        router.push(`/calendar?id=${calendar.id}`);
      } else {
        // Unauthenticated / demo fallback — sessionStorage only
        sessionStorage.setItem("growCalendar", JSON.stringify(calendar));
        sessionStorage.setItem("growSetup", JSON.stringify(form));
        router.push("/calendar");
      }
    } catch (err) {
      console.error(err);
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

          {step === 1 && (
            <StepCard
              title="What type of strain are you growing?"
              subtitle="This determines your light schedule, grow cycle length, and defoliation timing."
            >
              <OptionGrid
                options={[
                  { value: "indica", label: "Indica", desc: "Shorter flower time (~8 weeks). Dense, bushy structure." },
                  { value: "sativa", label: "Sativa", desc: "Longer flower time (~10-12 weeks). Tall, stretchy growth." },
                  { value: "hybrid", label: "Hybrid", desc: "Balanced characteristics. Most common commercial strains." },
                  { value: "autoflower", label: "Auto-flower", desc: "No light schedule change needed. Shorter total cycle (~10-12 weeks)." },
                ]}
                selected={form.strainType}
                onSelect={(v) => setForm({ ...form, strainType: v as StrainType })}
              />
            </StepCard>
          )}

          {step === 2 && (
            <StepCard
              title="What grow medium are you using?"
              subtitle="Your medium determines watering frequency, nutrient delivery, and pH targets."
            >
              <OptionGrid
                options={[
                  { value: "soil", label: "Soil", desc: "Most forgiving for beginners. pH target: 6.0–7.0. Slower feed uptake." },
                  { value: "coco", label: "Coco Coir", desc: "Fast growth, high yield potential. pH target: 5.5–6.5. Daily watering." },
                  { value: "hydro", label: "Hydroponics", desc: "Fastest growth. pH target: 5.5–6.5. Requires precise EC monitoring." },
                  { value: "rockwool", label: "Rockwool", desc: "Popular in commercial settings. pH target: 5.5–6.5. Sterile substrate." },
                ]}
                selected={form.medium}
                onSelect={(v) => setForm({ ...form, medium: v as GrowMedium })}
              />
            </StepCard>
          )}

          {step === 3 && (
            <StepCard
              title="What type of lights are you running?"
              subtitle="Your light type affects PPFD targets, heat management, and energy efficiency."
            >
              <OptionGrid
                options={[
                  { value: "led", label: "LED", desc: "Energy-efficient, runs cooler. Can push higher PPFD with less heat stress." },
                  { value: "hps", label: "HPS", desc: "Industry standard, proven results. More heat — manage your temps accordingly." },
                  { value: "cmh", label: "CMH / LEC", desc: "Full-spectrum, great terpene production. Excellent for quality-focused grows." },
                  { value: "fluorescent", label: "Fluorescent (T5)", desc: "Best for seedlings and clones. Low intensity for early stages." },
                ]}
                selected={form.lightType}
                onSelect={(v) => setForm({ ...form, lightType: v as LightType })}
              />
            </StepCard>
          )}

          {step === 4 && (
            <StepCard
              title="Tell me about your setup"
              subtitle="This helps calibrate plant counts, canopy targets, and environmental recommendations."
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
                    The date you plan to germinate or the date you started if mid-grow.
                  </p>
                </div>
              </div>
            </StepCard>
          )}

          {step === 5 && (
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

              {/* Summary card */}
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-medium text-primary mb-2">Your Grow Setup Summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Experience: <strong className="text-foreground capitalize">{form.experienceLevel}</strong></span>
                  <span>Strain: <strong className="text-foreground capitalize">{form.strainType}</strong></span>
                  <span>Medium: <strong className="text-foreground capitalize">{form.medium}</strong></span>
                  <span>Lights: <strong className="text-foreground uppercase">{form.lightType}</strong></span>
                  <span>Space: <strong className="text-foreground">{form.spaceSize} ft</strong></span>
                  <span>Start: <strong className="text-foreground">{form.startDate}</strong></span>
                </div>
              </div>
            </StepCard>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
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
