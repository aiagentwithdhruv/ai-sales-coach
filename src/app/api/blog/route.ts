import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET /api/blog — list published posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const tag = searchParams.get("tag");
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    let query = supabase
      .from("blog_posts")
      .select("id, title, slug, meta_description, hero_image_url, tags, reading_time_min, published_at", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      posts: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("[Blog] List error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// POST /api/blog — create a new post (requires secret key for n8n automation)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, meta_description, body: content, hero_image_url, tags, status, published_at } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "title, slug, and body are required" }, { status: 400 });
    }

    // Calculate reading time (~200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const reading_time_min = Math.max(1, Math.ceil(wordCount / 200));

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
        meta_description: meta_description || title,
        body: content,
        hero_image_url,
        tags: tags || [],
        reading_time_min,
        status: status || "draft",
        published_at: status === "published" ? (published_at || new Date().toISOString()) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error: unknown) {
    console.error("[Blog] Create error:", error);
    const msg = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
