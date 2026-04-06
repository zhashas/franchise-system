import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"
import { X, Clock, MapPin, CheckCircle } from "lucide-react"

const broadcastUnreadCount = (notifications) => {
  const count = notifications.filter(n => !n.is_read).length
  window.dispatchEvent(new CustomEvent("adminUnreadCount", { detail: { count } }))
  const top10 = notifications.filter(n => !n.is_read).slice(0, 10)
  window.dispatchEvent(new CustomEvent("admin_bell_rows", { detail: top10 }))
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
  
  // First version categories
  if (type.includes("mtop_sticker"))       return "mtop_reminder"
  if (type.includes("expiry_warning_30"))  return "expiry_30"
  if (type.includes("expiry_warning_15"))  return "expiry_15"
  if (type.includes("application") || title.includes("application")) return "application"
  if (type.includes("appointment") || title.includes("appointment")) return "appointment"
  
  // Second version categories
  if (type === "application_submitted" || title.includes("new application") || title.includes("submitted")) return "new_application"
  if (type === "renewal_request" || title.includes("renewal")) return "renewal"
  if (type === "appointment_request") return "appointment"
  if (type === "document_uploaded" || title.includes("document") || title.includes("uploaded")) return "document"
  if (type === "inquiry" || title.includes("inquiry") || title.includes("question")) return "inquiry"
  
  return "other"
}

const DOT_COLORS = {
  mtop_reminder: "bg-blue-500", expiry_30: "bg-orange-500", expiry_15: "bg-red-500",
  application: "bg-green-500", appointment: "bg-purple-500",
  new_application: "bg-green-500", renewal: "bg-orange-500", 
  document: "bg-purple-500", inquiry: "bg-yellow-400", 
  other: "bg-gray-400"
}

const LEGENDS = [
  { key: "all", label: "All", dot: "bg-gray-400" },
  { key: "new_application", label: "New Application", dot: "bg-green-500" },
  { key: "renewal", label: "Renewal Request", dot: "bg-orange-500" },
  { key: "appointment", label: "Appointment", dot: "bg-blue-500" },
  { key: "document", label: "Document Upload", dot: "bg-purple-500" },
  { key: "mtop_reminder", label: "MTOP Reminder", dot: "bg-blue-500" },
  { key: "expiry_30", label: "Expiry 30 Days", dot: "bg-orange-500" },
  { key: "expiry_15", label: "Expiry 15 Days", dot: "bg-red-500" },
]

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" }) +
  " – " + new Date(date).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [legendFilter, setLegendFilter] = useState("all")
  const [appointmentNotif, setAppointmentNotif] = useState(null)
  const [applicationNotif, setApplicationNotif] = useState(null)
  const seenIds = useRef(new Set())
  const navigate = useNavigate()

    // Includes: new applications from applicants, system alerts (MTOP reminders, expiry warnings), and appointment requests from applicants. 
const fetchNotifications = useCallback(async () => {
  setLoading(true)
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*, profiles!notifications_sender_id_fkey(full_name, email)")
      .eq("recipient_type", "admin")
      // .eq("recipient_id", user.id)  // Add if you have per-user notifications
      .order("created_at", { ascending: false })

    if (error) throw error
    
    const rows = data || []
    rows.forEach(n => seenIds.current.add(n.id))
    setNotifications(rows)
    broadcastUnreadCount(rows)
  } catch (error) {
    console.error("Fetch error:", error)
  } finally {
    setLoading(false)
  }
}, []) // Empty deps = stable reference

