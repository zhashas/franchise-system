import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [legendFilter, setLegendFilter] = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
      setNotifications(data || [])
      setLoading(false)
    }
    fetchNotifications()
  }, [])

  const getCategory = (notif) => {
    const title = notif.title?.toLowerCase() || ""
    const message = notif.message?.toLowerCase() || ""
    if (title.includes("approved")) return "approved"
    if (title.includes("declined") || title.includes("rejected")) return "declined"
    if (title.includes("appointment") || message.includes("appointment")) return "appointment"
    if (title.includes("renewal") || message.includes("renewal")) return "renewal"
    if (title.includes("application") || message.includes("application")) return "new_application"
    return "other"
  }

  const statusDot = (notif) => {
    const cat = getCategory(notif)
    if (cat === "approved") return "bg-green-500"
    if (cat === "declined") return "bg-red-500"
    if (cat === "appointment") return "bg-blue-500"
    if (cat === "renewal") return "bg-orange-500"
    if (cat === "new_application") return "bg-yellow-400"
    return "bg-gray-400"
  }

  const legends = [
    { key: "all", label: "All", dot: "bg-gray-400" },
    { key: "approved", label: "Approved", dot: "bg-green-500" },
    { key: "declined", label: "Declined", dot: "bg-red-500" },
    { key: "appointment", label: "Appointment", dot: "bg-blue-500" },
    { key: "renewal", label: "Renewal", dot: "bg-orange-500" },
    { key: "new_application", label: "New Application", dot: "bg-yellow-400" },
  ]

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id)
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
    }

    const title = notif.title?.toLowerCase() || ""
    const message = notif.message?.toLowerCase() || ""

    if (title.includes("appointment") || message.includes("appointment")) {
      navigate("/admin/appointments")
    } else if (notif.application_id) {
      navigate(`/admin/applications/${notif.application_id}`)
    } else if (title.includes("application") || message.includes("application") || title.includes("approved") || title.includes("declined") || title.includes("renewal")) {
      navigate("/admin/applications")
    } else {
      navigate("/admin/dashboard")
    }
  }

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false)
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
  }

  const getRedirectLabel = (notif) => {
    const title = notif.title?.toLowerCase() || ""
    const message = notif.message?.toLowerCase() || ""
    if (title.includes("appointment") || message.includes("appointment")) return "→ View Appointments"
    if (title.includes("approved") || title.includes("declined") || title.includes("renewal")) return "→ View Applications"
    if (title.includes("application") || message.includes("application")) return "→ View Applications"
    return "→ Go to Dashboard"
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "numeric", day: "numeric", year: "numeric",
    }) + " – " + new Date(date).toLocaleTimeString("en-PH", {
      hour: "numeric", minute: "2-digit", hour12: true,
    })
  }

  // Apply both read/unread filter and legend/category filter
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">

          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
              🔔 Notification Panel
            </h1>
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={markAllAsRead}
                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition"
              >
                Mark All as Read
              </button>
            )}
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
                  {/* Status Dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`w-3 h-3 rounded-full ${statusDot(notif)}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${notif.is_read ? "text-gray-500" : "text-gray-800"}`}>
                      {notif.title}
                    </p>
                    <p className={`text-xs mt-0.5 ${notif.is_read ? "text-gray-400" : "text-gray-600"}`}>
                      {notif.message}
                    </p>
                    {notif.profiles?.full_name && (
                      <p className="text-xs text-orange-500 mt-1 font-medium">
                        👤 {notif.profiles.full_name}
                      </p>
                    )}
                    <p className="text-xs text-blue-400 mt-1 font-medium">
                      {getRedirectLabel(notif)}
                    </p>
                  </div>

                  {/* Time & Badge */}
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