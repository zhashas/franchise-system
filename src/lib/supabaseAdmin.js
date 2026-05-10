import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

//Safety checks
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "❌ Missing Supabase SERVICE ROLE environment variables!\n" +
      "Make sure your .env file contains:\n" +
      "  VITE_SUPABASE_URL=...\n" +
      "  VITE_SUPABASE_SERVICE_ROLE_KEY=...",
  );
}

// ── Verify this is actually the service_role key
try {
  const payload = JSON.parse(atob(supabaseServiceKey.split(".")[1]));
  if (payload.role !== "service_role") {
    throw new Error(
      "❌ CONFIGURATION ERROR: VITE_SUPABASE_SERVICE_ROLE_KEY is not a service_role key!\n" +
        `Found role: ${payload.role}\n` +
        "Please use the correct service_role key from Supabase dashboard.",
    );
  }
} catch (e) {
  if (e.message.includes("CONFIGURATION ERROR")) throw e;
  throw new Error("❌ Invalid service_role key format!");
}

//Create admin client (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("✅ Supabase Admin client initialized (service_role)");
