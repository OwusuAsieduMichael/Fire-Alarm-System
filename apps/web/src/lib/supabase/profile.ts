import type { User, UserRole } from "@/types";
import type { Database } from "./database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function mapProfileToUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as UserRole,
    theme: profile.theme,
    phone: profile.phone,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export async function fetchProfile(
  client: SupabaseClient<Database>,
  userId: string
): Promise<User | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfileToUser(data);
}

/** Ensure SMS contact is stored on the profile after signup. */
export async function ensureProfilePhone(
  client: SupabaseClient<Database>,
  userId: string,
  phone: string
) {
  const trimmed = phone.trim();
  if (!trimmed) return;

  await client
    .from("profiles")
    .update({ phone: trimmed })
    .eq("id", userId)
    .is("phone", null);
}
