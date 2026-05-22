import { createClient } from "@supabase/supabase-js";

export type ClientRecord = {
  id: number;
  name: string;
  industry: string | null;
  status: string | null;
  assigned_manager_id: number | null;
  created_at: string | null;
};

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
