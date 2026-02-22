import { createAdminClient } from "@/lib/supabase/server";

const SITE_URL = "https://www.quotahit.com";

export async function GET() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("title, slug, meta_description, published_at, tags")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (posts || [])
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.meta_description}]]></description>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      ${(post.tags || []).map((t: string) => `<category>${t}</category>`).join("\n      ")}
    </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>QuotaHit Sales Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>AI sales coaching tips, objection handling techniques, cold calling strategies, and sales productivity hacks.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
