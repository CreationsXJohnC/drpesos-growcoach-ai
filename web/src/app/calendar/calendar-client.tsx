"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AiChat } from "@/components/ai-chat";
import { useChatStore } from "@/stores/chat-store";
import {
  Leaf,
  CalendarDays,
  CheckCircle2,
  Circle,
  Thermometer,
  Droplets,
  Zap,
  Sun,
  MessageCircle,
  ChevronRight,
  Scissors,
  FlaskConical,
  Eye,
  Sprout,
  Download,
} from "lucide-react";
import type { DailyTask, CalendarData } from "@/types/grow";
import { cn } from "@/lib/utils";

interface CalendarWithMeta extends CalendarData {
  id?: string;
  name?: string | null;
}

interface Props {
  calendar: CalendarWithMeta | null;
  initialCompleted: string[];
  isDemo?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  germination: "text-accent",
  seedling: "text-accent",
  vegetative: "text-accent",
  flower: "text-primary",
  harvest: "text-accent",
  dry: "text-primary",
  cure: "text-primary",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  watering: <Droplets className="h-3.5 w-3.5" />,
  nutrients: <FlaskConical className="h-3.5 w-3.5" />,
  training: <Sprout className="h-3.5 w-3.5" />,
  ipm: <Eye className="h-3.5 w-3.5" />,
  environment: <Thermometer className="h-3.5 w-3.5" />,
  defoliation: <Scissors className="h-3.5 w-3.5" />,
  observation: <Eye className="h-3.5 w-3.5" />,
  harvest: <Leaf className="h-3.5 w-3.5" />,
};

