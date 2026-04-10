/**
 * activityLogger.js
 * Call logActivity() anywhere in the app to record an event.
 *
 * Expected activity_logs table schema:
 *   id             uuid default gen_random_uuid() primary key,
 *   user_id        uuid references profiles(id),
 *   user_name      text,
 *   user_email     text,
 *   role           text,          -- "admin" | "staff" | "applicant"
 *   action         text,
 *   details        text,
 *   application_id uuid references applications(id),
 *   ip_address     text,
 *   metadata       jsonb,
 *   created_at     timestamptz default now()
 */

import { supabase } from "./supabaseClient"

async function getClientIP() {
  try {
    const res  = await fetch("https://api.ipify.org?format=json")
    const data = await res.json()
    return data.ip || null
  } catch {
    return null
  }
}

/**
 * @param {Object} opts
 * @param {string}  opts.action          – e.g. "login", "application_submitted"
 * @param {string}  [opts.details]       – human-readable description
 * @param {string}  [opts.applicationId] – related application uuid
 * @param {Object}  [opts.metadata]      – any extra key/value pairs (jsonb)
 */
export async function logActivity({ action, details = null, applicationId = null, metadata = null }) {
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
      user_name:      profile?.full_name  || user.email,
      user_email:     profile?.email      || user.email,
      role:           profile?.role       || "applicant",
      action,
      details,
      application_id: applicationId,
      ip_address:     ip,
      metadata,
    })

    if (error) console.error("[activityLogger]", error.message)
  } catch (err) {
    console.error("[activityLogger] unexpected error:", err)
  }
}