import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL, MAX_TOKENS } from "@/lib/ai/anthropic";
import { DR_PESOS_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { retrieveKnowledge, formatKnowledgeContext } from "@/lib/knowledge-base/retrieve";
import { createServerClient } from "@supabase/ssr";
import { checkAndIncrementQuestion } from "@/lib/supabase/queries";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const maxDuration = 60;

interface IncomingMessage {
  role: "user" | "assistant";
  content:
    | string
    | Array<{
        type: string;
        text?: string;
        source?: { type: string; url: string };
      }>;
}

function toAnthropicContent(
  msg: IncomingMessage
): Anthropic.MessageParam["content"] {
  if (typeof msg.content === "string") return msg.content;

  const blocks: Anthropic.ContentBlockParam[] = msg.content.map((block) => {
    if (block.type === "image" && block.source?.url) {
      return {
        type: "image",
        source: { type: "url", url: block.source.url },
      } as Anthropic.ContentBlockParam;
    }
    return { type: "text", text: block.text ?? "" };
  });

  return blocks;
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch { /* Server Component context — safe to ignore */ }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Allow unauthenticated users through only if demo mode is flagged
    const body = await req.json();
    const { messages, growContext, demo } = body as {
      messages: IncomingMessage[];
      growContext?: { stage?: string; week?: number; strainType?: string };
      demo?: boolean;
    };

    if (!user && !demo) {
      return new Response(
        JSON.stringify({ error: "unauthorized", message: "Please sign in to chat with Dr. Pesos." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Trial / subscription gating (skip for demo mode) ────────────
    if (user && !demo) {
      const gate = await checkAndIncrementQuestion(user.id);
      if (!gate.allowed) {
        return new Response(
          JSON.stringify({
            error: "upgrade_required",
            reason: gate.reason,
            message:
              gate.reason === "trial_expired"
                ? "Your 48-hour free trial has ended. Upgrade to continue chatting with Dr. Pesos."
                : "You've reached today's 3-question limit. Upgrade for unlimited access.",
          }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── RAG: retrieve relevant knowledge for the last user message ──────
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    const queryText =
      typeof lastUserMessage?.content === "string"
        ? lastUserMessage.content
        : (lastUserMessage?.content as Array<{ text?: string }>)
            ?.map((b) => b.text ?? "")
            .join(" ") ?? "";

    const knowledgeChunks = await retrieveKnowledge(queryText, 3);
    const knowledgeContext = formatKnowledgeContext(knowledgeChunks);

    // ── Build system prompt with RAG context + optional grow context ─────
    let systemPrompt = DR_PESOS_SYSTEM_PROMPT + knowledgeContext;
    if (growContext) {
      systemPrompt += `\n\n====================================================================
USER'S CURRENT GROW CONTEXT
====================================================================
The user is currently in the following grow stage — tailor your responses accordingly:
• Stage: ${growContext.stage ?? "Unknown"}
• Week: ${growContext.week != null ? `Week ${growContext.week}` : "Unknown"}
• Strain type: ${growContext.strainType ?? "Unknown"}`;
    }

    const anthropicMessages: Anthropic.MessageParam[] = messages
      .filter((m) => m.role !== ("system" as never))
      .map((m) => ({
        role: m.role,
        content: toAnthropicContent(m),
      }));

    const client = getAnthropicClient();
    const stream = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