export default function CalendarClient({ calendar: serverCalendar, initialCompleted, isDemo = false }: Props) {
  const router = useRouter();
  const [calendar, setCalendar] = useState<CalendarWithMeta | null>(serverCalendar);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(
    () => new Set(initialCompleted)
  );
  const { setOpen, setGrowContext } = useChatStore();

  // Debounce ref for saving progress
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If no server calendar, try sessionStorage (demo / unauthenticated path)
  useEffect(() => {
    if (serverCalendar) return;

    const stored = sessionStorage.getItem("growCalendar");
    const setup = sessionStorage.getItem("growSetup");
    if (!stored) {
      router.push("/calendar/new");
      return;
    }
    const data = JSON.parse(stored) as CalendarData;
    setCalendar(data);

    if (setup) {
      const s = JSON.parse(setup);
      setGrowContext({
        stage: data.weeks[0]?.stage,
        week: 1,
        strainType: s.strainType,
      });
    }
  }, [router, serverCalendar, setGrowContext]);

  // Set grow context once calendar is available
  useEffect(() => {
    if (!calendar) return;
    setGrowContext({
      stage: calendar.weeks[0]?.stage,
      week: 1,
    });
  }, [calendar, setGrowContext]);

  // Demo mode: open chat automatically after a short delay
  useEffect(() => {
    if (!isDemo) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [isDemo, setOpen]);

  if (!calendar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Leaf className="h-5 w-5 animate-pulse text-primary" />
          <span>Loading your grow calendar...</span>
        </div>
      </div>
    );
  }

  const currentWeek = calendar.weeks[selectedWeek];
  const totalTasks = currentWeek?.dailyTasks.length ?? 0;
  const weekTaskIds = currentWeek?.dailyTasks.map((t) => t.id) ?? [];
  const doneCount = weekTaskIds.filter((id) => completedTasks.has(id)).length;
  const weekProgress = totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0;

  const saveProgress = (updatedTasks: Set<string>) => {
    if (!calendar.id || isDemo) return;

    // Debounce: wait 800ms after last toggle before saving
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            calendarId: calendar.id,
            tasksCompleted: Array.from(updatedTasks),
          }),
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    }, 800);
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      saveProgress(next);
      return next;
    });
  };

  const openChatWithContext = () => {
    setGrowContext({
      stage: currentWeek?.stage,
      week: selectedWeek + 1,
    });
    setOpen(true);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hidden in print */}
      <div className="print:hidden">
        <AiChat />
      </div>

      {/* Demo mode banner */}
      {isDemo && (
        <div className="sticky top-0 z-40 bg-primary/10 border-b border-primary/30 px-6 py-2.5 print:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <p className="text-xs text-primary font-medium">
              <span className="font-bold">Live Demo</span> — This is a sample 14-week grow calendar. Sign up for free to generate your personalized plan.
            </p>
            <Link href="/auth/signup">
              <Button size="sm" className="glow-green h-7 text-xs px-3 shrink-0">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-primary/10">
              <Image src="/Ori-Badge02.png" alt="Dr. Pesos" fill className="object-contain p-0.5" />
            </div>
            <span className="text-sm font-semibold hidden sm:block">Dr. Pesos Grow Coach AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary text-xs print:hidden">
              <CalendarDays className="mr-1 h-3 w-3" />
              {calendar.totalWeeks}-Week Grow Plan
            </Badge>
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="text-xs hidden sm:flex print:hidden">
                Dashboard
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="gap-1.5 text-xs print:hidden"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
            <Button size="sm" variant="outline" onClick={openChatWithContext} className="gap-1.5 text-xs print:hidden">
              <MessageCircle className="h-3.5 w-3.5" />
              Ask Dr. Pesos
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 print:hidden">
        {/* Week Sidebar */}
        <div className="mb-6 lg:mb-0">
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="border-b border-border/50 px-4 py-3">
              <p className="text-sm font-semibold">
                {calendar.name ?? "Grow Timeline"}
              </p>
              <p className="text-xs text-muted-foreground">
                Est. harvest: {formatDate(calendar.estimatedHarvestDate)}
              </p>
            </div>
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="p-2">
                {calendar.weeks.map((week, i) => {
                  const wTaskIds = week.dailyTasks.map((t) => t.id);
                  const wDone = wTaskIds.filter((id) => completedTasks.has(id)).length;
                  const wPct = wTaskIds.length > 0 ? (wDone / wTaskIds.length) * 100 : 0;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedWeek(i)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left transition-all mb-0.5",
                        selectedWeek === i
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Week {week.week}</span>
                        <span className={cn("text-xs font-medium capitalize", STAGE_COLORS[week.stage])}>
                          {week.stage}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={wPct} className="h-1 flex-1" />
                        {week.defoliationScheduled && (
                          <Scissors className="h-3 w-3 text-accent shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(week.startDate)} – {formatDate(week.endDate)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Week header */}
          <div className="rounded-xl border border-border/50 bg-card px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">Week {currentWeek.week}</h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize border-current/30",
                      STAGE_COLORS[currentWeek.stage]
                    )}
                  >
                    {currentWeek.stage}
                  </Badge>
                  {currentWeek.defoliationScheduled && (
                    <Badge variant="outline" className="border-accent/30 text-accent">
                      <Scissors className="mr-1 h-3 w-3" />
                      Defoliation Week
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground italic">{currentWeek.drPesosNote}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Week Progress</p>
                <p className="text-lg font-bold text-primary">{Math.round(weekProgress)}%</p>
                <p className="text-xs text-muted-foreground">{doneCount}/{totalTasks} tasks</p>
              </div>
            </div>
            <Progress value={weekProgress} className="mt-3 h-2" />
          </div>

          <Tabs defaultValue="tasks">
            <TabsList className="bg-card border border-border/50">
              <TabsTrigger value="tasks">Daily Tasks</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="nutrients">Nutrients</TabsTrigger>
            </TabsList>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-4 space-y-2">
              {currentWeek.dailyTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  completed={completedTasks.has(task.id)}
                  onToggle={() => toggleTask(task.id)}
                  onAskDrPesos={() => {
                    setGrowContext({ stage: currentWeek.stage, week: selectedWeek + 1 });
                    setOpen(true);
                  }}
                />
              ))}
              {currentWeek.dailyTasks.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  No tasks scheduled this week.
                </p>
              )}
            </TabsContent>

            {/* Environment Tab */}
            <TabsContent value="environment" className="mt-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">
                    Environmental Targets — {currentWeek.stage.charAt(0).toUpperCase() + currentWeek.stage.slice(1)} Stage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <EnvStat icon={<Thermometer className="h-4 w-4 text-accent" />} label="Temperature" value={currentWeek.envTargets.tempF} />
                    <EnvStat icon={<Droplets className="h-4 w-4 text-primary" />} label="Humidity (RH)" value={currentWeek.envTargets.rh} />
                    <EnvStat icon={<Zap className="h-4 w-4 text-primary" />} label="VPD" value={currentWeek.envTargets.vpd} />
                    <EnvStat icon={<Sun className="h-4 w-4 text-accent" />} label="PPFD" value={currentWeek.envTargets.ppfd} />
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-medium mb-1">Light Schedule</p>
                    <p className="text-sm font-semibold text-primary">{currentWeek.envTargets.lightSchedule}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nutrients Tab */}
            <TabsContent value="nutrients" className="mt-4">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Nutrient Guidance — Week {currentWeek.week}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {currentWeek.nutrients}
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-primary border-primary/30"
                      onClick={openChatWithContext}
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      Get Detailed Feeding Schedule from Dr. Pesos
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation */}
          <div className="flex items-center justify-between pb-6">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedWeek === 0}
              onClick={() => setSelectedWeek(selectedWeek - 1)}
            >
              ← Previous Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedWeek === calendar.weeks.length - 1}
              onClick={() => setSelectedWeek(selectedWeek + 1)}
            >
              Next Week →
            </Button>
          </div>
        </div>
      </div>

      {/* ── Print / PDF view — hidden on screen, visible when printing ── */}
      <div className="hidden print:block px-8 py-6 text-black bg-white">
        {/* Print header */}
        <div className="mb-6 pb-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold">
            {calendar.name ?? "Grow Calendar"} — Dr. Pesos Grow Coach AI
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {calendar.totalWeeks}-week plan · Est. harvest: {formatDate(calendar.estimatedHarvestDate)} · Powered by Ori Company · We Grow Life
          </p>
        </div>

        {/* All weeks */}
        {calendar.weeks.map((week) => (
          <div
            key={week.week}
            style={{ pageBreakInside: "avoid" }}
            className="mb-6 border border-gray-300 rounded-lg p-4"
          >
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-lg font-bold">
                Week {week.week} — <span className="capitalize">{week.stage}</span>
                {week.defoliationScheduled && " ✂️ Defoliation"}
              </h2>
              <span className="text-xs text-gray-500">
                {formatDate(week.startDate)} – {formatDate(week.endDate)}
              </span>
            </div>

            {/* Tasks */}
            <ul className="mb-3 space-y-0.5">
              {week.dailyTasks.map((t) => (
                <li key={t.id} className="text-sm flex items-start gap-2">
                  <span className="mt-0.5 text-gray-400 shrink-0">☐</span>
                  <span>{t.task}</span>
                  {t.priority === "required" && (
                    <span className="text-xs text-red-600 shrink-0">(required)</span>
                  )}
                </li>
              ))}
            </ul>

            {/* Env targets */}
            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
              🌡️ {week.envTargets.tempF} &nbsp;|&nbsp;
              💧 RH {week.envTargets.rh} &nbsp;|&nbsp;
              💨 VPD {week.envTargets.vpd} &nbsp;|&nbsp;
              ☀️ {week.envTargets.lightSchedule} &nbsp;|&nbsp;
              📡 {week.envTargets.ppfd}
            </div>

            {/* Nutrients */}
            {week.nutrients && (
              <p className="mt-2 text-xs text-gray-600">
                <strong>Nutrients:</strong> {week.nutrients}
              </p>
            )}

            {/* Dr. Pesos note */}
            {week.drPesosNote && (
              <p className="mt-2 text-xs italic text-green-800">
                Dr. Pesos: &quot;{week.drPesosNote}&quot;
              </p>
            )}
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
          Generated by Dr. Pesos Grow Coach AI · drpesos-growcoach-ai.vercel.app
        </p>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  completed,
  onToggle,
  onAskDrPesos,
}: {
  task: DailyTask;
  completed: boolean;
  onToggle: () => void;
  onAskDrPesos: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-3.5 transition-all",
        completed
          ? "border-primary/20 bg-primary/5 opacity-70"
          : task.priority === "required"
          ? "border-border/80 bg-card"
          : "border-border/50 bg-card"
      )}
    >
      <button onClick={onToggle} className="mt-0.5 shrink-0">
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium", completed && "line-through text-muted-foreground")}>
            {task.task}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            {CATEGORY_ICONS[task.category]}
          </div>
          {task.priority === "required" && (
            <Badge variant="outline" className="border-red-400/30 text-red-400 text-xs px-1.5 py-0">Required</Badge>
          )}
        </div>
        {task.drPesosNote && (
          <p className="text-xs text-muted-foreground italic">
            <span className="text-primary font-medium">Dr. Pesos: </span>
            {task.drPesosNote}
          </p>
        )}
      </div>
      <button
        onClick={onAskDrPesos}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Ask Dr. Pesos about this task"
      >
        <MessageCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
      </button>
    </div>
  );
}

function EnvStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
