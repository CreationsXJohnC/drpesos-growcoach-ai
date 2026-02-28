// Load .env.local before anything else (tsx doesn't load Next.js env conventions automatically)
import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * RAG Ingest Script — converts chapter markdown files AND PDFs to embeddings and stores in Supabase
 *
 * Usage (run from web/ directory):
 *   npm run ingest-knowledge
 *
 * Sources ingested:
 *   - src/lib/knowledge-base/chapters/*.md
 *     ↳ 16 Dr. Pesos guidebook chapters (always ingested)
 *
 *   - src/lib/knowledge-base/pdfs/CommercialCultivation/*.pdf
 *     ↳ Commercial cultivation SOPs, policies, crop steering, environment guidelines
 *     ↳ Tagged: source_category = "commercial"
 *
 *   - src/lib/knowledge-base/pdfs/HomeCultivation/*.pdf
 *     ↳ Home cultivation guides, nutrient charts, daily SOPs
 *     ↳ Tagged: source_category = "home"
 *
 *   - src/lib/knowledge-base/pdfs/*.pdf  (top-level, no subcategory)
 *     ↳ Tagged: source_category = "general"
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import pdfParse from "pdf-parse";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const CHAPTERS_DIR = path.join(__dirname, "chapters");
const PDFS_DIR = path.join(__dirname, "pdfs");
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Text chunking ─────────────────────────────────────────────────────────────

function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";

  for (const para of paragraphs) {
    if ((current + "\n\n" + para).length <= chunkSize) {
      current = current ? `${current}\n\n${para}` : para;
    } else {
      if (current) {
        chunks.push(current.trim());
        current = current.slice(-overlap) + "\n\n" + para;
      } else {
        const sentences = para.match(/[^.!?]+[.!?]+/g) ?? [para];
        for (const s of sentences) {
          if ((current + " " + s).length <= chunkSize) {
            current = current ? `${current} ${s}` : s;
          } else {
            if (current) chunks.push(current.trim());
            current = s;
          }
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ── Embedding ─────────────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8191) }),
  });

  if (!response.ok) throw new Error(`OpenAI embedding error: ${await response.text()}`);
  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseMarkdown(filePath: string): { title: string; content: string } {
  const raw = fs.readFileSync(filePath, "utf-8");
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] ?? path.basename(filePath, ".md");
  return { title, content: raw };
}

async function parsePdf(filePath: string): Promise<{ title: string; content: string }> {
  const buffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(buffer);
  const content = parsed.text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  const filename = path.basename(filePath, ".pdf");
  const title = filename.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { title, content };
}

// ── Source discovery ──────────────────────────────────────────────────────────

interface SourceDoc {
  title: string;
  content: string;
  sourceType: string;     // "chapter" | "pdf"
  sourceCategory: string; // "commercial" | "home" | "general" | "chapter"
  filename: string;
}

function discoverPdfSources(dir: string): SourceDoc[] {
  if (!fs.existsSync(dir)) return [];
  const docs: SourceDoc[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Subdirectory — determine category from folder name
      const folderName = entry.name.toLowerCase();
      let sourceCategory = "general";
      if (folderName.includes("commercial")) sourceCategory = "commercial";
      else if (folderName.includes("home")) sourceCategory = "home";

      const subDir = path.join(dir, entry.name);
      const files = fs.readdirSync(subDir).filter((f) => f.endsWith(".pdf"));
      for (const file of files) {
        docs.push({
          title: "", // populated after async parse
          content: "",
          sourceType: "pdf",
          sourceCategory,
          filename: path.join(subDir, file),
        });
      }
    } else if (entry.isFile() && entry.name.endsWith(".pdf")) {
      docs.push({
        title: "",
        content: "",
        sourceType: "pdf",
        sourceCategory: "general",
        filename: path.join(dir, entry.name),
      });
    }
  }
  return docs;
}

// ── Ingest ────────────────────────────────────────────────────────────────────

async function ingestDoc(doc: SourceDoc): Promise<{ total: number; success: number }> {
  const chunks = chunkText(doc.content);
  let success = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkTitle = `${doc.title} (Part ${i + 1}/${chunks.length})`;
    try {
      const embedding = await generateEmbedding(chunks[i]);

      // Delete existing chunk with same title first (clean re-run support)
      await supabase.from("knowledge_sources").delete().eq("title", chunkTitle);

      const { error } = await supabase.from("knowledge_sources").insert({
        title: chunkTitle,
        source_type: doc.sourceType,
        content: chunks[i],
        embedding,
        metadata: {
          source_category: doc.sourceCategory,
          source_title: doc.title,
          chunk_index: i,
          total_chunks: chunks.length,
          filename: path.basename(doc.filename),
        },
      });

      if (error) {
        console.error(`      ❌ Chunk ${i + 1} error:`, error.message);
      } else {
        success++;
        process.stdout.write(`      ✓ ${i + 1}/${chunks.length} embedded\r`);
      }

      await new Promise((r) => setTimeout(r, 150)); // rate limit
    } catch (err) {
      console.error(`      ❌ Chunk ${i + 1} failed:`, err);
    }
  }
  return { total: chunks.length, success };
}

async function ingest() {
  console.log("\n🌱 Dr. Pesos Knowledge Base Ingestion");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let grandTotal = 0;
  let grandSuccess = 0;

  // ── 1. Markdown chapters ───────────────────────────────────────────────────
  if (fs.existsSync(CHAPTERS_DIR)) {
    const files = fs.readdirSync(CHAPTERS_DIR).filter((f) => f.endsWith(".md")).sort();
    console.log(`📚 Guidebook Chapters (${files.length} files)`);

    for (const file of files) {
      const { title, content } = parseMarkdown(path.join(CHAPTERS_DIR, file));
      console.log(`\n   📄 ${title}`);
      const { total, success } = await ingestDoc({
        title, content, sourceType: "chapter", sourceCategory: "chapter", filename: file,
      });
      grandTotal += total;
      grandSuccess += success;
      console.log(`      ✓ Complete (${success}/${total} chunks)`);
    }
  }

  // ── 2. PDF sources (subdirectories + top-level) ───────────────────────────
  const pdfStubs = discoverPdfSources(PDFS_DIR);

  if (pdfStubs.length === 0) {
    console.log("\n📎 PDFs: No PDF files found");
  } else {
    // Group by category for clean output
    const categories = [...new Set(pdfStubs.map((d) => d.sourceCategory))].sort();
    for (const category of categories) {
      const catDocs = pdfStubs.filter((d) => d.sourceCategory === category);
      console.log(`\n📎 PDFs / ${category.charAt(0).toUpperCase() + category.slice(1)} (${catDocs.length} files)`);

      for (const stub of catDocs) {
        try {
          const { title, content } = await parsePdf(stub.filename);
          stub.title = title;
          stub.content = content;
          console.log(`\n   📄 ${title}`);
          const { total, success } = await ingestDoc(stub);
          grandTotal += total;
          grandSuccess += success;
          console.log(`      ✓ Complete (${success}/${total} chunks)`);
        } catch (err) {
          console.error(`   ❌ Failed to parse ${path.basename(stub.filename)}:`, err);
        }
      }
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Ingestion complete!`);
  console.log(`   Total chunks: ${grandTotal}`);
  console.log(`   Embedded:     ${grandSuccess}`);
  if (grandTotal - grandSuccess > 0) {
    console.log(`   Failed:       ${grandTotal - grandSuccess}`);
  }
  console.log("");
}

ingest().catch(console.error);
