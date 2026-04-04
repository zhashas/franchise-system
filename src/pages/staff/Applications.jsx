import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import StaffLayout from "../../components/StaffLayout"

export default function StaffApplications() {
  const [applications, setApplications] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState("all")
  const navigate = useNavigate()

useEffect(() => {
  const fetchApplications = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, profiles(full_name, email, phone)")
      .order("created_at", { ascending: false })

    setApplications(data || [])
    setLoading(false)
  }

  fetchApplications()
}, [])

  const statusColor = (s) => {
    if (s === "approved")     return "bg-green-100 text-green-700"
    if (s === "rejected")     return "bg-red-100 text-red-700"
    if (s === "under_review") return "bg-blue-100 text-blue-700"
    if (s === "for_release")  return "bg-purple-100 text-purple-700"
    return "bg-yellow-100 text-yellow-700"
  }

  const stats = [
    { key: "all",          label: "Total",        value: applications.length,                                         color: "#6B7280", bg: "#F3F4F6" },
    { key: "pending",      label: "Pending",       value: applications.filter(a => a.status === "pending").length,    color: "#D97706", bg: "#FFFBEB" },
    { key: "under_review", label: "Under Review",  value: applications.filter(a => a.status === "under_review").length, color: "#2563EB", bg: "#EFF6FF" },
    { key: "approved",     label: "Approved",      value: applications.filter(a => a.status === "approved").length,  color: "#16A34A", bg: "#ECFDF5" },
    { key: "rejected",     label: "Rejected",      value: applications.filter(a => a.status === "rejected").length,  color: "#DC2626", bg: "#FEF2F2" },
    { key: "for_release",  label: "For Release",   value: applications.filter(a => a.status === "for_release").length, color: "#7C3AED", bg: "#F5F3FF" },
  ]

  const filtered = filter === "all" ? applications : applications.filter(a => a.status === filter)

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="rounded-xl p-6 border bg-green-50 border-green-200">
          <h1 className="text-xl font-bold">APPLICATIONS</h1>
          <p className="text-sm mt-1 text-gray-600">View and monitor all submitted franchise applications.</p>
        </div>

        {/* FILTER STATS */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {stats.map(s => (
            <div key={s.key} onClick={() => setFilter(s.key)}
              className={`p-4 rounded-lg border cursor-pointer transition ${filter === s.key ? "ring-2 ring-black scale-[1.02]" : "hover:scale-[1.01]"}`}
              style={{ background: s.bg, borderColor: s.color }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: s.color }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><p className="text-3xl mb-2">📄</p><p className="text-gray-400">No applications found.</p></div>
          ) : filtered.map(app => (
            <div key={app.id} onClick={() => navigate(`/staff/applications/${app.id}`)}
              className="border rounded-xl p-4 bg-white hover:bg-gray-50 transition cursor-pointer">
              <div className="flex justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-gray-800">{app.profiles?.full_name || "Unknown"}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${statusColor(app.status)}`}>
                      {app.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span>📧 {app.profiles?.email || "—"}</span>
                    <span>📞 {app.profiles?.phone || "—"}</span>
                    <span>🚗 {app.details?.plate_no || "—"}</span>
                    <span>📦 {app.type}</span>
                    <span>🗓 {new Date(app.created_at).toLocaleDateString("en-PH")}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-md bg-yellow-400 hover:bg-yellow-500 text-black">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </StaffLayout>
  )
}