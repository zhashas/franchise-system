import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import StaffLayout from "../../components/StaffLayout"

export default function StaffNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState("all")

  // Compose modal
  const [showCompose,   setShowCompose]   = useState(false)
  const [applicants,    setApplicants]    = useState([])
  const [sending,       setSending]       = useState(false)
  const [sendSuccess,   setSendSuccess]   = useState("")
  const [sendError,     setSendError]     = useState("")
  const [compose, setCompose] = useState({
    recipient_id: "",
    title: "",
    message: "",
    notification_type: "general_update",
  })

  const navigate = useNavigate()

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*, profiles!notifications_sender_id_fkey(full_name)")
      .in("recipient_type", ["admin", "staff"])
      .order("created_at", { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  const loadApplicants = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "applicant")
      .order("full_name")
    setApplicants(data || [])
  }

  useEffect(() => {
    (async () => {
      await fetchNotifications()
      await loadApplicants()
    })()
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    setSendError(""); setSendSuccess("")
    if (!compose.recipient_id) { setSendError("Please select a recipient."); return }
    if (!compose.title.trim()) { setSendError("Title is required."); return }
    if (!compose.message.trim()) { setSendError("Message is required."); return }

    setSending(true)
    const { error } = await supabase.from("notifications").insert({
      recipient_id:      compose.recipient_id,
      recipient_type:    "applicant",
      sender_type:       "staff",
      notification_type: compose.notification_type,
      title:             compose.title.trim(),
      message:           compose.message.trim(),
      is_read:           false,
    })

    if (error) {
      setSendError("Failed to send: " + error.message)
    } else {
      setSendSuccess("✅ Notification sent successfully!")
      setCompose({ recipient_id: "", title: "", message: "", notification_type: "general_update" })
      setTimeout(() => { setSendSuccess(""); setShowCompose(false) }, 2000)
    }
    setSending(false)
  }

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

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" }) +
    " – " +
    new Date(d).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read
    if (filter === "read")   return n.is_read
    return true
  })

  const notifTypes = [
    { value: "general_update",         label: "📢 General Update" },
    { value: "status_update",          label: "🔄 Status Update" },
    { value: "document_request",       label: "📎 Document Request" },
    { value: "appointment_scheduled",  label: "📅 Appointment Notice" },
    { value: "reminder",               label: "⏰ Reminder" },
  ]

  return (
    <StaffLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center flex-wrap gap-3">
            <h1 className="text-lg font-bold text-gray-800 uppercase">🔔 Notifications</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCompose(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                ✉️ Send Notification
              </button>
              <button
                onClick={markAllRead}
                disabled={notifications.every(n => n.is_read)}
                className={`text-xs px-3 py-2 rounded-lg font-medium transition ${
                  notifications.every(n => n.is_read)
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-black text-white"
                }`}
              >
                Mark All Read
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="px-6 py-3 border-b bg-white flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Filter:</span>
            <div className="flex gap-2">
              {["all", "unread", "read"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase transition ${
                    filter === f ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-orange-50"
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

          {loading ? (
            <div className="text-center py-12 text-orange-500 font-semibold animate-pulse">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">🔔</p>
              <p className="font-medium">No notifications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map(n => {
                const cat = getCategory(n)
                const style = catStyles[cat]
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition ${
                      n.is_read ? "bg-white hover:bg-gray-50" : "bg-orange-50 hover:bg-orange-100"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1.5">
                      <div className={`w-3 h-3 rounded-full ${style.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${n.is_read ? "text-gray-500" : "text-gray-800"}`}>{n.title}</p>
                      <p className={`text-xs mt-0.5 ${n.is_read ? "text-gray-400" : "text-gray-600"}`}>{n.message}</p>
                      {n.profiles?.full_name && (
                        <p className="text-xs text-orange-500 mt-0.5">👤 {n.profiles.full_name}</p>
                      )}
                      <span className="inline-block mt-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {style.label}
                      </span>
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

      {/* COMPOSE MODAL */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg shadow-2xl border border-gray-200">
            <div className="flex justify-between items-start mb-5 pb-4 border-b">
              <div>
                <h2 className="text-base font-bold text-gray-800">✉️ Send Notification</h2>
                <p className="text-xs text-gray-400 mt-1">Notify an applicant with updates or reminders.</p>
              </div>
              <button onClick={() => { setShowCompose(false); setSendError(""); setSendSuccess("") }}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none">✕</button>
            </div>

            {sendSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4">{sendSuccess}</div>
            )}
            {sendError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">{sendError}</div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Recipient <span className="text-red-500">*</span>
                </label>
                <select
                  value={compose.recipient_id}
                  onChange={e => setCompose({ ...compose, recipient_id: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="">-- Select applicant --</option>
                  {applicants.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name} — {a.email}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notification Type</label>
                <select
                  value={compose.notification_type}
                  onChange={e => setCompose({ ...compose, notification_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  {notifTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={compose.title}
                  onChange={e => setCompose({ ...compose, title: e.target.value })}
                  placeholder="e.g. Please submit missing document"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={compose.message}
                  onChange={e => setCompose({ ...compose, message: e.target.value })}
                  rows={4}
                  placeholder="Write your notification message here…"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2.5 rounded-xl transition disabled:opacity-60"
                >
                  {sending ? "Sending…" : "Send Notification"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCompose(false); setSendError(""); setSendSuccess("") }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  )
}