// lib/notifications.js
import { supabase } from "./supabaseClient"

export async function notifyAdmin({
  senderId,
  title,
  message,
  applicationId = null,
  notificationType = "general"
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: null,
    sender_id: senderId,
    sender_type: "applicant",
    recipient_type: "admin",
    title,
    message,
    application_id: applicationId,
    notification_type: notificationType,
    is_read: false
  })

  if (error) console.error("Failed to notify admin:", error)

  return { error }
}

export async function notifyApplicant({
  recipientId,
  title,
  message,
  applicationId = null,
  notificationType = "general"
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: recipientId,
    sender_id: null,
    sender_type: "admin",
    recipient_type: "applicant",
    title,
    message,
    application_id: applicationId,
    notification_type: notificationType,
    is_read: false
  })

  if (error) console.error("Failed to notify applicant:", error)

  return { error }
}