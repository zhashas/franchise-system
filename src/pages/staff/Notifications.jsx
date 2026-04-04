import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import StaffLayout from "../../components/StaffLayout"

export default function StaffNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchNotifications = async () => {
      // Staff sees notifications sent TO admin (from applicants) and system notifications
      const { data } = await supabase
        .from("notifications")
        .select("*, profiles!notifications_sender_id_fkey(full_name)")
        .in("recipient_type", ["admin", "staff"])
        .order("created_at", { ascending: false })
      setNotifications(data || [])
      setLoading(false)
    }
    fetchNotifications()
  }, [])

  const getCategory = (n) => {
    const type  = n.notification_type || ""
    const title = n.title?.toLowerCase() || ""
    if (type.includes("mtop_sticker"))       return "mtop_reminder"
    if (type.includes("expiry_warning_30"))  return "expiry_30"
    if (type.includes("expiry_warning_15"))  return "expiry_15"
    if (type.includes("application") || title.includes("application"))  return "application"
    if (type.includes("appointment") || title.includes("appointment"))  return "appointment"
    return "other"
  }

  const catStyles = {
    mtop_reminder: { dot: "bg-blue-500",   label: "MTOP Reminder" },
    expiry_30:     { dot: "bg-orange-500", label: "Expiry – 30 Days" },
    expiry_15:     { dot: "bg-red-500",    label: "Expiry – 15 Days" },
    application:   { dot: "bg-green-500",  label: "Application" },
    appointment:   { dot: "bg-purple-500", label: "Appointment" },
    other:         { dot: "bg-gray-400",   label: "Other" },
  }

  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).in("recipient_type", ["admin", "staff"]).eq("is_read", false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleClick = async (n) => {
    if (!n.is_read) await markRead(n.id)
    if (n.application_id) navigate(`/staff/applications/${n.application_id}`)
    else if (getCategory(n) === "appointment") navigate("/staff/appointments")
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" }) + " – " + new Date(d).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read
    if (filter === "read")   return n.is_read
    return true
  })

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-800 uppercase">🔔 Staff Notifications</h1>
            <button onClick={markAllRead} disabled={notifications.every(n => n.is_read)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${notifications.every(n => n.is_read) ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white"}`}>
              Mark All as Read
            </button>
          </div>

          {/* Filter tabs */}
          <div className="px-6 py-3 border-b bg-white flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <div className="flex gap-2">
              {["all", "unread", "read"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition ${filter === f ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-orange-50"}`}>
                  {f}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-gray-400">{notifications.filter(n => !n.is_read).length} unread</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-orange-500 font-semibold">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">🔔</p><p className="font-medium">No notifications found.</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(n => {
                const cat = getCategory(n)
                const style = catStyles[cat]
                return (
                  <div key={n.id} onClick={() => handleClick(n)}
                    className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition ${n.is_read ? "bg-white hover:bg-gray-50" : "bg-orange-50 hover:bg-orange-100"}`}>
                    <div className="flex-shrink-0 mt-1.5"><div className={`w-3 h-3 rounded-full ${style.dot}`} /></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${n.is_read ? "text-gray-500" : "text-gray-800"}`}>{n.title}</p>
                      <p className={`text-xs mt-0.5 ${n.is_read ? "text-gray-400" : "text-gray-600"}`}>{n.message}</p>
                      <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{style.label}</span>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(n.created_at)}</p>
                      {!n.is_read
                        ? <span className="inline-block mt-1 text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">New</span>
                        : <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Read</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  )
}