"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Leaf,
  Camera,
  Upload,
  Loader2,
  X,
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagnosisResult {
  summary: string;
  fullAnalysis: string;
  severity: "healthy" | "minor" | "moderate" | "severe";
}

const SEVERITY_CONFIG = {
  healthy: {
    label: "Looking Healthy",
    color: "text-accent",
    border: "border-accent/30 bg-accent/5",
    icon: <CheckCircle2 className="h-4 w-4 text-accent" />,
  },
  minor: {
    label: "Minor Issue",
    color: "text-primary",
    border: "border-primary/30 bg-primary/5",
    icon: <Lightbulb className="h-4 w-4 text-primary" />,
  },
  moderate: {
    label: "Needs Attention",
    color: "text-orange-400",
    border: "border-orange-400/30 bg-orange-400/5",
    icon: <AlertTriangle className="h-4 w-4 text-orange-400" />,
  },
  severe: {
    label: "Urgent — Act Now",
    color: "text-red-400",
    border: "border-red-400/30 bg-red-400/5",
    icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
  },
};

const EXAMPLE_SYMPTOMS = [
  "Yellow leaves between veins",
  "Brown leaf tips / edges",
  "Purple stems",
  "Spots or lesions on leaves",
  "Stretching / light bleaching",
  "Wilting despite watering",
  "White powdery spots (PM)",
  "Curling / clawing leaves",
];

export default function DiagnosePage() {
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [additionalContext, setAdditionalContext] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, HEIC, etc.)");
      return;
    }
    const url = URL.createObjectURL(file);
    setImage({ url, file });
    setResult(null);
    setError("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError("");

    try {
      // Build message with image + context
      const contextPrompt = additionalContext.trim()
        ? `\n\nAdditional context from the grower: ${additionalContext.trim()}`
        : "";

      const messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: image.url },
            },
            {
              type: "text",
              text: `Please diagnose this cannabis plant photo. Identify any symptoms, nutrient deficiencies, pests, diseases, or environmental stress you can see.${contextPrompt}

Structure your response as:
1. **Diagnosis Summary** (1-2 sentences)
2. **What I See** (specific visual symptoms)
3. **Most Likely Cause** (with confidence level)
4. **Immediate Action Steps** (numbered, specific)
5. **Preventive Notes** (to avoid recurrence)

Start your response with a severity assessment: HEALTHY, MINOR, MODERATE, or SEVERE.`,
            },
          ],
        },
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, demo: false }),
      });

      if (response.status === 401) {
        setError("Please sign in to use the plant diagnosis feature.");
        return;
      }
      if (response.status === 402) {
        const data = await response.json();
        setError(
          data.reason === "trial_expired"
            ? "Your free trial has ended. Upgrade to use photo diagnosis."
            : "Daily question limit reached. Upgrade for unlimited diagnosis."
        );
        return;
      }
      if (!response.ok) throw new Error("Analysis failed");

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) fullText += parsed.text;
            } catch { /* skip */ }
          }
        }
      }

      // Parse severity from response
      const severityMatch = fullText.match(/\b(HEALTHY|MINOR|MODERATE|SEVERE)\b/i);
      const severity = (severityMatch?.[1]?.toLowerCase() ?? "moderate") as DiagnosisResult["severity"];

      // Extract summary (first sentence after severity keyword)
      const lines = fullText.split("\n").filter((l) => l.trim());
      const summaryLine = lines.find((l) =>
        l.toLowerCase().includes("diagnosis") || l.includes("**Diagnosis")
      ) ?? lines[1] ?? "";

      setResult({
        summary: summaryLine.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim(),
        fullAnalysis: fullText,
        severity,
      });
    } catch (err) {
      console.error("Diagnosis error:", err);
      setError("Something went wrong analyzing your photo. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
    setResult(null);
    setError("");
    setAdditionalContext("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Leaf className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold hidden sm:block">
              Dr. Pesos Grow Coach AI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            </Link>
            <Badge variant="outline" className="border-accent/30 text-accent text-xs">
              <Camera className="mr-1 h-3 w-3" />
              Plant Diagnosis
            </Badge>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Diagnose My Plant</h1>
          <p className="text-muted-foreground mt-1">
            Upload a clear photo of your plant and Dr. Pesos will identify symptoms,
            diagnose the issue, and give you a corrective action plan.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main panel */}
          <div className="space-y-4">
            {/* Upload zone */}
            {!image ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all",
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                  capture="environment"
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold mb-1">Upload a plant photo</p>
                <p className="text-sm text-muted-foreground text-center">
                  Drag & drop or tap to select · JPG, PNG, HEIC
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  On mobile, you can take a photo directly
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/50 overflow-hidden">
                {/* Image preview */}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt="Plant to diagnose"
                    className="w-full max-h-80 object-contain bg-black"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Context input */}
                {!result && (
                  <div className="p-4 border-t border-border/50">
                    <label className="text-sm font-medium mb-2 block">
                      Describe what you&apos;re seeing (optional)
                    </label>
                    <textarea
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="e.g. Yellow spots appeared 2 days ago, week 3 of flower, using coco + AN nutrients..."
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="mt-3 w-full glow-green gap-2"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Dr. Pesos is analyzing...</>
                      ) : (
                        <><Camera className="h-4 w-4" /> Diagnose This Plant</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
                {(error.includes("trial") || error.includes("limit")) && (
                  <Link href="/pricing">
                    <Button size="sm" className="mt-2 glow-green">
                      View Plans →
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-4">
                {/* Severity banner */}
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4",
                    SEVERITY_CONFIG[result.severity].border
                  )}
                >
                  {SEVERITY_CONFIG[result.severity].icon}
                  <div>
                    <p
                      className={cn(
                        "font-semibold text-sm",
                        SEVERITY_CONFIG[result.severity].color
                      )}
                    >
                      {SEVERITY_CONFIG[result.severity].label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.summary}
                    </p>
                  </div>
                </div>

                {/* Full analysis */}
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <ScrollArea className="max-h-[500px]">
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result.fullAnalysis}
                        </ReactMarkdown>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Diagnose Another Plant
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">Tips for Best Results</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Use natural or bright white light — avoid blurple LED
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Focus on the affected leaf — get close
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Include both top and underside if possible
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Add context: week in grow, medium, nutrients
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    Multiple photos = better diagnosis accuracy
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">Common Symptoms</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_SYMPTOMS.map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setAdditionalContext((prev) =>
                          prev ? `${prev}, ${s}` : s
                        )
                      }
                      className="rounded-full border border-border/50 px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
