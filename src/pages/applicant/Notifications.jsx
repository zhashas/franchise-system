import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import ApplicantLayout from "../../components/ApplicantLayout"

export default function ApplicantNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState("all")
  const navigate                          = useNavigate()

  // Keep userId in a ref so realtime callback always has access to it
  const userIdRef = useRef(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchNotifications = async (uid) => {
    const userId = uid || userIdRef.current
    if (!userId) return

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)          // ← correct column name
      .eq("recipient_type", "applicant")
      .eq("sender_type", "admin")
      .order("created_at", { ascending: false })

    if (error) console.error("Fetch notifications error:", error)
    setNotifications(data || [])
    setLoading(false)
  }

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id
      await fetchNotifications(user.id)
    }
    load()
  }, [])

  // ── Real-time: listen for INSERT on notifications for this user ───────────
  // NOTE: Supabase realtime postgres_changes filters only support simple
  //       equality on indexed columns. We filter in JS to avoid the
  //       "cannot add postgres_changes callbacks after subscribe()" error
  //       caused by subscribing with complex filters.
  useEffect(() => {
    let channel

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`notif-applicant-${user.id}`)
        .on(
          "postgres_changes",
          {
            event:  "INSERT",
            schema: "public",
            table:  "notifications",
          },
          (payload) => {
            // Only act on rows meant for THIS applicant
            const row = payload.new
            if (
              row.recipient_id   === user.id &&
              row.recipient_type === "applicant" &&
              row.sender_type    === "admin"
            ) {
              // Prepend new notification without a full re-fetch
              setNotifications(prev => [row, ...prev])
            }
          }
        )
        .subscribe()
    }

    setupRealtime()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      )
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id)
    }

    const type  = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""

    if (type.includes("appointment") || title.includes("appointment")) {
      navigate("/applicant/appointments")
    } else if (
      type === "status_for_release" ||
      title.includes("for release") ||
      title.includes("release")
    ) {
      // For-release: show dashboard (or a dedicated page if you have one)
      navigate("/applicant/dashboard")
    } else if (
      type.includes("status") ||
      title.includes("approved") ||
      title.includes("rejected") ||
      title.includes("review")
    ) {
      navigate("/applicant/dashboard")
    } else if (notif.application_id) {
      navigate("/applicant/dashboard")
    } else {
      navigate("/applicant/dashboard")
    }
  }

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    const userId = userIdRef.current
    if (!userId) return

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("recipient_type", "applicant")
      .eq("is_read", false)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const statusDot = (notif) => {
    const type  = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""

    if (type === "status_approved"    || title.includes("approved"))    return "bg-green-500"
    if (type === "status_rejected"    || title.includes("rejected"))    return "bg-red-500"
    if (type === "status_for_release" || title.includes("release"))     return "bg-purple-500"
    if (type === "status_under_review"|| title.includes("review"))      return "bg-blue-500"
    if (type.includes("appointment")  || title.includes("appointment")) return "bg-blue-400"
    if (type.includes("document")     || title.includes("document"))    return "bg-yellow-400"
    if (type.includes("renewal")      || title.includes("renewal"))     return "bg-orange-500"
    return "bg-gray-400"
  }

  const getRedirectLabel = (notif) => {
    const type  = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""

    if (type.includes("appointment") || title.includes("appointment")) return "→ View Appointments"
    if (title.includes("approved"))   return "→ Application Approved"
    if (title.includes("rejected"))   return "→ See Details"
    if (title.includes("release"))    return "→ Visit Municipal Hall"
    if (title.includes("review"))     return "→ Under Review"
    return "→ Go to Dashboard"
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-PH", {
      month: "numeric", day: "numeric", year: "numeric",
    }) + " – " +
    new Date(date).toLocaleTimeString("en-PH", {
      hour: "numeric", minute: "2-digit", hour12: true,
    })

  const filtered =
    filter === "unread" ? notifications.filter(n => !n.is_read) :
    filter === "read"   ? notifications.filter(n =>  n.is_read) :
    notifications

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
              {["all", "unread", "read"].map(f => (
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
            <div className="text-center py-12 text-orange-500 font-semibold">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔔</p>
              <p className="font-medium">No notifications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(notif => (
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