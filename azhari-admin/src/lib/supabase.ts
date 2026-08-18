import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anonKey) {
  // Fails loudly at build/runtime rather than silently hitting a blank
  // Supabase URL — easier to diagnose than a mysterious network error.
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your project's values."
  );
}

// A single browser client for the whole app. The anon key is safe to expose
// (it's public by design in Supabase) — real access control is enforced by
// the RLS policies in supabase/schema.sql, not by keeping this key secret.
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
