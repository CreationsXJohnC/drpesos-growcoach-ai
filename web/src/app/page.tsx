import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays,
  Camera,
  BarChart3,
  Zap,
  ArrowRight,
  CheckCircle2,
  Star,
  Building2,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiChat } from "@/components/ai-chat";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AiChat />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg">
              <Image
                src="/Ori-Badge02.png"
                alt="Dr. Pesos"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden min-[1166px]:block text-base font-bold whitespace-nowrap">Dr. Pesos Grow Coach AI</span>
          </div>
          <div className="hidden items-center gap-6 text-sm md:flex">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button size="sm" className="glow-green" asChild>
              <Link href="/auth/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-150 w-150 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-100 w-100 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-16">

            {/* Left: Text content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Dr. Pesos wordmark */}
              <div className="mx-auto mb-6 relative h-14 w-52 lg:mx-0">
                <Image
                  src="/Dr.%20Pesos%20Text.png"
                  alt="Dr. Pesos"
                  fill
                  className="object-contain object-center lg:object-left"
                  priority
                />
              </div>

              <Badge
                variant="outline"
                className="mb-6 border-primary/30 bg-primary/5 text-primary"
              >
                <Zap className="mr-1.5 h-3 w-3" />
                Powered by Ori Company · We Grow Life
              </Badge>

              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight min-[401px]:text-3xl min-[503px]:text-4xl sm:text-5xl lg:text-5xl xl:text-6xl">
                Grow Smarter With{" "}
                <span className="min-[401px]:block min-[503px]:inline min-[516px]:block min-[796px]:inline lg:block">
                  <span className="gradient-brand-text">Dr. Pesos</span>
                  {" "}Grow Coach AI
                </span>
              </h1>

              <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl lg:mx-0">
                Your personal AI cultivation assistant — diagnosing plant issues,
                building optimized grow plans, and guiding you through every stage
                from seed to cure. Beginner-friendly, pro-level insights. Available
                24/7.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Button size="lg" className="glow-green text-base px-8" asChild>
                  <Link href="/auth/signup">
                    Start Your Free 48-Hour Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8" asChild>
                  <Link href="/demo-access">View Live Demo</Link>
                </Button>
              </div>

              <p className="mt-4 text-sm text-muted-foreground text-center lg:text-left">
                No credit card required for trial · 10 questions/day · Full access after upgrade
              </p>
            </div>

            {/* Dr. Pesos character — below text on mobile, right of text on desktop */}
            <div className="flex justify-center lg:shrink-0 lg:items-center lg:justify-center">
              <div className="relative h-64 w-52 lg:h-96 lg:w-64 xl:h-120 xl:w-90">
                <Image
                  src="/Dr.%20Pesos%20PeaceSign%20notext.png"
                  alt="Dr. Pesos"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>

          </div>
        </div>

        {/* Hero chat preview */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border/50 bg-card/50 px-5 py-4">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-primary/60" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="relative h-4 w-4 overflow-hidden rounded-full">
                  <Image
                    src="/Dr.%20Pesos%20GreenTee%20notext.png"
                    alt="Dr. Pesos"
                    fill
                    className="object-contain"
                  />
                </div>
                Dr. Pesos Grow Coach AI — powered by Claude
              </div>
            </div>
            {/* Simulated chat */}
            <div className="space-y-4 p-5">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  My leaves are yellowing at week 5 of flower. What&apos;s going on?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                  <Image
                    src="/Dr.%20Pesos%20GreenTee%20notext.png"
                    alt="Dr. Pesos"
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm">
                  <p className="font-medium text-primary mb-1">Here&apos;s what your plant is telling us...</p>
                  <p className="text-muted-foreground mb-2">Yellowing at week 5 of flower is most often <strong>natural senescence</strong> — your plant is finishing and redirecting nutrients upward.</p>
                  <p className="font-medium mb-1">Action Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Check if yellowing starts from <strong>lower leaves only</strong> — if so, it&apos;s normal</li>
                    <li>Confirm your pH is 6.0–7.0 (soil) or 5.5–6.5 (coco/hydro)</li>
                    <li>Check trichomes — at week 5, you may be 2–3 weeks from harvest</li>
                  </ol>
                  <p className="mt-2 text-muted-foreground text-xs italic">Want me to build a full flush and harvest timeline for your setup?</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 bg-card/30">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
              Features
            </Badge>
            <h2 className="text-4xl font-bold">Everything You Need to Grow Like a Pro</h2>
            <p className="mt-4 text-muted-foreground">
              Powered by Ori Company&apos;s We Grow Life methodology — built for beginners and commercial cultivators alike.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Leaf className="h-6 w-6 text-primary" />}
              title="Dr. Pesos AI Chat"
              description="Ask anything about your grow — get structured, accurate, encouraging responses 24/7. Photo upload included for instant plant diagnosis."
              glow="green"
            />
            <FeatureCard
              icon={<CalendarDays className="h-6 w-6 text-primary" />}
              title="Custom Grow Calendar"
              description="Answer 6 questions about your setup and get a personalized week-by-week calendar with daily tasks, nutrient schedules, and Dr. Pesos' signature defoliation timing."
              glow="green"
              featured
            />
            <FeatureCard
              icon={<Camera className="h-6 w-6 text-accent" />}
              title="Photo Plant Diagnosis"
              description="Upload a photo of your plant and get an instant analysis — symptom patterns, probable causes, corrective actions, and preventive notes."
              glow="purple"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-primary" />}
              title="Progress Tracking"
              description="Check off daily tasks, track your environmental readings, and watch your grow progress week by week — all saved to your dashboard."
              glow="green"
            />
            <FeatureCard
              icon={<Building2 className="h-6 w-6 text-accent" />}
              title="Commercial Mode"
              description="Automatic SOP-style formatting, KPI tracking, batch workflow design, and staffing SOPs for licensed commercial cultivators."
              glow="purple"
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-primary" />}
              title="Expandable Knowledge Base"
              description="Built on the 16-chapter We Grow Life indoor cultivation guidebook — with support for adding new SOPs, websites, and research sources over time."
              glow="green"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
              Pricing
            </Badge>
            <h2 className="text-4xl font-bold">Start Free. Scale When Ready.</h2>
            <p className="mt-4 text-muted-foreground">
              48-hour full-access trial. No credit card required.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <PricingCard
              tier="Free Trial"
              price="$0"
              period="48 hours"
              features={["10 questions/day", "Full AI chat access", "Sample grow calendar", "No credit card"]}
              cta="Start Free Trial"
              href="/auth/signup"
            />
            <PricingCard
              tier="Grower"
              price="$5"
              period="/month"
              features={["Unlimited AI chat", "Full grow calendar", "Photo diagnosis", "Progress tracking", "Priority responses"]}
              cta="Get Started"
              href="/auth/signup?plan=grower"
              featured
            />
            <PricingCard
              tier="Commercial"
              price="$20"
              period="/month"
              features={["Everything in Grower", "SOP-style responses", "KPI & workflow plans", "Batch management", "Staff training SOPs"]}
              cta="Go Commercial"
              href="/auth/signup?plan=commercial"
            />
            <PricingCard
              tier="Lifetime"
              price="$125"
              period="one-time"
              features={["Grower tier forever", "All future updates", "Priority support", "Early feature access"]}
              cta="Get Lifetime Access"
              href="/auth/signup?plan=lifetime"
            />
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="px-6 py-20 bg-card/30">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <blockquote className="text-2xl font-medium text-foreground/90">
            &ldquo;Grow clean, healthy, high-quality cannabis with simple, step-by-step guidance.&rdquo;
          </blockquote>
          <p className="mt-4 text-muted-foreground font-medium">— Dr. Pesos, Ori Company · We Grow Life</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Grow Smarter?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join cultivators using Dr. Pesos Grow Coach AI to get consistent, high-quality results every grow.
          </p>
          <Button size="lg" className="glow-green text-base px-10" asChild>
            <Link href="/auth/signup">
              Start Your Free 48-Hour Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="relative h-16 w-32 shrink-0">
              <Image
                src="/Dr.%20Pesos%20Text.png"
                alt="Dr. Pesos"
                fill
                className="object-contain object-left"
              />
            </div>
            <span>· Ori Company · We Grow Life</span>
          </div>
          <p>For cultivation guidance only. Check local laws before growing.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  glow,
  featured,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  glow: "green" | "purple";
  featured?: boolean;
}) {
  return (
    <Card
      className={`border-border/50 bg-card transition-all duration-200 hover:-translate-y-1 ${
        featured ? "border-primary/40 glow-green" : ""
      }`}
    >
      <CardHeader>
        <div
          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
            glow === "green" ? "bg-primary/10" : "bg-accent/10"
          }`}
        >
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  tier,
  price,
  period,
  features,
  cta,
  href,
  featured,
}: {
  tier: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <Card
      className={`relative flex flex-col border-border/50 bg-card ${
        featured ? "border-primary/50 glow-green" : ""
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground text-xs px-3">Most Popular</Badge>
        </div>
      )}
      <CardHeader>
        <p className="text-sm text-muted-foreground">{tier}</p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-sm text-muted-foreground mb-1">{period}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="flex-1 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          variant={featured ? "default" : "outline"}
          className={`w-full ${featured ? "glow-green" : ""}`}
          asChild
        >
          <Link href={href}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
