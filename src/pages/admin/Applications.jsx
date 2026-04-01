import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"

export default function AdminApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const navigate = useNavigate()

  const fetchApplications = async () => {
    try {
      const { data } = await supabase
        .from("applications")
        .select("*, profiles(full_name, email, phone)")
        .order("submitted_at", { ascending: false })
      setApplications(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const statusColor = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700"
    if (status === "rejected") return "bg-red-100 text-red-700"
    if (status === "under_review") return "bg-blue-100 text-blue-700"
    return "bg-yellow-100 text-yellow-700"
  }

  const filtered = filter === "all"
    ? applications
    : applications.filter(a => a.status === filter)

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-900">📋 Franchise Applications</h1>
          <p className="text-gray-500 text-sm">View and process tricycle franchise applications from applicants</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: applications.length, color: "border-blue-500" },
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

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["all", "pending", "under_review", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 hover:bg-orange-50 border border-gray-200"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-orange-500 font-semibold">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📄</p>
              <p>No applications found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Applicant</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Plate No.</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date Submitted</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-orange-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-blue-900">{app.profiles?.full_name}</p>
                      <p className="text-xs text-gray-400">{app.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <p>{app.profiles?.phone || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {app.details?.plate_no || app.details?.tricycle_plate || "—"}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        app.type === "renewal"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {app.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(app.status)}`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(app.submitted_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/admin/applications/${app.id}`)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        View & Process →
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