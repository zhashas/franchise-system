import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate, useParams } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"

export default function ViewApplication() {
  const { id } = useParams()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [showConfirm, setShowConfirm] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchApplication = async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, profiles(full_name, email, phone)")
        .eq("id", id)
        .single()
      setApplication(data)
      setRemarks(data?.admin_remarks || "")
      setLoading(false)
    }
    fetchApplication()
  }, [id])

  const handleUpdateStatus = async (status) => {
    setUpdating(true)
    await supabase.from("applications").update({ status, updated_at: new Date(), admin_remarks: remarks }).eq("id", id)
    await supabase.from("notifications").insert({
      user_id: application.applicant_id,
      title: status === "approved" ? "✅ Application Approved!" : "❌ Application Declined",
      message: status === "approved"
        ? `Congratulations! Your ${application.type} application has been approved. ${remarks ? "Remarks: " + remarks : ""}`
        : `We regret to inform you that your ${application.type} application has been declined. ${remarks ? "Reason: " + remarks : "Please contact the office for more details."}`,
      is_read: false,
      created_at: new Date(),
    })
    setUpdating(false)
    setShowConfirm(null)
    navigate("/admin/applications")
  }

  const statusColor = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700"
    if (status === "rejected") return "bg-red-100 text-red-700"
    if (status === "under_review") return "bg-blue-100 text-blue-700"
    return "bg-yellow-100 text-yellow-700"
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-semibold">Loading...</div>

  const d = application?.details || {}

  return (
  <AdminLayout backPath="/admin/applications" backLabel="Back to Applications">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">📋 Application Details</h1>
            <p className="text-gray-500 text-sm">Review and verify the application below</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold capitalize ${statusColor(application?.status)}`}>
            {application?.status?.replace("_", " ")}
          </span>
        </div>

        <div className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-orange-500">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">👤 Personal Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Franchise Owner", value: d.franchise_owner },
                { label: "Address", value: d.address },
                { label: "Date of Birth", value: d.date_of_birth },
                { label: "Place of Birth", value: d.place_of_birth },
                { label: "Civil Status", value: d.civil_status },
                { label: "Nationality", value: d.nationality },
                { label: "Email", value: d.email || application?.profiles?.email },
                { label: "Contact Number", value: d.contact_number || application?.profiles?.phone },
                { label: "Old Owner", value: d.old_owner || "—" },
                { label: "Franchise Number", value: d.franchise_number || "—" },
                { label: "Franchise Expiration", value: d.franchise_expiration || "—" },
                { label: "Application Type", value: application?.type },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="font-medium text-blue-900 capitalize">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Motorcycle Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">🏍️ Motorcycle Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Make", value: d.make },
                { label: "Color", value: d.color },
                { label: "Motor No.", value: d.motor_no },
                { label: "Chassis No.", value: d.chassis_no },
                { label: "Plate No.", value: d.plate_no },
                { label: "Classification", value: d.classification || "—" },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                  <p className="font-medium text-blue-900">{item.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">📎 Uploaded Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "OR/CR", key: "or_cr" },
                { label: "Barangay Clearance", key: "barangay_clearance" },
                { label: "Cedula", key: "cedula" },
              ].map((doc) => (
                <div key={doc.key} className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-2">{doc.label}</p>
                  {d.documents?.[doc.key] ? (
                    <a href={d.documents[doc.key]} target="_blank" rel="noreferrer"
                      className="inline-block bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-2 rounded-lg text-xs font-semibold transition">
                      📄 View Document
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">No file uploaded</span>
                  )}
                </div>
              ))}
            </div>
            {d.documents?.photo && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Applicant Photo</p>
                <img src={d.documents.photo} alt="Applicant" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          {/* Applicant Remarks */}
          {d.remarks && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">📝 Applicant Remarks</h2>
              <p className="text-sm text-gray-600">{d.remarks}</p>
            </div>
          )}

          {/* Admin Decision */}
          {application?.status !== "approved" && application?.status !== "rejected" && (
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-blue-500">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">🛡️ Admin Decision</h2>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks / Reason (optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks or reason for approval/decline..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm("approved")} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition">
                  ✅ Approve Application
                </button>
                <button onClick={() => setShowConfirm("rejected")} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition">
                  ❌ Decline Application
                </button>
              </div>
            </div>
          )}

          {(application?.status === "approved" || application?.status === "rejected") && (
            <div className={`rounded-xl p-6 text-center font-semibold ${application.status === "approved" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {application.status === "approved" ? "✅ This application has been approved." : "❌ This application has been declined."}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border-t-4 border-orange-500">
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">{showConfirm === "approved" ? "✅" : "❌"}</p>
              <h2 className="text-lg font-bold text-blue-900">{showConfirm === "approved" ? "Approve Application?" : "Decline Application?"}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {showConfirm === "approved"
                  ? "The applicant will be notified that their application is approved."
                  : "The applicant will be notified that their application has been declined."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateStatus(showConfirm)}
                disabled={updating}
                className={`flex-1 text-white py-2 rounded-lg font-semibold text-sm transition ${showConfirm === "approved" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
              >
                {updating ? "Processing..." : "Confirm"}
              </button>
              <button onClick={() => setShowConfirm(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}