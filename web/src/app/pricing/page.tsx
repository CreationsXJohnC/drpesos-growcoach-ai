"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Leaf,
  Check,
  Zap,
  Crown,
  Building2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  notIncluded?: string[];
  cta: string;
  featured?: boolean;
  icon: React.ReactNode;
  badge?: string;
}

const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free Trial",
    price: "$0",
    period: "",
    description: "Try Dr. Pesos risk-free for 48 hours.",
    features: [
      "48-hour full access window",
      "3 AI questions per day",
      "Grow calendar generator (1 calendar)",
      "Environmental targets",
      "Basic cultivation guidance",
    ],
    notIncluded: [
      "Unlimited AI chat",
      "Photo plant diagnosis",
      "Progress tracking",
      "Commercial mode",
    ],
    cta: "Start Free Trial",
    icon: <Leaf className="h-5 w-5 text-muted-foreground" />,
  },
  {
    id: "grower_monthly",
    name: "Grower",
    price: "$14",
    period: "/month",
    description: "Everything a serious home grower needs.",
    features: [
      "Unlimited AI chat with Dr. Pesos",
      "Unlimited grow calendars",
      "Photo plant diagnosis",
      "Progress tracking & task history",
      "Personalized nutrient schedules",
      "Defoliation scheduling",
      "Full knowledge base access",
      "Cancel anytime",
    ],
    cta: "Get Grower Access",
    featured: true,
    icon: <Zap className="h-5 w-5 text-primary" />,
    badge: "Most Popular",
  },
  {
    id: "commercial_monthly",
    name: "Commercial",
    price: "$69",
    period: "/month",
    description: "SOP-grade guidance for licensed cultivators.",
    features: [
      "Everything in Grower",
      "Commercial SOP mode",
      "KPI tracking & batch planning",
      "Multi-room workflow support",
      "Compliance-aware guidance",
      "Priority response",
      "Commercial nutrient protocols",
      "Cancel anytime",
    ],
    cta: "Get Commercial Access",
    icon: <Building2 className="h-5 w-5 text-purple-400" />,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$127",
    period: " one-time",
    description: "Pay once. Grow forever.",
    features: [
      "Everything in Grower — forever",
      "All future updates included",
      "No monthly fees",
      "Priority support",
    ],
    cta: "Get Lifetime Access",
    icon: <Crown className="h-5 w-5 text-orange-400" />,
    badge: "Best Value",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === "free") {
      router.push("/auth/signup");
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      if (res.status === 401) {
        // Not logged in — send to signup with plan pre-selected
        router.push(`/auth/signup?plan=${planId}`);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Leaf className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">Dr. Pesos Grow Coach AI</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Heading */}
        <div className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary text-xs">
            Simple Pricing
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Grow with{" "}
            <span className="gradient-brand-text">Dr. Pesos</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From your first seed to your first harvest — expert AI guidance at every stage.
            Start free, upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Pricing grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={cn(
                "relative flex flex-col border transition-all",
                tier.featured
                  ? "border-primary/50 bg-primary/5 glow-green scale-105"
                  : "border-border/50 bg-card"
              )}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    className={cn(
                      "text-xs px-3",
                      tier.featured
                        ? "bg-primary text-primary-foreground"
                        : "bg-orange-400 text-black"
                    )}
                  >
                    {tier.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      tier.featured ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    {tier.icon}
                  </div>
                  <p className="font-semibold">{tier.name}</p>
                </div>
                <div className="mb-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>
                <p className="text-xs text-muted-foreground">{tier.description}</p>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-4">
                <ul className="space-y-2 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {tier.notIncluded?.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs opacity-40">
                      <span className="mt-0.5 shrink-0">✗</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(tier.id)}
                  disabled={loadingPlan === tier.id}
                  className={cn(
                    "w-full",
                    tier.featured ? "glow-green" : "",
                    tier.id === "free" ? "variant-outline" : ""
                  )}
                  variant={tier.id === "free" ? "outline" : "default"}
                >
                  {loadingPlan === tier.id ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                  ) : (
                    tier.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ / trust section */}
        <div className="mt-16 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            All paid plans include a 7-day money-back guarantee. Cancel anytime from your dashboard.
          </p>
          <p className="text-xs text-muted-foreground">
            Payments are processed securely by Stripe. We never store your card details.
          </p>
          <p className="text-xs text-muted-foreground/60">
            For cultivation guidance only. Check your local laws before growing cannabis.
            Dr. Pesos Grow Coach AI is not responsible for legal compliance in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
