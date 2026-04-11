import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import ApplicantLayout from "../../components/ApplicantLayout"
import { X, MapPin, CheckCircle } from "lucide-react"

// ─── Status steps builder ─────────────────────────────────────────────────────
function getStatusSteps(app) {
  if (!app) return []
  const s = app.status
  return [
    {
      key: "submitted",
      label: "Submitted",
      desc: "Application received",
      icon: "📤",
      done: true,
      active: s === "pending",
    },
    {
      key: "under_review",
      label: "Under Review",
      desc: "Documents being verified",
      icon: "🔍",
      done: ["under_review", "approved", "rejected", "for_release"].includes(s),
      active: s === "under_review",
    },
    {
      key: "appointment",
      label: "Appointment",
      desc: "Schedule confirmed",
      icon: "📅",
      done: ["approved", "rejected", "for_release"].includes(s),
      active: false,
    },
    {
      key: "decision",
      label: s === "rejected" ? "Rejected" : s === "for_release" ? "For Release" : "Approved",
      desc: s === "approved"     ? "Franchise approved!"
          : s === "rejected"    ? "Application declined"
          : s === "for_release" ? "Ready to claim"
          : "Awaiting decision",
      icon: s === "approved" ? "✅" : s === "rejected" ? "❌" : s === "for_release" ? "🏛️" : "⏳",
      done: ["approved", "rejected", "for_release"].includes(s),
      active: ["approved", "rejected", "for_release"].includes(s),
    },
  ]
}

