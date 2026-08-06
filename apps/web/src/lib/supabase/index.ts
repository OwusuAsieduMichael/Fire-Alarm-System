export { getSupabaseBrowserClient } from "./client";
export {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "./server";
export {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "./env";
export type { Database } from "./database.types";
export {
  ensureProfilePhone,
  fetchProfile,
  mapProfileToUser,
} from "./profile";
