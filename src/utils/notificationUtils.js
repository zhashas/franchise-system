export function getCategory(notif) {
  const type  = (notif.notification_type || "").toLowerCase()
  const title = (notif.title            || "").toLowerCase()

  if (type === "renewal_request"       || title.includes("renewal"))                                        return "renewal"
  if (type === "application_submitted" || title.includes("new application") || title.includes("submitted")) return "new_application"

  return "other"
}