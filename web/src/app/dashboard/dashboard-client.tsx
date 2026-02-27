"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AiChat } from "@/components/ai-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Leaf,
  CalendarDays,
  MessageCircle,
  Camera,
  Plus,
  Clock,
  Zap,
  Crown,
  ChevronRight,
  LogOut,
  Settings,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  subscription_tier: string;
  trial_start_date: string | null;
  questions_today: number;
}

interface Calendar {
  id: string;
  name: string | null;
  setup: {
    strainType?: string;
    medium?: string;
    experienceLevel?: string;
    spaceSize?: string;
  };
  total_weeks: number;
  estimated_harvest_date: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  user: { id: string; email: string };
  profile: Profile | null;
  calendars: Calendar[];
  trialHoursRemaining: number;
  trialActive: boolean;
}

const TIER_LABELS: Record<string, string> = {
  free: "Free Trial",
  grower_monthly: "Grower",
  commercial_monthly: "Commercial",
  lifetime: "Lifetime",
};

const TIER_COLORS: Record<string, string> = {
  free: "border-accent/40 text-accent",
  grower_monthly: "border-primary/30 text-primary",
  commercial_monthly: "border-primary/50 text-primary",
  lifetime: "border-accent/50 text-accent",
};

export default function DashboardClient({
  user,
  profile,
  calendars,
  trialHoursRemaining,
  trialActive,
}: Props) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const tier = profile?.subscription_tier ?? "free";
  const isPaid = tier !== "free";
  const questionsUsedToday = profile?.questions_today ?? 0;

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

return (
    <div className="min-h-screen bg-background text-foreground dark">
      <AiChat />

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-primary/10 flex items-center justify-center">
              <Leaf className="h-4 w-4 text-primary" />
              <Image
                src="/Dr.%20Pesos%20GreenTee%20notext.png"
                alt="Dr. Pesos"
                fill
                className="object-contain p-0.5"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <span className="hidden min-[1166px]:block text-sm font-semibold whitespace-nowrap">
              Dr. Pesos Grow Coach AI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", TIER_COLORS[tier])}
            >
              {tier === "lifetime" && <Crown className="mr-1 h-3 w-3" />}
              {TIER_LABELS[tier]}
            </Badge>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome banner */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back{user.email ? `, ${user.email.split("@")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to grow something great today?
          </p>
        </div>

        {/* Trial banner (free users only) */}
        {tier === "free" && (
          <div
            className={cn(
              "mb-6 rounded-xl border p-4",
              trialActive
                ? "border-accent/30 bg-accent/5"
                : "border-destructive/30 bg-destructive/5"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Clock
                  className={cn(
                    "h-5 w-5",
                    trialActive ? "text-accent" : "text-destructive"
                  )}
                />
                <div>
                  {trialActive ? (
                    <>
                      <p className="text-sm font-semibold text-accent">
                        Free trial — {Math.floor(trialHoursRemaining)}h{" "}
                        {Math.floor((trialHoursRemaining % 1) * 60)}m remaining
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.max(0, 3 - questionsUsedToday)} of 3 questions
                        remaining today
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-destructive">
                        Your free trial has ended
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Upgrade to continue growing with Dr. Pesos
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Link href="/pricing">
                <Button size="sm" className="glow-green gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
            {trialActive && (
              <Progress
                value={(trialHoursRemaining / 48) * 100}
                className="mt-3 h-1.5"
              />
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link href="/calendar/new">
            <Card className="group cursor-pointer border-border/50 bg-card transition-all hover:border-primary/40 hover:bg-primary/5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">New Grow Calendar</p>
                  <p className="text-xs text-muted-foreground">
                    Start a personalized plan
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <button
            onClick={() => {
              const event = new CustomEvent("open-dr-pesos-chat");
              window.dispatchEvent(event);
            }}
            className="text-left w-full"
          >
            <Card className="group cursor-pointer border-border/50 bg-card transition-all hover:border-primary/40 hover:bg-primary/5 h-full">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Ask Dr. Pesos</p>
                  <p className="text-xs text-muted-foreground">
                    Get cultivation guidance
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </button>

          <Link href="/diagnose">
            <Card className="group cursor-pointer border-border/50 bg-card transition-all hover:border-primary/40 hover:bg-primary/5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/10">
                  <Camera className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Diagnose My Plant</p>
                  <p className="text-xs text-muted-foreground">
                    Upload a photo for analysis
                  </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Grow calendars */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Your Grow Calendars
              </h2>
              <Link href="/calendar/new">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  New
                </Button>
              </Link>
            </div>

            {calendars.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <Sprout className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium">No grow calendars yet</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Generate your first personalized grow plan
                  </p>
                  <Link href="/calendar/new">
                    <Button className="glow-green gap-2">
                      <Plus className="h-4 w-4" />
                      Create Grow Calendar
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {calendars.map((cal) => (
                  <CalendarCard key={cal.id} calendar={cal} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Subscription card */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Your Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", TIER_COLORS[tier])}
                  >
                    {tier === "lifetime" && (
                      <Crown className="mr-1 h-3 w-3" />
                    )}
                    {TIER_LABELS[tier]}
                  </Badge>
                  {!isPaid && (
                    <Link href="/pricing">
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Upgrade
                      </Button>
                    </Link>
                  )}
                </div>
                {isPaid ? (
                  <p className="text-xs text-muted-foreground">
                    Full access to all Dr. Pesos features.
                  </p>
                ) : (
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>✓ AI chat (3 questions/day)</p>
                    <p>✓ Grow calendar generator</p>
                    <p className="text-muted-foreground/50">✗ Unlimited chat</p>
                    <p className="text-muted-foreground/50">✗ Photo diagnosis</p>
                    <p className="text-muted-foreground/50">✗ Progress tracking</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Quick Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "Beginner Setup Guide", prompt: "Help me set up my first indoor grow room. What do I need?" },
                  { label: "Defoliation Schedule", prompt: "What's the Dr. Pesos defoliation schedule for veg and flower?" },
                  { label: "Nutrient Deficiencies", prompt: "How do I identify and fix common nutrient deficiencies?" },
                  { label: "Harvest Timing", prompt: "How do I know when it's time to harvest? What should I look for?" },
                ].map(({ label, prompt }) => (
                  <ResourceLink key={label} label={label} prompt={prompt} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarCard({ calendar }: { calendar: Calendar }) {
  const setup = calendar.setup;
  const harvestDate = new Date(calendar.estimated_harvest_date).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <Link href={`/calendar?id=${calendar.id}`}>
      <Card className="group cursor-pointer border-border/50 bg-card transition-all hover:border-primary/40">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm truncate">
                  {calendar.name ??
                    `${setup?.strainType ? setup.strainType.charAt(0).toUpperCase() + setup.strainType.slice(1) : ""}${setup?.medium ? ` / ${setup.medium}` : ""} Grow`}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>{calendar.total_weeks}-week plan</span>
                {setup?.spaceSize && <span>{setup.spaceSize} ft</span>}
                <span>Harvest est. {harvestDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {setup?.strainType && (
                <Badge variant="outline" className="text-xs capitalize border-border/50">
                  {setup.strainType}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ResourceLink({ label, prompt }: { label: string; prompt: string }) {
  const handleClick = () => {
    // Dispatch custom event to open chat with pre-filled prompt
    window.dispatchEvent(
      new CustomEvent("open-dr-pesos-chat", { detail: { prompt } })
    );
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-muted/50 transition-colors group"
    >
      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  );
}
