import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"

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
      <div className="max-w-6xl mx-auto">

        {/* Welcome */}
        <div className="bg-blue-900 text-white rounded-xl p-6 mb-6 border-l-4 border-orange-500">
          <h1 className="text-2xl font-bold">Admin Dashboard 🛡️</h1>
          <p className="text-blue-200 text-sm mt-1">
            Welcome back, {profile?.full_name}! Manage all franchise applications, appointments, and records.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Applications", value: applications.length, color: "border-blue-500" },
            { label: "Pending", value: applications.filter(a => a.status === "pending").length, color: "border-yellow-500" },
            { label: "Approved", value: applications.filter(a => a.status === "approved").length, color: "border-green-500" },
            { label: "Rejected", value: applications.filter(a => a.status === "rejected").length, color: "border-red-500" },
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border-t-4 ${stat.color}`}>
              <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button onClick={() => navigate("/admin/applications")} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-4 text-left shadow transition">
            <p className="text-lg font-bold">📋 Applications</p>
            <p className="text-sm text-orange-100">Review & process applications</p>
          </button>
          <button onClick={() => navigate("/admin/appointments")} className="bg-blue-800 hover:bg-blue-900 text-white rounded-xl p-4 text-left shadow transition">
            <p className="text-lg font-bold">📅 Appointments</p>
            <p className="text-sm text-blue-200">Manage scheduled appointments</p>
          </button>
          <button onClick={() => navigate("/admin/reports")} className="bg-green-700 hover:bg-green-800 text-white rounded-xl p-4 text-left shadow transition">
            <p className="text-lg font-bold">📊 Reports</p>
            <p className="text-sm text-green-200">View records & generate reports</p>
          </button>
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">📋 Recent Applications</h2>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📄</p>
              <p>No applications submitted yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Applicant</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium text-blue-900">{app.profiles?.full_name}</td>
                    <td className="py-3 capitalize">{app.type}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(app.status)}`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(app.submitted_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <button
                        onClick={() => navigate(`/admin/applications/${app.id}`)}
                        className="text-orange-500 text-xs font-medium hover:underline"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}