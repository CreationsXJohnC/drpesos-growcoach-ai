/**
 * API client for Dr. Pesos web app endpoints.
 * The mobile app calls the Next.js API routes deployed on Vercel.
 */

// Replace this with your actual Vercel deployment URL
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://drpesos.vercel.app";

export interface ChatMessage {
  role: "user" | "assistant";
  content:
    | string
    | Array<{ type: string; text?: string; source?: { type: string; url: string } }>;
}

export interface GrowContext {
  stage?: string;
  week?: number;
  strainType?: string;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

/**
 * Sends messages to /api/chat and returns an async generator
 * that yields text chunks as they stream in.
 */
export async function* streamChat(
  messages: ChatMessage[],
  token: string,
  growContext?: GrowContext
): AsyncGenerator<string, void, unknown> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `sb-access-token=${token}`,
    },
    body: JSON.stringify({ messages, growContext }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? "Chat request failed"), {
      status: res.status,
      reason: err.reason,
      errorCode: err.error,
    });
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) yield parsed.text;
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

// ── Grow Calendar ─────────────────────────────────────────────────────────────

export interface GrowSetup {
  experienceLevel: string;
  strainType: string;
  medium: string;
  lightType: string;
  spaceSize: string;
  startDate: string;
  goals: string[];
  currentStage?: string;
  currentDayInStage?: number;
}

export async function generateCalendar(setup: GrowSetup, token: string) {
  const res = await fetch(`${API_BASE_URL}/api/generate-calendar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Cookie: `sb-access-token=${token}`,
    },
    body: JSON.stringify(setup),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? "Calendar generation failed"), {
      status: res.status,
      reason: err.reason,
      errorCode: err.error,
    });
  }

  return res.json();
}
