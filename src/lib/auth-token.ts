import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Get the current user's auth token from Supabase session.
 * Used for authenticating API requests.
 */
export async function getAuthToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
