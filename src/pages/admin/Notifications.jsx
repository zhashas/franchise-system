import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"

// Helper to broadcast unread count to AdminLayout (and anywhere else listening)
const broadcastUnreadCount = (notifications) => {
  const count = notifications.filter(n => !n.is_read).length
  window.dispatchEvent(new CustomEvent("adminUnreadCount", { detail: { count } }))
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [legendFilter, setLegendFilter] = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, profiles!notifications_sender_id_fkey(full_name)")
        .eq("recipient_type", "admin")
        .eq("sender_type", "applicant")
        .order("created_at", { ascending: false })

      if (error) console.error("Error fetching notifications:", error)
      const result = data || []
      setNotifications(result)
      broadcastUnreadCount(result) // 🔴 Sync badge on load
      setLoading(false)
    }
    fetchNotifications()
  }, [])

  const getCategory = (notif) => {
    const type = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""

    if (type === "application_submitted" || title.includes("new application") || title.includes("submitted"))
      return "new_application"
    if (type === "renewal_request" || title.includes("renewal"))
      return "renewal"
    if (type === "appointment_request" || title.includes("appointment"))
      return "appointment"
    if (type === "document_uploaded" || title.includes("document") || title.includes("uploaded"))
      return "document"
    if (type === "inquiry" || title.includes("inquiry") || title.includes("question"))
      return "inquiry"
    return "other"
  }

  const statusDot = (notif) => {
    const cat = getCategory(notif)
    const colors = {
      new_application: "bg-green-500",
      renewal: "bg-orange-500",
      appointment: "bg-blue-500",
      document: "bg-purple-500",
      inquiry: "bg-yellow-400",
      other: "bg-gray-400"
    }
    return colors[cat] || "bg-gray-400"
  }

  const legends = [
    { key: "all", label: "All", dot: "bg-gray-400" },
    { key: "new_application", label: "New Application", dot: "bg-green-500" },
    { key: "renewal", label: "Renewal Request", dot: "bg-orange-500" },
    { key: "appointment", label: "Appointment", dot: "bg-blue-500" },
    { key: "document", label: "Document Upload", dot: "bg-purple-500" },
    { key: "inquiry", label: "Inquiry", dot: "bg-yellow-400" },
  ]

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id)
      const updated = notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      setNotifications(updated)
      broadcastUnreadCount(updated) // 🔴 Sync badge on individual read
    }

    const category = getCategory(notif)
    if (category === "appointment") {
      navigate("/admin/appointments")
    } else if (notif.application_id) {
      navigate(`/admin/applications/${notif.application_id}`)
    } else {
      navigate("/admin/applications")
    }
  }

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_type", "admin")
      .eq("is_read", false)
    const updated = notifications.map(n => ({ ...n, is_read: true }))
    setNotifications(updated)
    broadcastUnreadCount(updated) // 🔴 Sync badge after mark all read
  }

  const getRedirectLabel = (notif) => {
    const category = getCategory(notif)
    const labels = {
      appointment: "→ View Appointments",
      new_application: "→ View Application",
      renewal: "→ View Applications",
      document: "→ View Application",
      inquiry: "→ View Details"
    }
    return labels[category] || "→ View Applications"
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "numeric", day: "numeric", year: "numeric",
    }) + " – " + new Date(date).toLocaleTimeString("en-PH", {
      hour: "numeric", minute: "2-digit", hour12: true,
    })
  }

  const filtered = notifications
    .filter(n => {
      if (filter === "unread") return !n.is_read
      if (filter === "read") return n.is_read
      return true
    })
    .filter(n => {
      if (legendFilter === "all") return true
      return getCategory(n) === legendFilter
    })

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
              🔔 Admin Notifications
            </h1>
            <button
              onClick={markAllAsRead}
              disabled={notifications.length === 0 || notifications.every(n => n.is_read)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition
                ${notifications.length === 0 || notifications.every(n => n.is_read)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
            >
              Mark All as Read
            </button>
          </div>

          {/* Legend Filter */}
          <div className="px-6 py-4 border-b bg-white">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              📌 Filter by Category
            </p>
            <div className="flex flex-wrap gap-2">
              {legends.map((leg) => {
                const count = leg.key === "all"
                  ? notifications.length
                  : notifications.filter(n => getCategory(n) === leg.key).length
                return (
                  <button
                    key={leg.key}
                    onClick={() => setLegendFilter(leg.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      legendFilter === leg.key
                        ? "border-gray-400 bg-gray-800 text-white shadow"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${leg.dot}`} />
                    {leg.label}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                      legendFilter === leg.key ? "bg-white text-gray-800" : "bg-gray-100 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Read/Unread Filter */}
          <div className="px-6 py-3 border-b bg-white flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
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
            <span className="ml-auto text-xs text-gray-400">
              {notifications.filter(n => !n.is_read).length} unread
            </span>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-12 text-orange-500 font-semibold">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔔</p>
              <p className="font-medium">No notifications found.</p>
              {legendFilter !== "all" && (
                <button
                  onClick={() => setLegendFilter("all")}
                  className="mt-3 text-xs text-orange-500 hover:underline"
                >
                  Clear category filter
                </button>
              )}
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
                      : "bg-orange-50 hover:bg-orange-100"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-3 h-3 rounded-full ${statusDot(notif)}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${notif.is_read ? "text-gray-500" : "text-gray-800"}`}>
                      {notif.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${notif.is_read ? "text-gray-400" : "text-gray-600"}`}>
                      {notif.message}
                    </p>
                    {notif.profiles?.full_name && (
                      <p className="text-xs text-orange-500 mt-1 font-medium">
                        👤 From: {notif.profiles.full_name}
                      </p>
                    )}
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
    </AdminLayout>
  )
}