import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "./env";
import type { Database } from "./database.types";

/** Server Supabase client with the anon key (respects RLS via user JWT when passed). */
export function createSupabaseServerClient(accessToken?: string) {
  if (!isSupabaseConfigured()) return null;

  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

/** Service-role client for trusted server jobs (bypasses RLS). Never expose to browser. */
export function createSupabaseAdminClient(): SupabaseClient<Database> | null {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
