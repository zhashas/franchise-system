import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import ApplicantLayout from "../../components/ApplicantLayout"
import { X, Clock, MapPin, CheckCircle, FileText, AlertCircle } from "lucide-react"

// ─── Broadcast unread count AND latest rows to layout bell ───────────────────
function broadcastUnread(list) {
  const count = list.filter((n) => !n.is_read).length
  localStorage.setItem("notif_unread", String(count))
  window.dispatchEvent(new CustomEvent("notif_unread_update", { detail: count }))
  const top8 = list.filter((n) => !n.is_read).slice(0, 8)
  window.dispatchEvent(new CustomEvent("notif_bell_rows", { detail: top8 }))
}

// ─── Probe column name ────────────────────────────────────────────────────────
async function probeUserIdColumn(userId) {
  for (const col of ["recipient_id", "user_id", "applicant_id", "recipient"]) {
    const { error } = await supabase.from("notifications").select("id").eq(col, userId).limit(1)
    if (!error) return col
    if (error.code !== "42703") return null
  }
  return null
}

// ─── Appointment Detail Modal ─────────────────────────────────────────────────
function AppointmentModal({ notif, onClose, onNavigate }) {
  if (!notif) return null
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-blue-500">
        <div className="bg-blue-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">📅</span>
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-blue-800">Appointment Scheduled</h2>
            <p className="text-xs text-blue-500 mt-0.5">From: Admin · Business Permits Office</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Message</p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={12} className="text-blue-500" />
                <p className="text-xs font-semibold text-blue-600">Received</p>
              </div>
              <p className="text-xs font-bold text-blue-800">{formatDate(notif.created_at)}</p>
              <p className="text-xs text-blue-600">{formatTime(notif.created_at)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} className="text-green-500" />
                <p className="text-xs font-semibold text-green-600">Status</p>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                Confirmed ✓
              </span>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <MapPin size={12} />
              <span>Appointment Reminders:</span>
            </div>
            <p>• Visit the Municipal Hall – Business Permits Office</p>
            <p>• Bring your valid ID and original documents</p>
            <p>• Arrive at least 15 minutes early</p>
            <p>• Contact the office if you need to reschedule</p>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onNavigate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow">
            View Appointments →
          </button>
          <button onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Application Detail Modal ─────────────────────────────────────────────────
function ApplicationModal({ notif, onClose, onNavigate }) {
  if (!notif) return null

  const isApproved = (notif.notification_type || "").includes("approved") ||
    (notif.title || "").toLowerCase().includes("approved")
  const isRejected = (notif.notification_type || "").includes("rejected") ||
    (notif.title || "").toLowerCase().includes("rejected")
  const isRelease  = (notif.notification_type || "").includes("release") ||
    (notif.title || "").toLowerCase().includes("release")
  const isReview   = (notif.notification_type || "").includes("review") ||
    (notif.title || "").toLowerCase().includes("review")

  const statusConfig = isApproved
    ? { icon: "✅", title: "Application Approved!", bg: "bg-green-50", border: "border-green-500", titleColor: "text-green-800", btnColor: "bg-green-500 hover:bg-green-600" }
    : isRejected
    ? { icon: "❌", title: "Application Rejected", bg: "bg-red-50", border: "border-red-500", titleColor: "text-red-800", btnColor: "bg-red-500 hover:bg-red-600" }
    : isRelease
    ? { icon: "🏛️", title: "Ready for Release!", bg: "bg-purple-50", border: "border-purple-500", titleColor: "text-purple-800", btnColor: "bg-purple-500 hover:bg-purple-600" }
    : isReview
    ? { icon: "🔍", title: "Under Review", bg: "bg-blue-50", border: "border-blue-500", titleColor: "text-blue-800", btnColor: "bg-blue-500 hover:bg-blue-600" }
    : { icon: "📋", title: "Application Update", bg: "bg-gray-50", border: "border-gray-400", titleColor: "text-gray-800", btnColor: "bg-orange-500 hover:bg-orange-600" }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${statusConfig.border}`}>
        <div className={`${statusConfig.bg} px-6 py-5 flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">{statusConfig.icon}</span>
          </div>
          <div className="flex-1">
            <h2 className={`text-base font-extrabold ${statusConfig.titleColor}`}>{statusConfig.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">From: Admin · Business Permits Office</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Notification Details</p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-1">Date</p>
              <p className="text-xs font-bold text-gray-800">
                {new Date(notif.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-1">From</p>
              <p className="text-xs font-bold text-gray-800">
                {notif.sender_type === "system" ? "🤖 System" : "👤 Admin"}
              </p>
            </div>
          </div>

          {(isApproved || isRelease) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
              <p className="font-bold mb-1">📋 Next Steps:</p>
              <p>• Visit the Municipal Hall – Business Permits Office</p>
              <p>• Bring a valid ID and any required documents</p>
              <p>• Claim your official Franchise Permit</p>
            </div>
          )}

          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 space-y-1">
              <p className="font-bold mb-1">📋 What to do next:</p>
              <p>• Review the reason for rejection above</p>
              <p>• Correct any missing or invalid documents</p>
              <p>• Contact the office for further assistance</p>
              <p>• Resubmit a new application once ready</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onNavigate}
            className={`flex-1 ${statusConfig.btnColor} text-white py-2.5 rounded-xl font-bold text-sm transition shadow`}>
            Go to Dashboard →
          </button>
          <button onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApplicantNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [diagInfo,      setDiagInfo]      = useState(null)
  const [filter,        setFilter]        = useState("all")
  // Modal states
  const [appointmentNotif,  setAppointmentNotif]  = useState(null)
  const [applicationNotif,  setApplicationNotif]  = useState(null)

  const navigate    = useNavigate()
  const userIdRef   = useRef(null)
  const idColumnRef = useRef(null)

  // ── Fetch notifications ────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (uid) => {
    const userId = uid || userIdRef.current
    if (!userId) { setLoading(false); return }

    if (!idColumnRef.current) {
      const col = await probeUserIdColumn(userId)
      if (!col) {
        setDiagInfo({ 
          type: "no_column", 
          message: "Could not find user-ID column in notifications table.\n\nTried: recipient_id, user_id, applicant_id, recipient\n\n➡️ Run fix_notifications_table.sql in Supabase → SQL Editor." 
        })
        setLoading(false); 
        broadcastUnread([]); 
        return
      }
      idColumnRef.current = col
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq(idColumnRef.current, userId)
      .order("created_at", { ascending: false })

    if (error) {
      setDiagInfo({ type: "fetch_error", message: `${error.code}: ${error.message}` })
      setLoading(false); 
      broadcastUnread([]); 
      return
    }

    const rows = (data || []).filter(n => !n.recipient_type || n.recipient_type === "applicant")
    setNotifications(rows)
    broadcastUnread(rows)
    setDiagInfo(null)
    setLoading(false)
  }, [])

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      userIdRef.current = user.id
      await fetchNotifications(user.id)
    }
    load()
  }, [fetchNotifications])

  // ── Refetch on tab focus ──────────────────────────────────────────────────
  useEffect(() => {
    const h = () => { if (document.visibilityState === "visible") fetchNotifications() }
    document.addEventListener("visibilitychange", h)
    return () => document.removeEventListener("visibilitychange", h)
  }, [fetchNotifications])

  // ── Realtime subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    let channel
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const userId = user.id

      const isMyRow = (row) => {
        const col = idColumnRef.current
        if (!col) return false
        return row[col] === userId && (!row.recipient_type || row.recipient_type === "applicant")
      }

      channel = supabase
        .channel(`notif-page-${userId}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => {
            const row = payload.new
            if (!isMyRow(row)) return
            setNotifications((prev) => {
              if (prev.some(n => n.id === row.id)) return prev
              const updated = [row, ...prev]
              broadcastUnread(updated)
              return updated
            })
          }
        )
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications" },
          (payload) => {
            const row = payload.new
            if (!isMyRow(row)) return
            setNotifications((prev) => {
              const updated = prev.map(n => n.id === row.id ? { ...n, ...row } : n)
              broadcastUnread(updated)
              return updated
            })
          }
        )
        .subscribe((status, err) => {
          if (err) console.warn("[Notifications] Realtime error:", err)
        })
    }
    setup()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [fetchNotifications])

  // ── Mark single notification read ─────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      broadcastUnread(updated)
      return updated
    })
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
  }

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    if (!unread.length) return
    
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, is_read: true }))
      broadcastUnread(updated)
      return updated
    })
    
    await Promise.all(unread.map(n =>
      supabase.from("notifications").update({ is_read: true }).eq("id", n.id)
    ))
  }

  // ── Handle notification click (mark read + modal/navigation) ──────────────
  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markRead(notif.id)
    }

    const type  = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""

    // Appointment → appointment modal
    if (type.includes("appointment") || title.includes("appointment")) {
      setAppointmentNotif(notif)
      return
    }

    // Application status → application modal
    if (
      type.includes("status_") ||
      type.includes("approved") || type.includes("rejected") ||
      title.includes("approved") || title.includes("rejected") ||
      title.includes("review") || title.includes("release")
    ) {
      setApplicationNotif(notif)
      return
    }

    // Default navigation
    if (notif.application_id) {
      navigate("/applicant/applications")
    } else {
      navigate("/applicant/dashboard")
    }
  }

   // ── UI helpers ────────────────────────────────────────────────────────────
  const statusDot = (notif) => {
    const type  = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""
    if (type === "status_approved"     || title.includes("approved"))    return "bg-green-500"
    if (type === "status_rejected"     || title.includes("rejected"))    return "bg-red-500"
    if (type === "status_for_release"  || title.includes("release"))     return "bg-purple-500"
    if (type === "status_under_review" || title.includes("review"))      return "bg-blue-500"
    if (type.includes("appointment")   || title.includes("appointment")) return "bg-orange-500"
    if (type.includes("franchise_expired") || title.includes("expired")) return "bg-red-600"
    if (type.includes("expiry_warning") || title.includes("expir"))      return "bg-orange-400"
    if (type.includes("mtop")          || title.includes("mtop"))        return "bg-sky-400"
    if (type.includes("renewal")       || title.includes("renewal"))     return "bg-amber-400"
    return "bg-gray-400"
  }

  const senderBadge = (notif) =>
    notif.sender_type === "system"
      ? <span className="inline-block text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">🤖 System</span>
      : <span className="inline-block text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">👤 Admin</span>

  const getTypePill = (notif) => {
    const type  = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""
    if (type === "status_approved"     || title.includes("approved"))    return { label: "Approved",     cls: "bg-green-100 text-green-700" }
    if (type === "status_rejected"     || title.includes("rejected"))    return { label: "Rejected",     cls: "bg-red-100 text-red-700" }
    if (type === "status_for_release"  || title.includes("release"))     return { label: "For Release",  cls: "bg-purple-100 text-purple-700" }
    if (type === "status_under_review" || title.includes("review"))      return { label: "Under Review", cls: "bg-blue-100 text-blue-700" }
    if (type.includes("appointment")   || title.includes("appointment")) return { label: "Appointment",  cls: "bg-orange-100 text-orange-700" }
    if (type.includes("expiry")        || title.includes("expir"))       return { label: "Expiry",       cls: "bg-orange-100 text-orange-700" }
    if (type.includes("mtop")          || title.includes("mtop"))        return { label: "MTOP",         cls: "bg-sky-100 text-sky-700" }
    return null
  }

  const getClickHint = (notif) => {
    const type  = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""
    if (type.includes("appointment") || title.includes("appointment")) return "📅 Tap to view appointment details"
    if (title.includes("approved"))   return "✅ Tap to view approval details"
    if (title.includes("rejected"))   return "❌ Tap to view rejection reason"
    if (title.includes("review"))     return "🔍 Tap to check status update"
    if (title.includes("release"))    return "🏛️ Tap to get release instructions"
    return null
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" }) +
    " – " +
    new Date(date).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered =
    filter === "unread" ? notifications.filter(n => !n.is_read) :
    filter === "read"   ? notifications.filter(n =>  n.is_read) :
    notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <ApplicantLayout>
      {/* ── Modals ── */}
      {appointmentNotif && (
        <AppointmentModal
          notif={appointmentNotif}
          onClose={() => setAppointmentNotif(null)}
          onNavigate={() => { 
            setAppointmentNotif(null); 
            navigate("/applicant/appointments") 
          }}
        />
      )}
      {applicationNotif && (
        <ApplicationModal
          notif={applicationNotif}
          onClose={() => setApplicationNotif(null)}
          onNavigate={() => { 
            setApplicationNotif(null); 
            navigate("/applicant/applications") 
          }}
        />
      )}

      <div className="max-w-7xl mx-auto md:max-w-7xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-25 px-6 py-6 border-b border-orange-100">
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔔</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-xl font-black text-gray-900 uppercase tracking-tight">
                    My Notifications
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Updates from the Franchise Office about your applications and appointments
                  </p>
                </div>
              </div>
              <button 
                onClick={markAllRead} 
                disabled={unreadCount === 0}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg transform hover:scale-[1.02] ${
                  unreadCount === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25"
                }`}
              >
                {unreadCount === 0 ? "All Caught Up!" : `Mark All Read (${unreadCount})`}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Filter:</span>
                <div className="flex gap-2">
                  {["all", "unread", "read"].map((f) => (
                    <button 
                      key={f} 
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase transition-all shadow-sm hover:shadow-md ${
                        filter === f 
                          ? "bg-orange-500 text-white shadow-orange-300/50" 
                          : "bg-white text-gray-600 hover:bg-orange-50 border border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      {f}
                      {f === "unread" && unreadCount > 0 && (
                        <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold min-w-[1.5rem] h-[1.5rem] flex items-center justify-center">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-500 ml-auto text-right">
                <span className="font-semibold text-orange-600">{unreadCount}</span> unread • 
                <span className="font-semibold text-gray-700 ml-1">{notifications.length}</span> total
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-lg font-semibold">Loading notifications...</p>
              <p className="text-sm">Fetching updates from the Franchise Office</p>
            </div>
          ) : diagInfo ? (
            <div className="mx-6 my-12 bg-amber-50 border-2 border-amber-300 rounded-2xl p-8 text-sm">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Notifications Setup Required</h3>
                  <pre className="whitespace-pre-wrap break-words bg-amber-100 rounded-xl p-4 text-amber-900 font-mono text-sm">{diagInfo.message}</pre>
                </div>
              </div>
              <button 
                onClick={() => { idColumnRef.current = null; setLoading(true); fetchNotifications() }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                🔄 Retry After Fixing Table
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-lg">
                <span className="text-4xl">🔔</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-500 mb-3">
                No notifications yet
              </h3>
              <p className="text-lg max-w-md mx-auto leading-relaxed">
                {filter === "unread"
                  ? "🎉 You're all caught up! No unread notifications."
                  : "Notifications from the Franchise Office will appear here when you receive updates about your applications and appointments."
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {filtered.map((notif) => {
                const pill  = getTypePill(notif)
                const hint  = getClickHint(notif)
                const isInteractive = !!hint || notif.application_id
                return (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-4 p-6 cursor-pointer transition-all group hover:shadow-md hover:-translate-y-0.5 ${
                      notif.is_read
                        ? "bg-white hover:bg-gray-50" 
                        : "bg-gradient-to-r from-orange-50 to-orange-25 border-l-4 border-orange-400 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Status Dot */}
                    <div className="flex-shrink-0 mt-2">
                      <div className={`w-4 h-4 rounded-full shadow-sm ${statusDot(notif)} ring-2 ring-white/50 group-hover:scale-110 transition-transform`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <p className={`text-base font-bold leading-tight ${
                            notif.is_read 
                              ? "text-gray-600 group-hover:text-gray-800" 
                              : "text-gray-900 group-hover:text-orange-900"
                          }`}>
                            {notif.title}
                          </p>
                          {pill && (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${pill.cls}`}>
                              {pill.label}
                            </span>
                          )}
                        </div>
                        {senderBadge(notif)}
                      </div>
                      
                      <p className={`text-sm leading-relaxed mb-3 ${
                        notif.is_read ? "text-gray-500" : "text-gray-700"
                      }`}>
                        {notif.message}
                      </p>

                      {/* Click hint for interactive notifications */}
                      {isInteractive && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 group-hover:bg-blue-100 transition-all">
                          <span>{hint || "📋 Tap to view details"}</span>
                          <span className="w-4 h-4 text-blue-500">→</span>
                        </div>
                      )}
                    </div>

                    {/* Timestamp & Status */}
                    <div className="flex-shrink-0 text-right space-y-2">
                      <p className="text-xs text-gray-400 whitespace-nowrap font-mono tracking-wide">
                        {formatDate(notif.created_at)}
                      </p>
                      {!notif.is_read ? (
                        <div className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          New
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full font-medium">
                          ✓ Read
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ApplicantLayout>
  )
}