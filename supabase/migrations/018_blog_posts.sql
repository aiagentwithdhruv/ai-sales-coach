-- Blog posts table for automated daily content publishing (n8n workflow)

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  meta_description TEXT,
  body        TEXT NOT NULL,
  hero_image_url TEXT,
  tags        TEXT[] DEFAULT '{}',
  reading_time_min INTEGER DEFAULT 1,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast listing by status + date
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON public.blog_posts (status, published_at DESC)
  WHERE status = 'published';

-- Index for slug lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug
  ON public.blog_posts (slug);

-- Index for tag-based filtering (GIN for array contains)
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags
  ON public.blog_posts USING GIN (tags);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- RLS: Public read for published posts, service role for writes
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts (blog is public)
CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

-- Service role (n8n automation) can do everything
CREATE POLICY "Service role full access to blog posts"
  ON public.blog_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
