/**
 * Item 28: RAG Knowledge Base
 *
 * Retrieval-Augmented Generation for agent Q&A:
 *   - Upload product docs, FAQs, pricing pages, blog posts
 *   - Chunk → embed → store in Supabase (pgvector)
 *   - Query: user question → embed → find relevant chunks → feed to LLM
 *   - Used by: Demo agents (chat + voice), support, qualification agent
 *
 * Embedding: OpenAI text-embedding-3-small (~$0.02/1M tokens)
 * Storage: Supabase pgvector extension
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KnowledgeDocument {
  id: string;
  userId: string;
  title: string;
  source: string; // url, file, manual
  content: string;
  chunkCount: number;
  status: "processing" | "ready" | "error";
  createdAt: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: {
    title: string;
    source: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface RAGResult {
  answer: string;
  sources: Array<{
    title: string;
    content: string;
    relevance: number;
  }>;
  confidence: number;
}

// ─── Text Chunking ──────────────────────────────────────────────────────────

function chunkText(text: string, maxChunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + " " + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      // Keep overlap
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(" ") + " " + sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ─── Generate Embeddings ────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Batch in groups of 100
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch,
    });
    results.push(...response.data.map((d) => d.embedding));
  }

  return results;
}

// ─── Ingest Document ────────────────────────────────────────────────────────

export async function ingestDocument(
  userId: string,
  params: {
    title: string;
    content: string;
    source?: string;
  }
): Promise<KnowledgeDocument> {
  const supabase = getAdmin();

  // Create document record
  const { data: doc } = await supabase
    .from("knowledge_documents")
    .insert({
      user_id: userId,
      title: params.title,
      source: params.source || "manual",
      content: params.content,
      chunk_count: 0,
      status: "processing",
    })
    .select("id, created_at")
    .single();

  if (!doc) throw new Error("Failed to create document");

  try {
    // Chunk the text
    const chunks = chunkText(params.content);

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);

    // Store chunks with embeddings
    const chunkRecords = chunks.map((content, i) => ({
      document_id: doc.id,
      user_id: userId,
      content,
      embedding: JSON.stringify(embeddings[i]),
      metadata: {
        title: params.title,
        source: params.source || "manual",
        chunkIndex: i,
        totalChunks: chunks.length,
      },
    }));

    await supabase.from("knowledge_chunks").insert(chunkRecords);

    // Update document status
    await supabase
      .from("knowledge_documents")
      .update({ status: "ready", chunk_count: chunks.length })
      .eq("id", doc.id);

    return {
      id: doc.id,
      userId,
      title: params.title,
      source: params.source || "manual",
      content: params.content,
      chunkCount: chunks.length,
      status: "ready",
      createdAt: doc.created_at,
    };
  } catch (err) {
    await supabase
      .from("knowledge_documents")
      .update({ status: "error" })
      .eq("id", doc.id);
    throw err;
  }
}

// ─── Query Knowledge Base (RAG) ─────────────────────────────────────────────

export async function queryKnowledgeBase(
  userId: string,
  question: string,
  options?: {
    topK?: number;
    minRelevance?: number;
    documentIds?: string[];
  }
): Promise<RAGResult> {
  const supabase = getAdmin();
  const topK = options?.topK || 5;
  const minRelevance = options?.minRelevance || 0.3;

  // Generate embedding for the question
  const questionEmbedding = await generateEmbedding(question);

  // Search for similar chunks using cosine similarity
  // Note: Requires pgvector extension in Supabase
  let chunks: unknown[] | null = null;
  try {
    const rpcResult = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: JSON.stringify(questionEmbedding),
      match_threshold: minRelevance,
      match_count: topK,
      p_user_id: userId,
    });
    chunks = rpcResult.data;
  } catch {
    // Fallback: if RPC doesn't exist, basic search below
    chunks = null;
  }

  // If pgvector isn't set up, fall back to keyword search
  let relevantChunks: Array<{ content: string; metadata: Record<string, unknown>; similarity: number }> = [];

  if (chunks && chunks.length > 0) {
    relevantChunks = chunks as typeof relevantChunks;
  } else {
    // Basic keyword fallback
    const keywords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const { data: fallback } = await supabase
      .from("knowledge_chunks")
      .select("content, metadata")
      .eq("user_id", userId)
      .limit(topK);

    relevantChunks = (fallback || [])
      .filter((c) => keywords.some((k) => c.content.toLowerCase().includes(k)))
      .map((c) => ({ ...c, similarity: 0.5 }));
  }

  if (relevantChunks.length === 0) {
    return {
      answer: "I don't have specific information about that in my knowledge base. Could you rephrase the question?",
      sources: [],
      confidence: 0,
    };
  }

  // Build context from relevant chunks
  const context = relevantChunks
    .map((c, i) => `[Source ${i + 1}]: ${c.content}`)
    .join("\n\n");

  // Generate answer using LLM with RAG context
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `Answer the user's question using ONLY the provided context. If the context doesn't contain the answer, say so honestly.

CONTEXT:
${context}

RULES:
- Be concise and direct
- Cite which source(s) you used
- If the answer isn't in the context, say "I don't have that information"
- Never make up information`;

  const url = isAnthropic
    ? "https://api.anthropic.com/v1/messages"
    : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: string;

  if (isAnthropic) {
    headers["x-api-key"] = apiKey!;
    headers["anthropic-version"] = "2023-06-01";
    body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    });
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = JSON.stringify({
      model: "anthropic/claude-haiku-4-5-20251001",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      max_tokens: 500,
    });
  }

  let answer: string;
  try {
    const result = await fetch(url, { method: "POST", headers, body });
    const data = await result.json();
    answer = isAnthropic
      ? data.content?.[0]?.text || "I couldn't generate an answer."
      : data.choices?.[0]?.message?.content || "I couldn't generate an answer.";
  } catch {
    answer = "I'm having trouble generating an answer right now. Please try again.";
  }

  return {
    answer,
    sources: relevantChunks.map((c) => ({
      title: (c.metadata as Record<string, string>)?.title || "Document",
      content: c.content.substring(0, 200) + "...",
      relevance: Math.round((c.similarity || 0.5) * 100),
    })),
    confidence: Math.round((relevantChunks[0]?.similarity || 0.5) * 100),
  };
}

// ─── List Documents ─────────────────────────────────────────────────────────

export async function listDocuments(
  userId: string
): Promise<KnowledgeDocument[]> {
  const supabase = getAdmin();

  const { data } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || []).map((d) => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    source: d.source,
    content: d.content,
    chunkCount: d.chunk_count,
    status: d.status,
    createdAt: d.created_at,
  }));
}

// ─── Delete Document ────────────────────────────────────────────────────────

export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  const supabase = getAdmin();

  // Delete chunks first
  await supabase
    .from("knowledge_chunks")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId);

  // Delete document
  const { error } = await supabase
    .from("knowledge_documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", userId);

  return !error;
}
