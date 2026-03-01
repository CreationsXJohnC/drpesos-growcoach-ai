"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Leaf,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  Zap,
  CalendarDays,
  MessageCircle,
  Camera,
} from "lucide-react";

export default function DemoAccessPage() {
  const [form, setForm] = useState({ email: "", name: "", company: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/demo-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }

      // Redirect user directly to the demo via their magic link
      if (data.url) {
        setStatus("success");
        setTimeout(() => {
          window.location.href = data.url;
        }, 800);
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Minimal nav */}
      <nav className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-primary/10">
              <Leaf className="absolute inset-0 m-auto h-4 w-4 text-primary" />
              <Image
                src="/Ori-Badge02.png"
                alt="Dr. Pesos"
                fill
                className="object-contain p-0.5"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <span className="text-sm font-semibold hidden sm:block">Dr. Pesos Grow Coach AI</span>
          </Link>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">
            <Lock className="mr-1 h-3 w-3" />
            Investor Preview
          </Badge>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            {/* Left — value proposition */}
            <div className="space-y-8">
              <div>
                <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary text-xs">
                  <Zap className="mr-1 h-3 w-3" />
                  Exclusive Investor Preview — Powered by Ori Company
                </Badge>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                  See the Full{" "}
                  <span className="gradient-brand-text">Dr. Pesos</span>{" "}
                  Experience
                </h1>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Get instant access to the complete Dr. Pesos Grow Coach AI platform —
                  no trial limits, no sign-up friction. Personalized AI cultivation
                  guidance, live grow calendars, and plant diagnosis, all in one app.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="space-y-3">
                {[
                  { icon: <CalendarDays className="h-4 w-4 text-primary" />, text: "14-week personalized grow calendar — see the full feature live" },
                  { icon: <MessageCircle className="h-4 w-4 text-primary" />, text: "Unlimited AI chat with Dr. Pesos, powered by Claude claude-sonnet-4-6" },
                  { icon: <Camera className="h-4 w-4 text-accent" />, text: "Photo plant diagnosis — upload a leaf, get expert analysis instantly" },
                  { icon: <Zap className="h-4 w-4 text-accent" />, text: "Full platform access — no paywalls, no trial countdowns" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {icon}
                    </div>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>

              {/* Dr. Pesos character */}
              <div className="relative hidden lg:block h-48 w-40">
                <Image
                  src="/Dr.%20Pesos%20PeaceSign%20notext.png"
                  alt="Dr. Pesos"
                  fill
                  className="object-contain object-left drop-shadow-xl"
                />
              </div>
            </div>

            {/* Right — form */}
            <div>
              <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-xl">
                {status === "success" ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Access granted!</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Redirecting you to the live demo…
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading Dr. Pesos…
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold">Request Preview Access</h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Enter your details for instant access. No password needed.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Email Address <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@company.com"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Your Name <span className="text-muted-foreground/50">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="First and last name"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          Company / Fund <span className="text-muted-foreground/50">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          placeholder="Company or fund name"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                        />
                      </div>

                      {status === "error" && error && (
                        <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
                          {error}
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={status === "loading" || !form.email}
                        className="w-full glow-green gap-2 mt-2"
                        size="lg"
                      >
                        {status === "loading" ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Getting your access…</>
                        ) : (
                          <>Get Instant Access <ArrowRight className="h-4 w-4" /></>
                        )}
                      </Button>
                    </form>

                    <div className="mt-5 space-y-2 border-t border-border/40 pt-4">
                      <p className="text-center text-xs text-muted-foreground/60">
                        Your information is kept private. We&apos;ll only reach out if you&apos;d like to continue the conversation.
                      </p>
                      <p className="text-center text-xs text-muted-foreground/40">
                        Powered by Ori Company · We Grow Life
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
