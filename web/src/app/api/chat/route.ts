import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient, CLAUDE_MODEL, MAX_TOKENS } from "@/lib/ai/anthropic";
import { DR_PESOS_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { NextRequest } from "next/server";

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
    const body = await req.json();
    const { messages, growContext } = body as {
      messages: IncomingMessage[];
      growContext?: { stage?: string; week?: number; strainType?: string };
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build system prompt with optional grow context injection
    let systemPrompt = DR_PESOS_SYSTEM_PROMPT;
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