// ─── Appointment Detail Modal ─────────────────────────────────────────────────
function AppointmentCard({ apt, onClose }) {
  if (!apt) return null
  const sc = apt.status === "confirmed" ? "bg-blue-100 text-blue-700"
           : apt.status === "completed" ? "bg-green-100 text-green-700"
           : apt.status === "cancelled" ? "bg-red-100 text-red-700"
           : "bg-yellow-100 text-yellow-700"
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-blue-500">
        <div className="bg-blue-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-3xl">📅</div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-blue-800">Appointment Details</h2>
            <p className="text-xs text-blue-500 mt-0.5">Franchise Office · San Jose</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-500 mb-1">📅 Date</p>
              <p className="text-sm font-bold text-blue-800">
                {new Date(apt.scheduled_date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-500 mb-1">🕐 Time</p>
              <p className="text-sm font-bold text-blue-800">{apt.scheduled_time}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-2">
            <p className="text-xs font-semibold text-gray-500">Status:</p>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${sc}`}>{apt.status}</span>
          </div>
          {apt.notes && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">📝 Notes</p>
              <p className="text-sm text-gray-700">{apt.notes}</p>
            </div>
          )}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1"><MapPin size={12} /><span>Reminders:</span></div>
            <p>• Visit the Municipal Hall – Business Permits Office</p>
            <p>• Bring your valid ID and original documents</p>
            <p>• Arrive at least 15 minutes early</p>
          </div>
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition">Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── Notification Detail Modal ────────────────────────────────────────────────
function NotifCard({ notif, onClose }) {
  if (!notif) return null
  const t = (notif.title || "").toLowerCase()
  const cfg = t.includes("approved")
    ? { icon: "✅", hdr: "bg-green-50", border: "border-green-500", tc: "text-green-800", next: true }
    : t.includes("rejected")
    ? { icon: "❌", hdr: "bg-red-50",   border: "border-red-500",   tc: "text-red-800",   next: false }
    : t.includes("release")
    ? { icon: "🏛️", hdr: "bg-purple-50", border: "border-purple-500", tc: "text-purple-800", next: true }
    : { icon: "🔔", hdr: "bg-orange-50", border: "border-orange-400", tc: "text-orange-800", next: false }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${cfg.border}`}>
        <div className={`${cfg.hdr} px-6 py-5 flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 text-3xl">{cfg.icon}</div>
          <div className="flex-1">
            <h2 className={`text-base font-extrabold ${cfg.tc}`}>{notif.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">From: {notif.sender_type === "system" ? "🤖 System" : "👤 Admin / Staff"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed">{notif.message}</p>
          </div>
          <p className="text-xs text-gray-400">{new Date(notif.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</p>
          {cfg.next && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
              <p className="font-bold mb-1">📋 Next Steps:</p>
              <p>• Visit the Municipal Hall – Business Permits Office</p>
              <p>• Bring a valid ID and required documents to claim your permit</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition">Dismiss</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function ApplicantDashboard() {
  const [profile,       setProfile]       = useState(null)
  const [applications,  setApplications]  = useState([])
  const [appointments,  setAppointments]  = useState([])
  const [recentNotifs,  setRecentNotifs]  = useState([])
  const [selectedApt,   setSelectedApt]   = useState(null)
  const [selectedNotif, setSelectedNotif] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: apps }, { data: apts }, { data: notifs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("applications").select("*").eq("applicant_id", user.id).order("submitted_at", { ascending: false }),
        supabase.from("appointments").select("*").eq("applicant_id", user.id).order("scheduled_date", { ascending: true }),
        supabase.from("notifications").select("*").eq("recipient_id", user.id).eq("recipient_type", "applicant").order("created_at", { ascending: false }).limit(5),
      ])
      setProfile(prof)
      setApplications(apps || [])
      setAppointments(apts || [])
      setRecentNotifs(notifs || [])
    }
    fetchData()
  }, [])

  const latestApp   = applications[0] || null
  const upcomingApt = appointments.find(a => a.status === "confirmed")
  const steps       = getStatusSteps(latestApp)

  const statusColor = (s) => {
    if (s === "approved")     return "bg-green-100 text-green-700"
    if (s === "rejected")     return "bg-red-100 text-red-700"
    if (s === "under_review") return "bg-blue-100 text-blue-700"
    if (s === "for_release")  return "bg-purple-100 text-purple-700"
    return "bg-yellow-100 text-yellow-700"
  }

  return (
    <ApplicantLayout>
      {selectedApt   && <AppointmentCard apt={selectedApt}     onClose={() => setSelectedApt(null)} />}
      {selectedNotif && <NotifCard       notif={selectedNotif} onClose={() => setSelectedNotif(null)} />}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* WELCOME */}
        <div className="rounded-xl px-6 py-5 bg-orange-50 border border-orange-200 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Good day, {profile?.full_name || "Applicant"}! 🛺</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome to your eFranchise Dashboard.</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Applications", value: applications.length,                                       color: "border-blue-400",   text: "text-blue-700" },
            { label: "Pending",            value: applications.filter(a => a.status === "pending").length,   color: "border-yellow-400", text: "text-yellow-700" },
            { label: "Approved",           value: applications.filter(a => a.status === "approved").length,  color: "border-green-400",  text: "text-green-700" },
            { label: "Appointments",       value: appointments.length,                                       color: "border-orange-400", text: "text-orange-700" },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border-t-4 ${s.color}`}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* APPLICATION STATUS TRACKER */}
        {latestApp && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-gray-800 text-sm">📋 Latest Application Status</h2>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                  {latestApp.type} · {new Date(latestApp.submitted_at || latestApp.created_at).toLocaleDateString("en-PH")}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColor(latestApp.status)}`}>
                {latestApp.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Progress steps */}
            <div className="flex items-start">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1
                const isRejected = step.key === "decision" && step.label === "Rejected"
                const circleCls = !step.done
                  ? "bg-gray-100 text-gray-400 border-2 border-gray-200"
                  : isRejected
                  ? "bg-red-500 text-white"
                  : "bg-orange-500 text-white"
                const lineCls = step.done && !isRejected ? "bg-orange-400" : "bg-gray-200"
                const labelCls = !step.done ? "text-gray-400" : isRejected ? "text-red-600" : "text-gray-800"
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                    {!isLast && (
                      <div className={`absolute top-4 left-1/2 w-full h-0.5 ${lineCls} z-0`} />
                    )}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 text-sm flex-shrink-0 ${circleCls} ${step.active ? "ring-2 ring-offset-2 ring-orange-400" : ""}`}>
                      {step.done ? step.icon : <span className="text-xs">{i + 1}</span>}
                    </div>
                    <p className={`text-xs font-bold mt-2 text-center leading-tight ${labelCls}`}>{step.label}</p>
                    <p className="text-[10px] text-gray-400 text-center mt-0.5 px-1 hidden sm:block">{step.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* Status banner */}
            {latestApp.status === "approved" && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 font-medium">
                ✅ Your franchise is <strong>approved</strong>! Visit the Municipal Hall to claim your permit.
              </div>
            )}
            {latestApp.status === "rejected" && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">
                ❌ Your application was <strong>not approved</strong>. Check notifications or contact the Franchising Unit.
              </div>
            )}
            {latestApp.status === "for_release" && (
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700 font-medium">
                🏛️ Your franchise is <strong>ready for release</strong> — visit the Municipal Hall to claim it.
              </div>
            )}
            {latestApp.status === "under_review" && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 font-medium">
                🔍 Your application is <strong>under review</strong>. An appointment may be scheduled soon.
              </div>
            )}
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => navigate("/applicant/apply")}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-5 text-left transition shadow-sm">
            <p className="text-base font-bold">➕ New Application</p>
            <p className="text-xs text-orange-100 mt-1">Submit a registration or renewal</p>
          </button>
          <button onClick={() => navigate("/applicant/appointments")}
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl p-5 text-left transition shadow-sm">
            <p className="text-base font-bold">📅 My Appointments</p>
            <p className="text-xs text-blue-200 mt-1">View your scheduled appointments</p>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">

          {/* UPCOMING APPOINTMENT */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h2 className="font-bold text-sm text-gray-800">📅 Upcoming Appointment</h2>
              <button onClick={() => navigate("/applicant/appointments")} className="text-xs text-orange-500 hover:underline font-semibold">View All →</button>
            </div>
            {!upcomingApt ? (
              <div className="text-center py-6 text-gray-400">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-xs">No upcoming appointments.</p>
              </div>
            ) : (
              <div
                onClick={() => setSelectedApt(upcomingApt)}
                className="cursor-pointer hover:bg-orange-50 rounded-xl p-4 border border-orange-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-2xl">📅</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">
                      {new Date(upcomingApt.scheduled_date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="text-xs text-gray-500">{upcomingApt.scheduled_time} · Confirmed</p>
                  </div>
                  <span className="text-xs text-orange-500 font-semibold group-hover:underline whitespace-nowrap">Tap →</span>
                </div>
              </div>
            )}
          </div>

          {/* RECENT NOTIFICATIONS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h2 className="font-bold text-sm text-gray-800">🔔 Recent Notifications</h2>
              <button onClick={() => navigate("/applicant/notifications")} className="text-xs text-orange-500 hover:underline font-semibold">View All →</button>
            </div>
            {recentNotifs.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-xs">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentNotifs.map(n => (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNotif(n)}
                    className={`cursor-pointer rounded-xl px-3 py-2.5 border transition hover:scale-[1.01] ${
                      n.is_read ? "bg-white border-gray-100 hover:border-orange-200" : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                      <p className="text-xs font-semibold text-gray-800 truncate flex-1">{n.title}</p>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(n.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5 ml-4">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ALL APPLICATIONS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-sm">📋 All Applications</h2>
            <button onClick={() => navigate("/applicant/apply")} className="text-xs text-orange-500 hover:underline font-semibold">New Application +</button>
          </div>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📄</p>
              <p className="text-sm">No applications yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="pb-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="pb-2 text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b last:border-0 hover:bg-orange-50 transition">
                      <td className="py-3 capitalize font-semibold text-gray-800">{app.type}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColor(app.status)}`}>
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(app.submitted_at || app.created_at).toLocaleDateString("en-PH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </ApplicantLayout>
  )
}