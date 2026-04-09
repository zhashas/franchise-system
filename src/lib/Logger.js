import { supabase } from "./supabaseClient"

/**
 * Log an activity event to the activity_logs table.
 *
 * Usage:
 *   import { logActivity } from "../lib/logger"
 *   await logActivity({ action: "login", details: "Logged in successfully" })
 *
 * The function silently fails so it never breaks the main flow.
 */
export async function logActivity({ action, details = "", metadata = {} }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .single()

    await supabase.from("activity_logs").insert({
      user_id:    user.id,
      user_name:  profile?.full_name  || "Unknown",
      user_email: profile?.email      || user.email,
      role:       profile?.role       || "unknown",
      action,
      details,
      metadata,   // store extra JSON (e.g. application_id, ip, browser)
    })
  } catch {
    // never throw — logging must be non-blocking
  }
}