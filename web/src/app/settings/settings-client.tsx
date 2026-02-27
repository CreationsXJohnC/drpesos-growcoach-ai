"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Leaf,
  ArrowLeft,
  Crown,
  Zap,
  Building2,
  LogOut,
  AlertCircle,
  CheckCircle,
  Loader2,
  TrendingUp,
  User,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  subscription_tier: string;
  trial_start_date: string | null;
  subscription_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

interface Props {
  user: { id: string; email: string };
  profile: Profile | null;
}

const TIER_LABELS: Record<string, string> = {
  free: "Free Trial",
  grower_monthly: "Grower",
  commercial_monthly: "Commercial",
  lifetime: "Lifetime",
};

const TIER_COLORS: Record<string, string> = {
  free: "border-muted-foreground/30 text-muted-foreground",
  grower_monthly: "border-primary/40 text-primary",
  commercial_monthly: "border-accent/40 text-accent",
  lifetime: "border-orange-400/40 text-orange-400",
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  free: <Leaf className="h-4 w-4" />,
  grower_monthly: <Zap className="h-4 w-4" />,
  commercial_monthly: <Building2 className="h-4 w-4" />,
  lifetime: <Crown className="h-4 w-4" />,
};

export default function SettingsClient({ user, profile }: Props) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelStatus, setCancelStatus] = useState<"idle" | "success" | "error">("idle");
  const [cancelError, setCancelError] = useState("");

  const tier = profile?.subscription_tier ?? "free";
  const isMonthly = tier === "grower_monthly" || tier === "commercial_monthly";
  const isLifetime = tier === "lifetime";
  const isFree = tier === "free";

  const periodEnd = profile?.subscription_period_end
    ? new Date(profile.subscription_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel? You'll keep access until your billing period ends.")) return;
    setCancelling(true);
    setCancelStatus("idle");
    setCancelError("");

    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to cancel");
      setCancelStatus("success");
    } catch (err) {
      setCancelStatus("error");
      setCancelError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-primary/10 flex items-center justify-center">
              <Leaf className="h-4 w-4 text-primary" />
              <Image
                src="/Dr.%20Pesos%20GreenTee%20notext.png"
                alt="Dr. Pesos"
                fill
                className="object-contain p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <span className="hidden sm:block text-sm font-semibold whitespace-nowrap">
              Dr. Pesos Grow Coach AI
            </span>
          </Link>

          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your account and subscription.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Account Info ─────────────────────────────────── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/40">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              {memberSince && (
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">Member since</span>
                  <span className="text-sm">{memberSince}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-foreground">User ID</span>
                <span className="text-xs text-muted-foreground/60 font-mono">
                  {user.id.slice(0, 8)}…
                </span>
              </div>
            </CardContent>
          </Card>

          {/* ── Subscription ─────────────────────────────────── */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current plan */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("gap-1 text-xs", TIER_COLORS[tier])}
                  >
                    {TIER_ICONS[tier]}
                    {TIER_LABELS[tier]}
                  </Badge>
                  {isLifetime && (
                    <span className="text-xs text-muted-foreground">Lifetime access</span>
                  )}
                </div>

                {/* Upgrade CTA for non-lifetime users */}
                {!isLifetime && (
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {isFree ? "Upgrade" : "Change Plan"}
                    </Button>
                  </Link>
                )}
              </div>

              {/* Billing details */}
              {isMonthly && periodEnd && (
                <div className="rounded-lg bg-muted/30 px-4 py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next billing date</span>
                    <span>{periodEnd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span>{tier === "commercial_monthly" ? "$69/mo" : "$14/mo"}</span>
                  </div>
                </div>
              )}

              {isLifetime && (
                <div className="rounded-lg bg-orange-400/5 border border-orange-400/20 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-orange-400" />
                    <p className="text-xs text-muted-foreground">
                      You have permanent access — no recurring charges.
                    </p>
                  </div>
                </div>
              )}

              {isFree && (
                <div className="rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1.5">
                  <p>Free trial — 48-hour access window, 3 questions/day.</p>
                  <p>
                    Upgrade to{" "}
                    <Link href="/pricing" className="text-primary hover:underline">
                      Grower ($14/mo)
                    </Link>{" "}
                    for unlimited chat, calendars, and photo diagnosis.
                  </p>
                </div>
              )}

              {/* Cancel subscription */}
              {isMonthly && cancelStatus === "idle" && (
                <div className="pt-2 border-t border-border/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-7 px-2"
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> Cancelling…</>
                    ) : (
                      "Cancel subscription"
                    )}
                  </Button>
                </div>
              )}

              {/* Cancel feedback */}
              {cancelStatus === "success" && (
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    Your subscription has been set to cancel at the end of your current billing period. You&apos;ll keep full access until{" "}
                    {periodEnd ?? "your period ends"}.
                  </p>
                </div>
              )}

              {cancelStatus === "error" && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2.5 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                  <p className="text-muted-foreground">
                    {cancelError || "Something went wrong. Please try again or contact support."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Sign Out ─────────────────────────────────── */}
          <Card className="border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Sign out</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You&apos;ll be redirected to the homepage.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Signing out…</>
                  ) : (
                    <><LogOut className="h-3.5 w-3.5" /> Sign out</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Legal ─────────────────────────────────── */}
          <p className="text-center text-xs text-muted-foreground/50 pb-6">
            For support, email{" "}
            <a
              href="mailto:support@oricompany.com"
              className="hover:text-muted-foreground transition-colors"
            >
              support@oricompany.com
            </a>
            . Payments processed by Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
