
/**
 * notifications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central helper for inserting notifications into Supabase.
 *
 * Table schema expected:
 *   notifications (
 *     id                uuid default gen_random_uuid() primary key,
 *     recipient_id      uuid references profiles(id),   -- null for "all admin/staff"
 *     recipient_type    text,   -- "applicant" | "admin" | "staff"
 *     sender_id         uuid references profiles(id),   -- who triggered it
 *     sender_type       text,   -- "applicant" | "admin" | "staff" | "system"
 *     notification_type text,
 *     title             text,
 *     message           text,
 *     application_id    uuid references applications(id),
 *     is_read           boolean default false,
 *     created_at        timestamptz default now()
 *   )
 */

import { supabase } from "./supabaseClient"

// ─── Internal insert with graceful error handling ─────────────────────────────
async function _insert(payload) {
  const { error } = await supabase.from("notifications").insert(payload)
  if (error) {
    console.error("[notifications] insert failed:", error.message, payload)
  }
  return !error
}

// ─── notifyAdmin ──────────────────────────────────────────────────────────────
/**
 * Send a notification to the admin panel (and staff, who share the same feed).
 * Called by applicants when they submit an application.
 *
 * @param {Object} opts
 * @param {string} opts.senderId        – applicant's user id
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.applicationId] – related application uuid
 * @param {string} [opts.notificationType]
 */
export async function notifyAdmin({
  senderId,
  title,
  message,
  applicationId = null,
  notificationType = "application_submitted",
}) {
  return _insert({
    recipient_id:      null,          // broadcasted; all admins/staff query by recipient_type
    recipient_type:    "admin",
    sender_id:         senderId,
    sender_type:       "applicant",
    notification_type: notificationType,
    title,
    message,
    application_id:    applicationId,
    is_read:           false,
  })
}

// ─── notifyApplicant ──────────────────────────────────────────────────────────
/**
 * Send a notification to a specific applicant.
 * Called by admin/staff when updating application status or scheduling appointments.
 *
 * @param {Object} opts
 * @param {string} opts.recipientId     – applicant's user id (recipient)
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.applicationId]
 * @param {string} [opts.notificationType]
 * @param {string} [opts.senderType]    – "admin" | "staff"  (default: "admin")
 */
export async function notifyApplicant({
  recipientId,
  title,
  message,
  applicationId = null,
  notificationType = "status_update",
  senderType = "admin",
}) {
  return _insert({
    recipient_id:      recipientId,
    recipient_type:    "applicant",
    sender_id:         null,
    sender_type:       senderType,
    notification_type: notificationType,
    title,
    message,
    application_id:    applicationId,
    is_read:           false,
  })
}

// ─── notifyStaff ─────────────────────────────────────────────────────────────
/**
 * Send a broadcast notification visible to all staff members.
 * Useful for system alerts (expiry warnings, MTOP reminders).
 *
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.applicationId]
 * @param {string} [opts.notificationType]
 */
export async function notifyStaff({
  title,
  message,
  applicationId = null,
  notificationType = "system_alert",
}) {
  return _insert({
    recipient_id:      null,
    recipient_type:    "staff",
    sender_id:         null,
    sender_type:       "system",
    notification_type: notificationType,
    title,
    message,
    application_id:    applicationId,
    is_read:           false,
  })
}