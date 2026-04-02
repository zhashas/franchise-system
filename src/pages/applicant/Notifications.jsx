import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import ApplicantLayout from "../../components/ApplicantLayout"

export default function ApplicantNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const navigate = useNavigate()

  // ✅ Use a ref to hold userId so the realtime handler always sees it
  const userIdRef = useRef(null)

  // ✅ SINGLE FETCH FUNCTION — reused by initial load and realtime
  const fetchNotifications = async (uid) => {
    const userId = uid || userIdRef.current
    if (!userId) return

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("recipient_type", "applicant")
      .eq("sender_type", "admin")
      .order("created_at", { ascending: false })

    if (error) console.error(error)
    setNotifications(data || [])
    setLoading(false)
  }

  // ✅ INITIAL LOAD
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id
      await fetchNotifications(user.id)
    }
    load()
  }, [])

  // ✅ REAL-TIME: scoped to the applicant's own user_id — prevents foreign notifications
  // from triggering a re-fetch (which caused the repeated pop-up bug)
  useEffect(() => {
    let channel

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`applicant-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",   // ✅ Only listen for new notifications, not all changes
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,  // ✅ Scoped to THIS user only
          },
          () => {
            fetchNotifications(user.id)
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // ✅ CLICK HANDLER — optimistic update + correct navigation paths
  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      // Instant UI update first
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      )
      // Then persist to DB
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id)
    }

    const type = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""

    // ✅ NAVIGATION PATHS — covers all expected notification types
    if (type === "appointment_scheduled" || title.includes("appointment")) {
      navigate("/applicant/appointments")
    } else if (
      type === "application_approved" ||
      type === "application_declined" ||
      type === "status_update" ||
      title.includes("approved") ||
      title.includes("declined") ||
      title.includes("status")
    ) {
      navigate("/applicant/status")
    } else if (
      type === "document_required" ||
      title.includes("document") ||
      title.includes("upload")
    ) {
      navigate("/applicant/documents")
    } else if (
      type === "renewal_reminder" ||
      title.includes("renewal")
    ) {
      navigate("/applicant/renewal")
    } else if (notif.application_id) {
      navigate(`/applicant/applications/${notif.application_id}`)
    } else {
      navigate("/applicant/dashboard")
    }
  }

  // ✅ MARK ALL AS READ — optimistic + scoped
  const markAllAsRead = async () => {
    const userId = userIdRef.current
    if (!userId) return

    // Instant UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

    // Persist to DB
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("recipient_type", "applicant")
      .eq("is_read", false)
  }

  const filtered =
    filter === "unread"
      ? notifications.filter(n => !n.is_read)
      : filter === "read"
      ? notifications.filter(n => n.is_read)
      : notifications

  const statusDot = (notif) => {
    const type = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""

    if (title.includes("approved") || type === "application_approved") return "bg-green-500"
    if (title.includes("declined") || type === "application_declined") return "bg-red-500"
    if (title.includes("appointment") || type === "appointment_scheduled") return "bg-blue-500"
    if (title.includes("document") || type === "document_required") return "bg-purple-500"
    if (title.includes("renewal") || type === "renewal_reminder") return "bg-orange-500"
    if (title.includes("review")) return "bg-yellow-400"
    return "bg-gray-400"
  }

  const getRedirectLabel = (notif) => {
    const type = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""

    if (type === "appointment_scheduled" || title.includes("appointment")) return "→ View Appointments"
    if (title.includes("approved") || title.includes("declined") || title.includes("status")) return "→ View Status"
    if (title.includes("document") || title.includes("upload")) return "→ View Documents"
    if (title.includes("renewal")) return "→ View Renewal"
    return "→ Go to Dashboard"
  }

  const formatDate = (date) => {
    return (
      new Date(date).toLocaleDateString("en-PH", {
        month: "numeric", day: "numeric", year: "numeric",
      }) +
      " – " +
      new Date(date).toLocaleTimeString("en-PH", {
        hour: "numeric", minute: "2-digit", hour12: true,
      })
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <ApplicantLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">

          {/* HEADER */}
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
                🔔 My Notifications
              </h1>
              {/* ✅ Red badge */}
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>

            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                unreadCount === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              Mark All as Read
            </button>
          </div>

          {/* FILTER */}
          <div className="px-6 py-3 border-b bg-white flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Filter by:</span>
            <div className="flex gap-2">
              {["all", "unread", "read"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition ${
                    filter === f
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-orange-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-gray-400">{unreadCount} unread</span>
          </div>

          {/* BODY */}
          {loading ? (
            <div className="text-center py-12 text-orange-500 font-semibold">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔔</p>
              <p className="font-medium">No notifications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition ${
                    notif.is_read
                      ? "bg-white hover:bg-gray-50"
                      : "bg-orange-50 hover:bg-orange-100 border-l-4 border-orange-400"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-3 h-3 rounded-full ${statusDot(notif)}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${notif.is_read ? "text-gray-500" : "text-gray-800"}`}>
                      {notif.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${notif.is_read ? "text-gray-400" : "text-gray-600"}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-blue-400 mt-1 font-medium">
                      {getRedirectLabel(notif)}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(notif.created_at)}
                    </p>
                    {!notif.is_read ? (
                      <span className="inline-block mt-1 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        New
                      </span>
                    ) : (
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                        Read
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ApplicantLayout>
  )
}