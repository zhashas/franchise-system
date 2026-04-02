import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"
import { notifyApplicant } from "../../lib/notifications"

/* DESIGN TOKENS */
const tokens = {
  primary: "#FECE14",
  border: "#E5E7EB",
  paper: "#FFF7ED",
  paperBorder: "#FED7AA",
}

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

  // ✅ APPROVE
  const handleApprove = async (application) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "approved" })
        .eq("id", application.id)

      if (error) throw error

      await notifyApplicant({
        recipientId: application.applicant_id,
        title: "Application Approved",
        message: "Your application has been approved.",
        applicationId: application.id,
        notificationType: "status_update",
      })

      fetchApplications()
    } catch (err) {
      console.error("Approve error:", err.message)
    }
  }

  // ❌ REJECT
  const handleReject = async (application) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", application.id)

      if (error) throw error

      await notifyApplicant({
        recipientId: application.applicant_id,
        title: "Application Rejected",
        message:
          "Your application has been rejected. Please contact support for details.",
        applicationId: application.id,
        notificationType: "status_update",
      })

      fetchApplications()
    } catch (err) {
      console.error("Reject error:", err.message)
    }
  }

  const statusColor = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700"
    if (status === "rejected") return "bg-red-100 text-red-700"
    if (status === "under_review") return "bg-blue-100 text-blue-700"
    return "bg-yellow-100 text-yellow-700"
  }

  // ✅ FILTER LOGIC
  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter)

  // ✅ STATS CONFIG (NOW ALSO FILTERS)
  const stats = [
    {
      key: "all",
      label: "Total",
      value: applications.length,
      color: "#000",
      bg: "#F3F4F6",
    },
    {
      key: "pending",
      label: "Pending",
      value: applications.filter((a) => a.status === "pending").length,
      color: "#D97706",
      bg: "#FFFBEB",
    },
    {
      key: "under_review",
      label: "Under Review",
      value: applications.filter((a) => a.status === "under_review").length,
      color: "#2563EB",
      bg: "#EFF6FF",
    },
    {
      key: "approved",
      label: "Approved",
      value: applications.filter((a) => a.status === "approved").length,
      color: "#16A34A",
      bg: "#ECFDF5",
    },
    {
      key: "rejected",
      label: "Rejected",
      value: applications.filter((a) => a.status === "rejected").length,
      color: "#DC2626",
      bg: "#FEF2F2",
    },
  ]

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div
          className="rounded-xl p-6 border"
          style={{
            background: tokens.paper,
            border: `1px solid ${tokens.paperBorder}`,
          }}
        >
          <h1 className="text-xl font-bold text-black">APPLICATIONS</h1>
          <p className="text-sm mt-1 text-black">
            Manage and process all submitted franchise applications.
          </p>
        </div>

        {/* ✅ STATS AS FILTER */}
        <div className="grid grid-cols-5 gap-4">
          {stats.map((stat) => {
            const isActive = filter === stat.key

            return (
              <div
                key={stat.key}
                onClick={() => setFilter(stat.key)}
                className={`p-4 rounded-lg border cursor-pointer transition ${
                  isActive ? "ring-2 ring-black scale-[1.02]" : "hover:scale-[1.01]"
                }`}
                style={{
                  background: stat.bg,
                  borderColor: stat.color,
                }}
              >
                <p className="text-2xl font-semibold" style={{ color: stat.color }}>
                  {stat.value}
                </p>

                <p className="text-xs mt-1 font-medium" style={{ color: stat.color }}>
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* NAV CARDS */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📄</p>
              <p>No applications found</p>
            </div>
          ) : (
            filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/admin/applications/${app.id}`)}
                className="group border rounded-xl p-4 bg-white hover:bg-gray-50 transition cursor-pointer"
                style={{ borderColor: tokens.border }}
              >
                <div className="flex justify-between gap-4">

                  {/* LEFT */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-black">
                        {app.profiles?.full_name || "Unknown"}
                      </p>

                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor(app.status)}`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>📧 {app.profiles?.email || "—"}</span>
                      <span>📞 {app.profiles?.phone || "—"}</span>
                      <span>🚗 {app.details?.plate_no || "—"}</span>
                      <span>📦 {app.type}</span>
                      <span>🗓 {new Date(app.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        navigate(`/admin/applications/${app.id}`)
                      }
                      className="px-3 py-1.5 text-xs font-semibold rounded-md"
                      style={{ background: tokens.primary }}
                    >
                      View
                    </button>

                    {app.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(app)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-500 text-white"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => handleReject(app)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-500 text-white"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </AdminLayout>
  )
}