// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Safety check ─────────────────────────────────────────
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Missing Supabase environment variables!\n" +
      "Make sure your .env file contains:\n" +
      "  VITE_SUPABASE_URL=...\n" +
      "  VITE_SUPABASE_ANON_KEY=...",
  );
}

// ── Warn if someone accidentally pastes service_role key ─
if (
  supabaseAnonKey.includes('"role":"service_role"') ||
  atob(supabaseAnonKey.split(".")[1] || "").includes("service_role")
) {
  throw new Error(
    "❌ SECURITY ERROR: You are using the service_role key!\n" +
      "Use the anon/public key instead.",
  );
}

// ── Create client (respects RLS policies) ────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // keeps user logged in on refresh
    autoRefreshToken: true, // auto-renews expired tokens
    detectSessionInUrl: true, // handles OAuth redirects
  },
});
