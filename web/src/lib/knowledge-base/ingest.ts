/**
 * RAG Ingest Script — converts chapter markdown files to embeddings and stores in Supabase
 *
 * Usage (run from web/ directory):
 *   npx tsx src/lib/knowledge-base/ingest.ts
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const CHAPTERS_DIR = path.join(__dirname, "chapters");
const CHUNK_SIZE = 1500; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error(
    "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface ChapterChunk {
  title: string;
  content: string;
  chapterNumber: number;
  chunkIndex: number;
}

/**
 * Split a long document into overlapping chunks for better retrieval granularity.
 */
function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];

  // First, try to split on paragraph boundaries
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        // Include overlap from end of previous chunk
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + "\n\n" + para;
      } else {
        // Single paragraph longer than chunk size — split by sentences
        const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
        for (const sentence of sentences) {
          if ((currentChunk + " " + sentence).length <= chunkSize) {
            currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
          } else {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generate an embedding vector using OpenAI's text-embedding-3-small.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8191),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embedding error: ${err}`);
  }

  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

/**
 * Parse a markdown chapter file and extract title + content.
 */
function parseChapter(filePath: string): { title: string; content: string; chapterNumber: number } {
  const raw = fs.readFileSync(filePath, "utf-8");
  const filename = path.basename(filePath, ".md");
  const chapterNumber = parseInt(filename.split("-")[0], 10) || 0;

  // Extract H1 title
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] ?? filename;

  return { title, content: raw, chapterNumber };
}

/**
 * Main ingest function — reads all chapters, chunks them, embeds, and upserts to Supabase.
 */
async function ingest() {
  console.log("🌱 Dr. Pesos Knowledge Base Ingestion Starting...\n");

  if (!fs.existsSync(CHAPTERS_DIR)) {
    console.error(`Chapters directory not found: ${CHAPTERS_DIR}`);
    process.exit(1);
  }

  const chapterFiles = fs
    .readdirSync(CHAPTERS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  console.log(`Found ${chapterFiles.length} chapters to ingest.\n`);

  let totalChunks = 0;
  let successfulChunks = 0;

  for (const file of chapterFiles) {
    const filePath = path.join(CHAPTERS_DIR, file);
    const { title, content, chapterNumber } = parseChapter(filePath);
    const chunks = chunkText(content);

    console.log(`📖 Chapter ${chapterNumber}: ${title}`);
    console.log(`   ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkTitle = `${title} (Part ${i + 1}/${chunks.length})`;
      totalChunks++;

      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk);

        // Upsert into Supabase (update if already exists based on title)
        const { error } = await supabase.from("knowledge_sources").upsert(
          {
            title: chunkTitle,
            source_type: "chapter",
            content: chunk,
            embedding,
            metadata: {
              chapter_number: chapterNumber,
              chunk_index: i,
              total_chunks: chunks.length,
              file: file,
            },
          },
          { onConflict: "title" }
        );

        if (error) {
          console.error(`   ❌ Chunk ${i + 1} error:`, error.message);
        } else {
          successfulChunks++;
          process.stdout.write(`   ✓ Chunk ${i + 1}/${chunks.length} embedded\r`);
        }

        // Rate limit: ~150ms between requests to stay within OpenAI rate limits
        await new Promise((r) => setTimeout(r, 150));
      } catch (err) {
        console.error(`   ❌ Chunk ${i + 1} failed:`, err);
      }
    }
    console.log(`   ✓ Completed (${chunks.length} chunks)\n`);
  }

  console.log(`\n✅ Ingestion complete!`);
  console.log(`   Total chunks processed: ${totalChunks}`);
  console.log(`   Successfully ingested: ${successfulChunks}`);
  console.log(`   Failed: ${totalChunks - successfulChunks}`);
}

ingest().catch(console.error);
