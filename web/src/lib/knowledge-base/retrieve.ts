// RAG retrieval — embeds a query and fetches the top-N most relevant knowledge chunks

import { createAdminClient } from "@/lib/supabase/server";

export interface KnowledgeChunk {
  id: string;
  title: string;
  content: string;
  similarity: number;
}

/**
 * Generate an embedding vector for a given text using the Anthropic API.
 * Note: As of late 2024, Anthropic does not offer a native embeddings API.
 * We use a lightweight Claude call that requests a structured similarity-optimized
 * vector representation. For production, swap this with OpenAI text-embedding-3-small
 * or Voyage AI voyage-large-2-instruct (Anthropic-recommended).
 *
 * This implementation uses OpenAI embeddings via fetch for maximum compatibility.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    // Use OpenAI embeddings (text-embedding-3-small, 1536 dimensions)
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8191), // max tokens
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding error: ${response.statusText}`);
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    return data.data[0].embedding;
  }

  // Fallback: Use Claude to generate a pseudo-embedding
  // This is NOT a real embedding — it's a workaround for systems without OpenAI access.
  // For production RAG, configure OPENAI_API_KEY.
  console.warn("OPENAI_API_KEY not set — RAG retrieval disabled. Set OPENAI_API_KEY for knowledge base search.");
  return [];
}

/**
 * Retrieve the top-N most relevant knowledge chunks for a given query.
 * Returns empty array if embeddings are not configured.
 */
export async function retrieveKnowledge(
  query: string,
  matchCount: number = 3
): Promise<KnowledgeChunk[]> {
  try {
    const embedding = await generateEmbedding(query);

    if (embedding.length === 0) {
      return [];
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("match_knowledge", {
      query_embedding: embedding,
      match_count: matchCount,
    });

    if (error) {
      console.error("Knowledge retrieval error:", error);
      return [];
    }

    return (data as KnowledgeChunk[]) ?? [];
  } catch (err) {
    console.error("RAG retrieval failed:", err);
    return [];
  }
}

/**
 * Format retrieved knowledge chunks into a context block for Claude's system prompt.
 */
export function formatKnowledgeContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return "";

  const context = chunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.title}]\n${chunk.content}`
    )
    .join("\n\n---\n\n");

  return `\n\n====================================================================
RELEVANT KNOWLEDGE BASE CONTEXT
====================================================================
The following sections from the We Grow Life cultivation guidebook are relevant to this question. Use this knowledge to inform your response, citing specific guidance where applicable.

${context}
====================================================================`;
}