// Single useEffect
useEffect(() => {
  fetchNotifications()
}, [fetchNotifications]) // Safe because useCallback deps=[]

  // Realtime subscriptions
  useEffect(() => {
    let channel
    let cancelled = false

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      channel = supabase
        .channel(`admin-notif-page-${user.id}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          async (payload) => {
            if (cancelled) return
            const row = payload.new
            
            if (row.recipient_type !== "admin") return
            if (row.recipient_id && row.recipient_id !== user.id) return
            
            if (seenIds.current.has(row.id)) return
            seenIds.current.add(row.id)
            
            let enriched = { ...row, profiles: null }
            if (row.notifications_sender_id) {
              const { data: p } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", row.notifications_sender_id)
                .single()
              enriched.profiles = p || null
            }
            
            setNotifications(prev => {
              const updated = [enriched, ...prev]
              broadcastUnreadCount(updated)
              return updated
            })
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') console.log('✅ Realtime notifications active')
        })
    }

    setupRealtime()
    
    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      broadcastUnreadCount(updated)
      return updated
    })
  }

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_type", "admin")
      .eq("is_read", false)
    
    const updated = notifications.map(n => ({ ...n, is_read: true }))
    setNotifications(updated)
    broadcastUnreadCount(updated)
  }

  const handleClick = async (n) => {
    if (!n.is_read) await markRead(n.id)
    
    const cat = getCategory(n)
    if (cat === "appointment") {
      setAppointmentNotif(n)
      return
    }
    if (cat === "new_application" || cat === "renewal" || cat === "application") {
      setApplicationNotif(n)
      return
    }
    
    if (n.application_id) {
      navigate(`/admin/applications/${n.application_id}`)
    } else if (cat === "appointment") {
      navigate("/admin/appointments")
    } else {
      navigate("/admin/applications")
    }
  }

  const getClickHint = (notif) => {
    const cat = getCategory(notif)
    if (cat === "appointment") return "📅 Tap to view appointment request"
    if (["new_application", "renewal", "application"].includes(cat)) return "📋 Tap to open application"
    if (cat === "mtop_reminder") return "📋 Tap for MTOP details"
    return null
  }

  const filtered = notifications
    .filter(n => filter === "unread" ? !n.is_read : filter === "read" ? n.is_read : true)
    .filter(n => legendFilter === "all" ? true : getCategory(n) === legendFilter)

  const unreadCount = notifications.filter(n => !n.is_read).length

  const senderName = (n) => n.profiles?.full_name || n.profiles?.email || "System"

  return (
    <AdminLayout>
      {appointmentNotif && (
        <AppointmentModal 
          notif={appointmentNotif} 
          onClose={() => setAppointmentNotif(null)}
          onNavigate={() => { 
            setAppointmentNotif(null) 
            navigate("/admin/appointments") 
          }} 
        />
      )}
      
      {applicationNotif && (
        <ApplicationModal 
          notif={applicationNotif} 
          onClose={() => setApplicationNotif(null)}
          onNavigate={() => {
            const id = applicationNotif.application_id
            setApplicationNotif(null)
            if (id) navigate(`/admin/applications/${id}`)
            else navigate("/admin/applications")
          }} 
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-3">
                🔔 Admin Notifications
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Incoming applications, appointments, system alerts, and franchise reminders.</p>
            </div>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                unreadCount === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
              }`}
            >
              Mark All as Read ({unreadCount})
            </button>
          </div>

          {/* Category Filter */}
          <div className="px-6 py-4 border-b bg-white">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">📌 Filter by Category</p>
            <div className="flex flex-wrap gap-2">
              {LEGENDS.map((leg) => {
                const count = leg.key === "all" 
                  ? notifications.length 
                  : notifications.filter(n => getCategory(n) === leg.key).length
                return (
                  <button 
                    key={leg.key} 
                    onClick={() => setLegendFilter(leg.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                      legendFilter === leg.key 
                        ? "border-gray-400 bg-gray-800 text-white shadow-md transform scale-105" 
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${leg.dot}`} />
                    <span>{leg.label}</span>
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      legendFilter === leg.key 
                        ? "bg-white text-gray-800 shadow-sm" 
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div className="px-6 py-3 border-b bg-white flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <div className="flex gap-2">
              {["all", "unread", "read"].map((f) => {
                const count = f === "all" ? notifications.length : 
                             f === "unread" ? unreadCount : 
                             notifications.length - unreadCount
                return (
                  <button 
                    key={f} 
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase transition-all duration-200 shadow-sm ${
                      filter === f 
                        ? "bg-orange-500 text-white shadow-md transform scale-105" 
                        : "bg-gray-100 text-gray-500 hover:bg-orange-50 hover:shadow-sm hover:scale-105"
                    }`}
                  >
                    {f} ({count})
                  </button>
                )
              })}
            </div>
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {unreadCount} unread • {filtered.length} shown
            </span>
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="text-center py-16 text-orange-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="font-semibold">Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-xl font-semibold mb-2 text-gray-500">No notifications found</p>
              <p className="text-sm mb-6 text-gray-400">
                {legendFilter !== "all" && filter !== "all" 
                  ? "Try adjusting your filters" 
                  : "All caught up! 🎉"
                }
              </p>
              {legendFilter !== "all" && (
                <button 
                  onClick={() => setLegendFilter("all")} 
                  className="text-xs text-orange-500 hover:underline font-medium"
                >
                  Clear category filter
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {filtered.map((notif) => {
                const cat = getCategory(notif)
                const style = DOT_COLORS[cat] || "bg-gray-400"
                const sender = senderName(notif)
                const hint = getClickHint(notif)

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex items-start gap-4 px-6 py-5 cursor-pointer transition-all duration-200 group hover:shadow-sm ${
                      notif.is_read 
                        ? "bg-white hover:bg-gray-50" 
                        : "bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-r-4 border-orange-400"
                    }`}
                  >
                    {/* Category Dot */}
                    <div className="flex-shrink-0 mt-2 pt-0.5">
                      <div className={`w-3.5 h-3.5 rounded-full shadow-sm ${style}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-1">
                        <span className={`text-lg flex-shrink-0 ${notif.is_read ? "opacity-60" : ""}`}>
                          {cat === "new_application" && "📄"}
                          {cat === "renewal" && "🔄"}
                          {cat === "appointment" && "📅"}
                          {cat === "mtop_reminder" && "📋"}
                          {cat === "expiry_15" && "🔴"}
                          {cat === "expiry_30" && "🟡"}
                          {["document", "application"].includes(cat) && "📎"}
                          {cat === "inquiry" && "❓"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold leading-tight ${
                            notif.is_read ? "text-gray-600" : "text-gray-900"
                          }`}>
                            {notif.title}
                          </p>
                          <p className={`text-xs leading-relaxed mt-0.5 ${
                            notif.is_read ? "text-gray-400" : "text-gray-700"
                          }`}>
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      {/* Sender & Category */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ')}
                        </span>
                        {sender && sender !== "System" && (
                          <span className="text-xs text-gray-500 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                            {sender}
                          </span>
                        )}
                        {hint && (
                          <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full font-medium group-hover:scale-105 transition">
                            {hint}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp & Status */}
                    <div className="flex-shrink-0 text-right ml-2">
                      <p className="text-xs text-gray-400 whitespace-nowrap font-mono">{formatDate(notif.created_at)}</p>
                      {!notif.is_read ? (
                        <span className="inline-block mt-1.5 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full font-bold shadow-lg transform scale-95 hover:scale-100 transition">
                          NEW
                        </span>
                      ) : (
                        <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-400 px-2.5 py-0.5 rounded-full font-medium">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-orange-50 text-xs text-gray-500 text-right">
              <div className="flex items-center justify-end gap-4">
                <span>Showing <strong>{filtered.length}</strong> of <strong>{notifications.length}</strong></span>
                <button 
                  onClick={fetchNotifications}
                  className="text-orange-500 hover:text-orange-600 font-medium hover:underline flex items-center gap-1"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}