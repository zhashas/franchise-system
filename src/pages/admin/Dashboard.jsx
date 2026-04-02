import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"

/* DESIGN TOKENS */
const tokens = {
  primary: "#FECE14",
  secondary: "#000000",
  surface: "#FFFFFF",
  text: "#111827",
  border: "#E5E7EB",
  success: "#16A34A",
  info: "#2563EB",
  warning: "#D97706",
  danger: "#DC2626"
}

export default function AdminDashboard() {
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single()
      setProfile(profileData)

      const { data: apps } = await supabase
        .from("applications")
        .select("*, profiles(full_name)")
        .order("submitted_at", { ascending: false })
      setApplications(apps || [])
    }
    fetchData()
  }, [])

  const statusColor = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700"
    if (status === "rejected") return "bg-red-100 text-red-700"
    if (status === "under_review") return "bg-blue-100 text-blue-700"
    return "bg-yellow-100 text-yellow-700"
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ✨ DASHBOARD HEADER (ORANGE PAPER STYLE) */}
        <div
          className="rounded-xl p-6 border"
          style={{
            background: "#FFF7ED", // very light orange (paper feel)
            border: "1px solid #FED7AA",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <h1 style={{ color: "#000000", fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
            DASHBOARD
            </h1>

          <p className="text-sm mt-1" style={{ color: "#000000" }}>
            Welcome back, {profile?.full_name}. Manage applications and system activity.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: applications.length },
            { label: "Pending", value: applications.filter(a => a.status === "pending").length },
            { label: "Approved", value: applications.filter(a => a.status === "approved").length },
            { label: "Rejected", value: applications.filter(a => a.status === "rejected").length },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border bg-white"
              style={{ borderColor: tokens.border }}
            >
              <p className="text-2xl font-semibold text-black">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* Applications */}
          <button
            onClick={() => navigate("/admin/applications")}
            className="p-4 rounded-lg text-left transition"
            style={{
              background: "#ECFDF5",
              border: "1px solid #BBF7D0"
            }}
          >
            <p className="font-semibold text-green-700">Applications</p>
            <p className="text-xs text-green-600 mt-1">
              Review and process applications
            </p>
          </button>

          {/* Appointments */}
          <button
            onClick={() => navigate("/admin/appointments")}
            className="p-4 rounded-lg text-left transition"
            style={{
              background: "#EFF6FF",
              border: "1px solid #BFDBFE"
            }}
          >
            <p className="font-semibold text-blue-700">Appointments</p>
            <p className="text-xs text-blue-600 mt-1">
              Manage schedules
            </p>
          </button>

          {/* Reports */}
          <button
            onClick={() => navigate("/admin/reports")}
            className="p-4 rounded-lg text-left transition"
            style={{
              background: "#FEFCE8",
              border: "1px solid #FEF08A"
            }}
          >
            <p className="font-semibold text-yellow-700">Reports</p>
            <p className="text-xs text-yellow-600 mt-1">
              View analytics and data
            </p>
          </button>

        </div>

        {/* TABLE */}
        <div
          className="rounded-lg border bg-white"
          style={{ borderColor: tokens.border }}
        >

          <div className="p-4 border-b">
            <h2 className="font-semibold text-black">
              Recent Applications
            </h2>
          </div>

          {applications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No applications found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2">Applicant</th>
                    <th className="text-left px-4 py-2">Type</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-black">
                        {app.profiles?.full_name}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {app.type}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColor(app.status)}`}>
                          {app.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/admin/applications/${app.id}`)}
                          className="text-sm font-medium hover:underline"
                          style={{ color: tokens.primary }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  )
}