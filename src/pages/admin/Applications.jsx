import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"
import { notifyApplicant } from "../../lib/notifications" // ✅ ADDED

/* DESIGN TOKENS */
const tokens = {
  primary: "#FECE14",
  secondary: "#000000",
  surface: "#FFFFFF",
  text: "#000000",
  border: "#E5E7EB",
  success: "#16A34A",
  info: "#2563EB",
  warning: "#D97706",
  danger: "#DC2626",
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

  // =========================
  // ✅ APPROVE APPLICATION
  // =========================
  const handleApprove = async (application) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "approved" })
        .eq("id", application.id)

      if (error) throw error

      // ✅ notify applicant AFTER success
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

  // =========================
  // ❌ REJECT APPLICATION
  // =========================
  const handleReject = async (application) => {
    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", application.id)

      if (error) throw error

      // ✅ notify applicant AFTER success
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

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter)

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
          <h1
            style={{
              color: "#000000",
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            APPLICATIONS
          </h1>

          <p className="text-sm mt-1 text-black">
            Manage and process all submitted franchise applications.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-5 gap-4 items-stretch">
          {[
            {
              label: "Total",
              value: applications.length,
              color: "#000000",
              bg: "#F3F4F6",
            },
            {
              label: "Pending",
              value: applications.filter((a) => a.status === "pending").length,
              color: "#D97706",
              bg: "#FFFBEB",
            },
            {
              label: "Under Review",
              value: applications.filter((a) => a.status === "under_review")
                .length,
              color: "#2563EB",
              bg: "#EFF6FF",
            },
            {
              label: "Approved",
              value: applications.filter((a) => a.status === "approved").length,
              color: "#16A34A",
              bg: "#ECFDF5",
            },
            {
              label: "Rejected",
              value: applications.filter((a) => a.status === "rejected").length,
              color: "#DC2626",
              bg: "#FEF2F2",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border w-full h-full"
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
          ))}
        </div>

        {/* FILTER */}
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "under_review", "approved", "rejected"].map(
            (f) => {
              const isActive = filter === f
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium capitalize transition border"
                  style={{
                    background: isActive ? tokens.primary : "#FFFFFF",
                    color: "#000",
                    borderColor: isActive ? tokens.primary : tokens.border,
                  }}
                >
                  {f.replace("_", " ")}
                </button>
              )
            }
          )}
        </div>

        {/* TABLE */}
        <div
          className="rounded-lg border bg-white overflow-hidden"
          style={{ borderColor: tokens.border }}
        >
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-black">
              Application Records
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm font-medium text-black">
              Loading applications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-black">
              <p className="text-3xl mb-2">📄</p>
              <p>No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-black">
                  <tr>
                    <th className="text-left px-4 py-2">Applicant</th>
                    <th className="text-left px-4 py-2">Contact</th>
                    <th className="text-left px-4 py-2">Plate</th>
                    <th className="text-left px-4 py-2">Type</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((app) => (
                    <tr key={app.id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium text-black">
                          {app.profiles?.full_name}
                        </p>
                        <p className="text-xs text-black">
                          {app.profiles?.email}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-black">
                        {app.profiles?.phone || "—"}
                      </td>

                      <td className="px-4 py-3 text-black font-medium">
                        {app.details?.plate_no || "—"}
                      </td>

                      <td className="px-4 py-3 capitalize text-black">
                        {app.type}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full capitalize ${statusColor(
                            app.status
                          )}`}
                        >
                          {app.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-black">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              navigate(`/admin/applications/${app.id}`)
                            }
                            className="px-3 py-1.5 rounded-md text-xs font-semibold"
                            style={{
                              background: tokens.primary,
                              color: "#000",
                            }}
                          >
                            View
                          </button>

                          {app.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(app)}
                                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-green-500 text-white"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => handleReject(app)}
                                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-500 text-white"
                              >
                                Reject
                              </button>
                            </>
                          )}

                        </div>
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