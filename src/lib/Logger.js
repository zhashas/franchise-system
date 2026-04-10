/**
 * logger.js  — single source of truth for activity logging
 * Usage: import { logActivity } from "../lib/logger"
 *        await logActivity({ action: "login", details: "Signed in" })
 *
 * Silently fails so it never blocks the main flow.
 */

import { supabase } from "./supabaseClient"

async function getClientIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json")
    const { ip } = await res.json()
    return ip || null
  } catch {
    return null
  }
}

export async function logActivity({
  action,
  details       = "",
  applicationId = null,
  metadata      = {},
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .single()

    const ip = await getClientIP()

    const { error } = await supabase.from("activity_logs").insert({
      user_id:        user.id,
      user_name:      profile?.full_name || "Unknown",
      user_email:     profile?.email     || user.email,
      role:           profile?.role      || "unknown",
      action,
      details,
      application_id: applicationId,
      ip_address:     ip,
      metadata,
    })

    if (error) console.error("[logger]", error.message)
  } catch {
    // never throw
  }
}