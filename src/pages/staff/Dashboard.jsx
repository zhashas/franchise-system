import { useEffect, useState} from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import StaffLayout from "../../components/StaffLayout"

const toDateObj = (str) => new Date(str + "T00:00:00")
const diffDays  = (a, b) => Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000)
const todayStr  = () => new Date().toISOString().split("T")[0]
const fmtDate   = (str) => toDateObj(str).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

export default function StaffDashboard() {
  const [profile,      setProfile]      = useState(null)
  const [franchises,   setFranchises]   = useState([])
  const [applications, setApplications] = useState([])
  const [appointments, setAppointments] = useState([])
  const navigate = useNavigate()

useEffect(() => {
  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: prof }, { data: fr }, { data: apps }, { data: apts }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("franchises").select("*").order("created_at", { ascending: false }),
      supabase.from("applications")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("appointments")
        .select("*, profiles(full_name)")
        .order("scheduled_date", { ascending: true })
        .limit(5),
    ])

    setProfile(prof)
    setFranchises(fr || [])
    setApplications(apps || [])
    setAppointments(apts || [])
  }

  fetchAll()
}, [])

  const getDaysUntilExpiry = (d) => d ? diffDays(d, todayStr()) : null

  const stats = [
    { label: "Total Franchise Records", value: franchises.length,                                          icon: "🏢", color: "bg-orange-50 border-orange-200", text: "text-orange-600" },
    { label: "Active Franchises",       value: franchises.filter(f => f.status === "active").length,       icon: "✅", color: "bg-green-50 border-green-200",   text: "text-green-600" },
    { label: "Expired Franchises",      value: franchises.filter(f => f.status === "expired").length,      icon: "⛔", color: "bg-red-50 border-red-200",       text: "text-red-600" },
    { label: "Available Slots",         value: franchises.filter(f => f.status === "available").length,    icon: "🟡", color: "bg-yellow-50 border-yellow-200", text: "text-yellow-600" },
    { label: "Pending Applications",    value: applications.filter(a => a.status === "pending").length,    icon: "📋", color: "bg-blue-50 border-blue-200",     text: "text-blue-600" },
    { label: "Today's Appointments",    value: appointments.filter(a => a.scheduled_date === todayStr()).length, icon: "📅", color: "bg-purple-50 border-purple-200", text: "text-purple-600" },
  ]

  const expiringSoon = franchises.filter(f => {
    if (f.status !== "active") return false
    const d = getDaysUntilExpiry(f.expiration_date)
    return d !== null && d <= 30 && d > 0
  })

  const statusColor = (s) => {
    if (s === "approved")     return "bg-green-100 text-green-700"
    if (s === "rejected")     return "bg-red-100 text-red-700"
    if (s === "under_review") return "bg-blue-100 text-blue-700"
    if (s === "for_release")  return "bg-purple-100 text-purple-700"
    return "bg-yellow-100 text-yellow-700"
  }

  const aptColor = (s) => {
    if (s === "completed") return "bg-green-100 text-green-700"
    if (s === "cancelled") return "bg-red-100 text-red-700"
    return "bg-blue-100 text-blue-700"
  }

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-xl p-6 border bg-orange-100">
          <h1 className="text-xl font-bold">STAFF DASHBOARD</h1>
          <p className="text-sm mt-1">Welcome back, {profile?.full_name}. Here's today's overview.</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <div key={i} className={`p-4 rounded-lg shadow-sm border ${s.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{s.icon}</span>
                <span className={`text-3xl font-bold ${s.text}`}>{s.value}</span>
              </div>
              <p className="text-xs font-medium text-gray-600 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* EXPIRING SOON ALERT */}
        {expiringSoon.length > 0 && (
          <div className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-3 text-sm text-orange-800">
            <p className="font-bold mb-1">⚠️ Franchises Expiring Within 30 Days</p>
            <ul className="list-disc list-inside space-y-0.5 text-orange-700 text-xs">
              {expiringSoon.map(f => (
                <li key={f.id}>
                  <strong>{f.franchise_number}</strong> — {f.owner_name} — expires <strong>{fmtDate(f.expiration_date)}</strong>
                  {" "}({getDaysUntilExpiry(f.expiration_date)} days left)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "APPLICATIONS",      path: "/staff/applications",       color: "bg-green-100 hover:bg-green-200 border-green-300" },
            { label: "APPOINTMENTS",      path: "/staff/appointments",       color: "bg-blue-100 hover:bg-blue-200 border-blue-300" },
            { label: "REPORTS",           path: "/staff/reports",            color: "bg-purple-100 hover:bg-purple-200 border-purple-300" },
            { label: "MANUAL APPLICATION",path: "/staff/manual-application", color: "bg-orange-100 hover:bg-orange-200 border-orange-300" },
          ].map((btn, i) => (
            <button key={i} onClick={() => navigate(btn.path)}
              className={`p-5 border rounded-md font-bold text-black shadow-sm transition ${btn.color}`}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* RECENT APPLICATIONS & APPOINTMENTS */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Recent Applications */}
          <div className="border rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h2 className="font-bold text-sm text-gray-800">📋 Recent Applications</h2>
              <button onClick={() => navigate("/staff/applications")}
                className="text-xs text-blue-500 hover:underline">View All →</button>
            </div>
            {applications.length === 0
              ? <p className="text-xs text-gray-400 text-center py-4">No applications yet.</p>
              : applications.map(a => (
                <div key={a.id} onClick={() => navigate(`/staff/applications/${a.id}`)}
                  className="flex justify-between items-center py-2 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded px-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.profiles?.full_name || "—"}</p>
                    <p className="text-xs text-gray-400">{a.type} · {new Date(a.created_at).toLocaleDateString("en-PH")}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${statusColor(a.status)}`}>
                    {a.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))
            }
          </div>

          {/* Upcoming Appointments */}
          <div className="border rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <h2 className="font-bold text-sm text-gray-800">📅 Upcoming Appointments</h2>
              <button onClick={() => navigate("/staff/appointments")}
                className="text-xs text-blue-500 hover:underline">View All →</button>
            </div>
            {appointments.length === 0
              ? <p className="text-xs text-gray-400 text-center py-4">No appointments yet.</p>
              : appointments.map(a => (
                <div key={a.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{a.profiles?.full_name || "—"}</p>
                    <p className="text-xs text-gray-400">{a.scheduled_date} · {a.scheduled_time}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${aptColor(a.status)}`}>
                    {a.status}
                  </span>
                </div>
              ))
            }
          </div>

        </div>
      </div>
    </StaffLayout>
  )
}