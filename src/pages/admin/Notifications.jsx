import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"
import { X, Clock, MapPin, CheckCircle } from "lucide-react"

const broadcastUnreadCount = (notifications) => {
  const count = notifications.filter(n => !n.is_read).length
  window.dispatchEvent(new CustomEvent("adminUnreadCount", { detail: { count } }))
}

function AppointmentModal({ notif, onClose, onNavigate }) {
  if (!notif) return null
  const fmt = (d, type) => type === "date"
    ? new Date(d).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
    : new Date(d).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-blue-500">
        <div className="bg-blue-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-3xl">📅</div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-blue-800">Appointment Request</h2>
            <p className="text-xs text-blue-500 mt-0.5">From: Applicant</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Message</p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
            {notif.profiles?.full_name && <p className="text-xs text-orange-500 mt-2 font-medium">👤 From: {notif.profiles.full_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-1"><Clock size={12} className="text-blue-500" /><p className="text-xs font-semibold text-blue-600">Received</p></div>
              <p className="text-xs font-bold text-blue-800">{fmt(notif.created_at, "date")}</p>
              <p className="text-xs text-blue-600">{fmt(notif.created_at, "time")}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
              <div className="flex items-center gap-1.5 mb-1"><CheckCircle size={12} className="text-yellow-500" /><p className="text-xs font-semibold text-yellow-700">Action</p></div>
              <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full">Needs Scheduling</span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1"><MapPin size={12} /><span>Admin Action Required:</span></div>
            <p>• Go to Appointments to set a date and time</p>
            <p>• Notify the applicant once the schedule is confirmed</p>
            <p>• Ensure the applicant brings required documents</p>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onNavigate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow">Go to Appointments →</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition">Dismiss</button>
        </div>
      </div>
    </div>
  )
}

function ApplicationModal({ notif, onClose, onNavigate }) {
  if (!notif) return null
  const isRenewal = getCategory(notif) === "renewal"
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-orange-500">
        <div className="bg-orange-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-3xl">{isRenewal ? "🔄" : "📋"}</div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-orange-800">{isRenewal ? "Renewal Request" : "New Application Received"}</h2>
            <p className="text-xs text-orange-500 mt-0.5">Awaiting your review</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Details</p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
            {notif.profiles?.full_name && <p className="text-xs text-orange-500 mt-2 font-medium">👤 Applicant: {notif.profiles.full_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-1">Received</p>
              <p className="text-xs font-bold text-gray-800">{new Date(notif.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 text-center">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Pending Review</span>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
            <p className="font-bold mb-1">📋 Review Checklist:</p>
            <p>• Verify engine number, chassis number, plate number</p>
            <p>• Check all uploaded documents are complete and valid</p>
            <p>• Approve, reject, or schedule for inspection</p>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onNavigate} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm transition shadow">View Application →</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition">Later</button>
        </div>
      </div>
    </div>
  )
}

function getCategory(notif) {
  const type  = notif.notification_type || ""
  const title = notif.title?.toLowerCase() || ""
  if (type === "application_submitted" || title.includes("new application") || title.includes("submitted")) return "new_application"
  if (type === "renewal_request"       || title.includes("renewal"))      return "renewal"
  if (type === "appointment_request"   || title.includes("appointment"))  return "appointment"
  if (type === "document_uploaded"     || title.includes("document") || title.includes("uploaded")) return "document"
  if (type === "inquiry"               || title.includes("inquiry") || title.includes("question"))  return "inquiry"
  return "other"
}

const DOT_COLORS = {
  new_application: "bg-green-500", renewal: "bg-orange-500", appointment: "bg-blue-500",
  document: "bg-purple-500", inquiry: "bg-yellow-400", other: "bg-gray-400",
}
const LEGENDS = [
  { key: "all", label: "All", dot: "bg-gray-400" },
  { key: "new_application", label: "New Application", dot: "bg-green-500" },
  { key: "renewal", label: "Renewal Request", dot: "bg-orange-500" },
  { key: "appointment", label: "Appointment", dot: "bg-blue-500" },
  { key: "document", label: "Document Upload", dot: "bg-purple-500" },
  { key: "inquiry", label: "Inquiry", dot: "bg-yellow-400" },
]
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" }) +
  " – " + new Date(date).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState("all")
  const [legendFilter,  setLegendFilter]  = useState("all")
  const [appointmentNotif, setAppointmentNotif] = useState(null)
  const [applicationNotif, setApplicationNotif] = useState(null)
  const seenIds  = useRef(new Set())
  const navigate = useNavigate()

useEffect(() => {
  let isMounted = true

  const run = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !isMounted) return

    const { data, error } = await supabase
      .from("notifications")
      .select("*, profiles!notifications_sender_id_fkey(full_name)")
      .eq("recipient_type", "admin")
      .eq("recipient_id", user.id)
      .eq("sender_type", "applicant")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch error:", error)
      return
    }

    const rows = data || []
    rows.forEach(n => seenIds.current.add(n.id))

    if (!isMounted) return

    setNotifications(rows)
    broadcastUnreadCount(rows)
    setLoading(false)
  }

  run()

  return () => {
    isMounted = false
  }
}, [])

  // ✅ Unique channel: "admin-notif-page-{userId}"
  useEffect(() => {
    let channel
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      channel = supabase
        .channel(`admin-notif-page-${user.id}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_type=eq.admin` },
          async (payload) => {
            const row = payload.new
            if (seenIds.current.has(row.id)) return
            seenIds.current.add(row.id)
            let enriched = { ...row, profiles: null }
            if (row.sender_id) {
              const { data: p } = await supabase.from("profiles").select("full_name").eq("id", row.sender_id).single()
              enriched.profiles = p || null
            }
            setNotifications(prev => {
              const updated = [enriched, ...prev]
              broadcastUnreadCount(updated)
              return updated
            })
          }
        )
        .subscribe()
    }
    setup()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id)
      const updated = notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      setNotifications(updated)
      broadcastUnreadCount(updated)
    }
    const cat = getCategory(notif)
    if (cat === "appointment") { setAppointmentNotif(notif); return }
    if (cat === "new_application" || cat === "renewal") { setApplicationNotif(notif); return }
    if (notif.application_id) navigate(`/admin/applications/${notif.application_id}`)
    else navigate("/admin/applications")
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("notifications").update({ is_read: true })
      .eq("recipient_type", "admin").eq("recipient_id", user.id).eq("is_read", false)
    const updated = notifications.map(n => ({ ...n, is_read: true }))
    setNotifications(updated)
    broadcastUnreadCount(updated)
  }

  const getClickHint = (notif) => {
    const cat = getCategory(notif)
    if (cat === "appointment")     return "📅 Tap to view appointment request"
    if (cat === "new_application") return "📋 Tap to open application"
    if (cat === "renewal")         return "🔄 Tap to open renewal"
    return null
  }

  const filtered = notifications
    .filter(n => filter === "unread" ? !n.is_read : filter === "read" ? n.is_read : true)
    .filter(n => legendFilter === "all" ? true : getCategory(n) === legendFilter)

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AdminLayout>
      {appointmentNotif && (
        <AppointmentModal notif={appointmentNotif} onClose={() => setAppointmentNotif(null)}
          onNavigate={() => { setAppointmentNotif(null); navigate("/admin/appointments") }} />
      )}
      {applicationNotif && (
        <ApplicationModal notif={applicationNotif} onClose={() => setApplicationNotif(null)}
          onNavigate={() => {
            const id = applicationNotif.application_id
            setApplicationNotif(null)
            if (id) navigate(`/admin/applications/${id}`)
            else navigate("/admin/applications")
          }} />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-3">
              🔔 Admin Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </h1>
            <button onClick={markAllAsRead}
              disabled={notifications.length === 0 || notifications.every(n => n.is_read)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                notifications.length === 0 || notifications.every(n => n.is_read)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}>Mark All as Read</button>
          </div>

          <div className="px-6 py-4 border-b bg-white">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📌 Filter by Category</p>
            <div className="flex flex-wrap gap-2">
              {LEGENDS.map((leg) => {
                const count = leg.key === "all" ? notifications.length : notifications.filter(n => getCategory(n) === leg.key).length
                return (
                  <button key={leg.key} onClick={() => setLegendFilter(leg.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      legendFilter === leg.key ? "border-gray-400 bg-gray-800 text-white shadow" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${leg.dot}`} />
                    {leg.label}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${legendFilter === leg.key ? "bg-white text-gray-800" : "bg-gray-100 text-gray-500"}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-6 py-3 border-b bg-white flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <div className="flex gap-2">
              {["all", "unread", "read"].map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition ${filter === f ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-orange-50"}`}>
                  {f}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-gray-400">{unreadCount} unread</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-orange-500 font-semibold">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔔</p>
              <p className="font-medium">No notifications found.</p>
              {legendFilter !== "all" && (
                <button onClick={() => setLegendFilter("all")} className="mt-3 text-xs text-orange-500 hover:underline">Clear category filter</button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((notif) => {
                const hint = getClickHint(notif)
                return (
                  <div key={notif.id} onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition ${notif.is_read ? "bg-white hover:bg-gray-50" : "bg-orange-50 hover:bg-orange-100"}`}>
                    <div className="flex-shrink-0 mt-1.5">
                      <div className={`w-3 h-3 rounded-full ${DOT_COLORS[getCategory(notif)] || "bg-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${notif.is_read ? "text-gray-500" : "text-gray-800"}`}>{notif.title}</p>
                      <p className={`text-xs mt-0.5 ${notif.is_read ? "text-gray-400" : "text-gray-600"}`}>{notif.message}</p>
                      {notif.profiles?.full_name && <p className="text-xs text-orange-500 mt-1 font-medium">👤 From: {notif.profiles.full_name}</p>}
                      {hint && <p className="text-xs text-blue-400 mt-1 font-medium">{hint}</p>}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(notif.created_at)}</p>
                      {!notif.is_read
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
    </AdminLayout>
  )
}