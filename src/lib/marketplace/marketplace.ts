/**
 * Item 24: Loadout Marketplace
 *
 * Community-driven marketplace for agent loadouts:
 *   - Browse loadouts by industry, rating, popularity
 *   - Install loadouts into your workspace
 *   - Publish your custom loadouts for others
 *   - Rate and review loadouts
 *   - Revenue sharing for published loadouts (future)
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MarketplaceListing {
  id: string;
  loadoutId: string;
  publisherId: string;
  publisherName: string;
  name: string;
  description: string;
  industry: string;
  tags: string[];
  agentCount: number;
  rating: number;
  reviewCount: number;
  installCount: number;
  price: number; // 0 = free
  currency: string;
  previewImages?: string[];
  featured: boolean;
  status: "published" | "under_review" | "rejected" | "removed";
  createdAt: string;
}

export interface MarketplaceReview {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

// ─── Browse Marketplace ─────────────────────────────────────────────────────

export async function browseMarketplace(params: {
  industry?: string;
  query?: string;
  sortBy?: "popular" | "rating" | "newest" | "price";
  priceFilter?: "free" | "paid" | "all";
  page?: number;
  limit?: number;
}): Promise<{ listings: MarketplaceListing[]; total: number }> {
  const supabase = getAdmin();
  const limit = params.limit || 20;
  const offset = ((params.page || 1) - 1) * limit;

  let query = supabase
    .from("marketplace_listings")
    .select("*", { count: "exact" })
    .eq("status", "published");

  if (params.industry) query = query.eq("industry", params.industry);
  if (params.priceFilter === "free") query = query.eq("price", 0);
  if (params.priceFilter === "paid") query = query.gt("price", 0);

  // Sort
  switch (params.sortBy) {
    case "popular":
      query = query.order("install_count", { ascending: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    case "price":
      query = query.order("price", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count } = await query;

  const listings = (data || []).map(mapListing);

  // If text search, filter in-app (Supabase free tier doesn't have FTS)
  if (params.query) {
    const lower = params.query.toLowerCase();
    return {
      listings: listings.filter(
        (l) =>
          l.name.toLowerCase().includes(lower) ||
          l.description.toLowerCase().includes(lower) ||
          l.tags.some((t) => t.includes(lower))
      ),
      total: count || 0,
    };
  }

  return { listings, total: count || 0 };
}

// ─── Get Listing Details ────────────────────────────────────────────────────

export async function getListingDetails(
  listingId: string
): Promise<{ listing: MarketplaceListing; reviews: MarketplaceReview[] } | null> {
  const supabase = getAdmin();

  const [listingResult, reviewsResult] = await Promise.all([
    supabase.from("marketplace_listings").select("*").eq("id", listingId).single(),
    supabase
      .from("marketplace_reviews")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!listingResult.data) return null;

  return {
    listing: mapListing(listingResult.data),
    reviews: (reviewsResult.data || []).map((r) => ({
      id: r.id,
      listingId: r.listing_id,
      userId: r.user_id,
      userName: r.user_name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    })),
  };
}

// ─── Install Loadout ────────────────────────────────────────────────────────

export async function installLoadout(
  userId: string,
  listingId: string
): Promise<{ installed: boolean; loadoutId?: string; error?: string }> {
  const supabase = getAdmin();

  // Get listing
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("*, loadout:loadouts(*)")
    .eq("id", listingId)
    .eq("status", "published")
    .single();

  if (!listing) return { installed: false, error: "Listing not found" };

  const sourceLoadout = listing.loadout;
  if (!sourceLoadout) return { installed: false, error: "Source loadout not found" };

  // Clone loadout to user's workspace
  const { data: newLoadout } = await supabase
    .from("loadouts")
    .insert({
      user_id: userId,
      name: `${sourceLoadout.name} (installed)`,
      description: sourceLoadout.description,
      industry: sourceLoadout.industry,
      agents: sourceLoadout.agents,
      chain: sourceLoadout.chain,
      settings: sourceLoadout.settings,
      status: "draft",
      version: 1,
      source_listing_id: listingId,
    })
    .select("id")
    .single();

  // Increment install count (fallback to manual if RPC missing)
  try {
    await supabase.rpc("increment_install_count", { listing_id: listingId });
  } catch {
    await supabase
      .from("marketplace_listings")
      .update({ install_count: (listing.install_count || 0) + 1 })
      .eq("id", listingId);
  }

  // Log activity
  await supabase.from("activities").insert({
    user_id: userId,
    activity_type: "loadout_installed",
    details: {
      listing_id: listingId,
      loadout_id: newLoadout?.id,
      name: sourceLoadout.name,
    },
  });

  return { installed: true, loadoutId: newLoadout?.id };
}

// ─── Publish Loadout ────────────────────────────────────────────────────────

export async function publishLoadout(
  userId: string,
  loadoutId: string,
  params: {
    price?: number;
    tags?: string[];
    previewImages?: string[];
  }
): Promise<{ published: boolean; listingId?: string; error?: string }> {
  const supabase = getAdmin();

  // Get loadout
  const { data: loadout } = await supabase
    .from("loadouts")
    .select("*")
    .eq("id", loadoutId)
    .eq("user_id", userId)
    .single();

  if (!loadout) return { published: false, error: "Loadout not found" };

  // Get user name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Create marketplace listing
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .insert({
      loadout_id: loadoutId,
      publisher_id: userId,
      publisher_name: profile?.full_name || "Anonymous",
      name: loadout.name,
      description: loadout.description,
      industry: loadout.industry || "general",
      tags: params.tags || [],
      agent_count: (loadout.agents as unknown[])?.length || 0,
      price: params.price || 0,
      currency: "USD",
      preview_images: params.previewImages || [],
      status: "published",
      featured: false,
    })
    .select("id")
    .single();

  // Update loadout status
  await supabase
    .from("loadouts")
    .update({ status: "published" })
    .eq("id", loadoutId);

  return { published: true, listingId: listing?.id };
}

// ─── Review Loadout ─────────────────────────────────────────────────────────

export async function submitReview(
  userId: string,
  listingId: string,
  params: { rating: number; comment: string }
): Promise<boolean> {
  const supabase = getAdmin();

  // Get user name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  // Insert review
  await supabase.from("marketplace_reviews").insert({
    listing_id: listingId,
    user_id: userId,
    user_name: profile?.full_name || "Anonymous",
    rating: Math.min(5, Math.max(1, params.rating)),
    comment: params.comment,
  });

  // Recalculate average rating
  const { data: reviews } = await supabase
    .from("marketplace_reviews")
    .select("rating")
    .eq("listing_id", listingId);

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await supabase
      .from("marketplace_listings")
      .update({
        rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length,
      })
      .eq("id", listingId);
  }

  return true;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapListing(data: Record<string, unknown>): MarketplaceListing {
  return {
    id: data.id as string,
    loadoutId: data.loadout_id as string,
    publisherId: data.publisher_id as string,
    publisherName: data.publisher_name as string,
    name: data.name as string,
    description: data.description as string,
    industry: data.industry as string,
    tags: data.tags as string[] || [],
    agentCount: data.agent_count as number || 0,
    rating: data.rating as number || 0,
    reviewCount: data.review_count as number || 0,
    installCount: data.install_count as number || 0,
    price: data.price as number || 0,
    currency: data.currency as string || "USD",
    previewImages: data.preview_images as string[],
    featured: data.featured as boolean || false,
    status: data.status as MarketplaceListing["status"],
    createdAt: data.created_at as string,
  };
}
