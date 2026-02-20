import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, ArrowLeft, Clock, Tag, ArrowRight } from "lucide-react";
import { MobileNav } from "@/components/ui/mobile-nav";
import { createAdminClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  body: string;
  hero_image_url: string | null;
  tags: string[];
  reading_time_min: number;
  published_at: string;
  created_at: string;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data as BlogPost | null;
}

async function getRelatedPosts(currentId: string, tags: string[]) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, slug, reading_time_min, published_at")
    .eq("status", "published")
    .neq("id", currentId)
    .order("published_at", { ascending: false })
    .limit(3);
  return data || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} — QuotaHit Blog`,
    description: post.meta_description,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      type: "article",
      publishedTime: post.published_at,
      url: `https://www.quotahit.com/blog/${post.slug}`,
      images: post.hero_image_url ? [{ url: post.hero_image_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Simple markdown-to-HTML conversion for blog bodies
function renderMarkdown(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-onyx rounded-lg p-4 overflow-x-auto my-4 text-sm"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-onyx px-1.5 py-0.5 rounded text-neonblue text-sm">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-platinum mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-platinum mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-platinum mt-10 mb-4">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-platinum font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-neonblue hover:text-electricblue underline" target="_blank" rel="noopener">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 pl-2 text-silver">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 pl-2 text-silver list-decimal">$1</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-neonblue pl-4 py-1 my-4 text-silver italic">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-gunmetal my-8" />')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="text-silver leading-relaxed mb-4">')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br />');

  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>\s*)+)/g, '<ul class="list-disc my-4 space-y-1">$1</ul>');

  return `<p class="text-silver leading-relaxed mb-4">${html}</p>`;
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.id, post.tags);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description,
    image: post.hero_image_url,
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: { "@type": "Organization", name: "QuotaHit" },
    publisher: {
      "@type": "Organization",
      name: "QuotaHit",
      url: "https://www.quotahit.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.quotahit.com/blog/${post.slug}`,
    },
    wordCount: post.body.split(/\s+/).length,
    timeRequired: `PT${post.reading_time_min}M`,
  };

  return (
    <div className="min-h-screen bg-obsidian text-platinum">
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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

      {/* Article */}
      <article className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-mist hover:text-neonblue transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.map((t) => (
                  <Link key={t} href={`/blog?tag=${t}`} className="text-xs px-2 py-0.5 rounded-full bg-neonblue/10 text-neonblue border border-neonblue/20 hover:bg-neonblue/20 transition-colors">
                    {t}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-platinum mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-mist">
              <span>{formatDate(post.published_at)}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.reading_time_min} min read
              </span>
            </div>
          </header>

          {/* Hero image */}
          {post.hero_image_url && (
            <div className="rounded-xl overflow-hidden mb-10 border border-gunmetal">
              <img src={post.hero_image_url} alt={post.title} className="w-full" />
            </div>
          )}

          {/* Body */}
          <div
            className="prose-quotahit"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
          />

          {/* CTA card */}
          <div className="mt-12 p-6 rounded-xl border border-neonblue/20 bg-neonblue/5">
            <h3 className="text-lg font-bold text-platinum mb-2">
              Ready to practice what you learned?
            </h3>
            <p className="text-sm text-silver mb-4">
              Turn these tips into muscle memory with AI-powered voice practice. No credit card needed.
            </p>
            <Link href="/signup">
              <button className="px-5 py-2.5 rounded-lg bg-neonblue hover:bg-electricblue text-white text-sm font-medium transition-colors inline-flex items-center gap-2">
                Start Practicing Free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {/* Related posts */}
          {related.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gunmetal">
              <h3 className="text-xl font-bold text-platinum mb-6">More from the blog</h3>
              <div className="grid gap-4">
                {related.map((r: { slug: string; title: string; reading_time_min: number; published_at: string }) => (
                  <Link key={r.slug} href={`/blog/${r.slug}`} className="flex items-center justify-between p-4 rounded-lg border border-gunmetal hover:border-neonblue/30 hover:bg-graphite/50 transition-all group">
                    <span className="text-sm font-medium text-platinum group-hover:text-neonblue transition-colors">{r.title}</span>
                    <span className="text-xs text-mist flex-shrink-0 ml-4">{r.reading_time_min} min</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

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
          </div>
          <p className="text-sm text-mist">&copy; 2026 QuotaHit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
