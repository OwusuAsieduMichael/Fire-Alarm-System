"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "./env";
import type { Database } from "./database.types";

let browserClient: SupabaseClient<Database> | null = null;

/** Browser Supabase client (anon key). Returns null if env is not configured. */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return browserClient;
}
