import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, Clock, Tag, BookOpen } from "lucide-react";
import { MobileNav } from "@/components/ui/mobile-nav";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sales Blog — AI Sales Tips, Coaching & Strategies",
  description:
    "Actionable sales tips, objection handling techniques, cold calling strategies, and AI coaching insights. Updated daily by QuotaHit's AI and sales experts.",
  keywords: [
    "sales blog", "sales tips", "objection handling tips", "cold calling strategies",
    "AI sales coaching blog", "sales training articles", "B2B sales tips",
  ],
  alternates: {
    canonical: "https://www.quotahit.com/blog",
  },
  openGraph: {
    title: "QuotaHit Blog — AI Sales Tips & Coaching",
    description: "Daily sales tips, objection handling, cold calling strategies. Written by AI and sales experts.",
    url: "https://www.quotahit.com/blog",
  },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  hero_image_url: string | null;
  tags: string[];
  reading_time_min: number;
  published_at: string;
}

async function getPosts(page: number, tag?: string) {
  const supabase = createAdminClient();
  const limit = 12;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, meta_description, hero_image_url, tags, reading_time_min, published_at", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, count } = await query;
  return { posts: (data || []) as BlogPost[], total: count || 0, totalPages: Math.ceil((count || 0) / limit) };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const tag = params.tag;
  const { posts, total, totalPages } = await getPosts(page, tag);

  return (
    <div className="min-h-screen bg-obsidian text-platinum">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gunmetal bg-obsidian/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-platinum">
              Quota<span className="text-neonblue">Hit</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm text-silver hover:text-platinum transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-silver hover:text-platinum transition-colors">Pricing</Link>
            <Link href="/blog" className="text-sm text-neonblue font-medium">Blog</Link>
            <Link href="/login" className="text-sm text-silver hover:text-platinum transition-colors">Login</Link>
            <Link href="/signup">
              <button className="px-4 py-2 rounded-lg bg-neonblue hover:bg-electricblue text-white text-sm font-medium transition-colors">
                Start Free
              </button>
            </Link>
          </div>
          <MobileNav links={[
            { href: "/features", label: "Features" },
            { href: "/pricing", label: "Pricing" },
            { href: "/blog", label: "Blog" },
            { href: "/login", label: "Login" },
            { href: "/signup", label: "Sign Up" },
          ]} />
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-4 border-b border-gunmetal">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neonblue/10 border border-neonblue/20 text-neonblue text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4" />
            Sales Intelligence Blog
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-platinum mb-4">
            Sell Smarter with <span className="text-neonblue">AI</span>
          </h1>
          <p className="text-lg text-silver max-w-2xl mx-auto">
            Sales tips, objection handling scripts, cold call frameworks, and AI coaching insights — written for reps who want to close more deals.
          </p>
        </div>
      </section>

      {/* Tag filter */}
      {tag && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="flex items-center gap-2 text-sm text-silver">
            <Tag className="h-4 w-4" />
            Filtered by: <span className="text-neonblue font-medium">{tag}</span>
            <Link href="/blog" className="text-mist hover:text-silver ml-2">(clear)</Link>
          </div>
        </div>
      )}

      {/* Posts grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-silver text-lg">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                  <article className="h-full rounded-xl border border-gunmetal bg-graphite/50 hover:bg-graphite hover:border-neonblue/30 transition-all overflow-hidden">
                    {/* Hero image */}
                    {post.hero_image_url && (
                      <div className="aspect-video bg-onyx overflow-hidden">
                        <img
                          src={post.hero_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    {!post.hero_image_url && (
                      <div className="aspect-video bg-gradient-to-br from-onyx to-graphite flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-gunmetal" />
                      </div>
                    )}
                    {/* Content */}
                    <div className="p-5">
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-neonblue/10 text-neonblue border border-neonblue/20">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-lg font-semibold text-platinum mb-2 group-hover:text-neonblue transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-silver line-clamp-2 mb-4">
                        {post.meta_description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-mist">
                        <span>{formatDate(post.published_at)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time_min} min read
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {page > 1 && (
                <Link href={`/blog?page=${page - 1}${tag ? `&tag=${tag}` : ""}`} className="px-4 py-2 rounded-lg border border-gunmetal text-silver hover:text-platinum hover:border-neonblue/30 transition-colors text-sm">
                  Previous
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-mist">
                Page {page} of {totalPages} ({total} posts)
              </span>
              {page < totalPages && (
                <Link href={`/blog?page=${page + 1}${tag ? `&tag=${tag}` : ""}`} className="px-4 py-2 rounded-lg border border-gunmetal text-silver hover:text-platinum hover:border-neonblue/30 transition-colors text-sm">
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-gunmetal">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-platinum mb-4">
            Stop reading. Start <span className="text-neonblue">practicing.</span>
          </h2>
          <p className="text-silver mb-6">
            Turn these tips into muscle memory with AI-powered voice practice.
          </p>
          <Link href="/signup">
            <button className="px-6 py-3 rounded-lg bg-neonblue hover:bg-electricblue text-white font-medium transition-colors inline-flex items-center gap-2">
              Start Free — No Credit Card
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gunmetal bg-obsidian">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold text-platinum">Quota<span className="text-neonblue">Hit</span></span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-sm text-mist hover:text-silver transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-mist hover:text-silver transition-colors">Pricing</Link>
            <Link href="/blog" className="text-sm text-mist hover:text-silver transition-colors">Blog</Link>
            <Link href="/login" className="text-sm text-mist hover:text-silver transition-colors">Login</Link>
          </div>
          <p className="text-sm text-mist">&copy; 2026 QuotaHit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
