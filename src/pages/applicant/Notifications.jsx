import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ApplicantLayout from "../../components/ApplicantLayout"

export default function ApplicantNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setNotifications(data || [])
      setLoading(false)
    }
    fetchNotifications()
  }, [])

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
  }

  const filtered = filter === "all" ? notifications
    : filter === "unread" ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.is_read)

  const statusDot = (title) => {
    if (title?.includes("Approved") || title?.includes("approved")) return "bg-green-500"
    if (title?.includes("Declined") || title?.includes("rejected")) return "bg-red-500"
    return "bg-yellow-400"
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" })
      + " – " + new Date(date).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })
  }

  return (
    <ApplicantLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide">🔔 Notification Panel</h1>
            {notifications.some(n => !n.is_read) && (
              <button onClick={markAllAsRead} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium transition">
                Mark All as Read
              </button>
            )}
          </div>

          <div className="px-6 py-3 border-b bg-white flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Filter by:</span>
            <div className="flex gap-2">
              {["all", "unread", "read"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition ${filter === f ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-orange-50"}`}>
                  {f}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-gray-400">{notifications.filter(n => !n.is_read).length} unread</span>
          </div>

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
                <div key={notif.id} onClick={() => !notif.is_read && markAsRead(notif.id)}
                  className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition ${notif.is_read ? "bg-white hover:bg-gray-50" : "bg-orange-50 hover:bg-orange-100"}`}>
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-3 h-3 rounded-full ${statusDot(notif.title)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notif.is_read ? "text-gray-600" : "text-gray-800 font-semibold"}`}>{notif.message}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(notif.created_at)}</p>
                    {!notif.is_read && <span className="inline-block mt-1 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">New</span>}
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