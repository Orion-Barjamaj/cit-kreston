import { createClient } from "@supabase/supabase-js";

export type ClientRecord = {
  id: number;
  name: string;
  industry: string | null;
  risk?: string | null;
  status: string | null;
  assigned_manager_id: number | null;
  created_at: string | null;
};

export type TaskRecord = {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  deadline: string | null;
  client_id: number | null;
  assigned_to: number | null;
  department_id: number | null;
  created_by: number | null;
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
