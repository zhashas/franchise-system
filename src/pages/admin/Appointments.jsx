import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    applicant_id: "",
    application_id: "",
    scheduled_date: "",
    scheduled_time: "",
    notes: "",
  })
  const [selectedApplicantApps, setSelectedApplicantApps] = useState([])

  const fetchData = async () => {
    const { data: apts } = await supabase
      .from("appointments")
      .select("*, profiles(full_name, email)")
      .order("scheduled_date", { ascending: true })
    setAppointments(apts || [])

    // ✅ Fetch all applicants from profiles
    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "applicant")
      .order("full_name", { ascending: true })
    setApplicants(profs || [])

    setLoading(false)
  }

    useEffect(() => {
      const init = async () => {
        await fetchData()
        }
        init()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ✅ When applicant is selected, load their applications
  const handleApplicantChange = async (e) => {
    const applicantId = e.target.value
    setFormData({ ...formData, applicant_id: applicantId, application_id: "" })

    if (!applicantId) {
      setSelectedApplicantApps([])
      return
    }

    const { data: apps } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_id", applicantId)
      .order("submitted_at", { ascending: false })
    setSelectedApplicantApps(apps || [])
  }

  const handleSchedule = async (e) => {
    e.preventDefault()

    const selectedApp = selectedApplicantApps.find(a => a.id === formData.application_id)

    await supabase.from("appointments").insert({
      applicant_id: formData.applicant_id,
      application_id: formData.application_id || null,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time,
      notes: formData.notes,
      status: "confirmed",
    })

    // ✅ Notify the applicant
    await supabase.from("notifications").insert({
      user_id: formData.applicant_id,
      title: "📅 Appointment Scheduled!",
      message: `Your appointment has been scheduled on ${new Date(formData.scheduled_date).toLocaleDateString("en-PH", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })} at ${formData.scheduled_time}. ${formData.notes ? "Note: " + formData.notes : "Please proceed to the Municipal Hall, San Jose, Occidental Mindoro."}`,
      is_read: false,
      created_at: new Date(),
    })

    // ✅ Update application status if selected
    if (selectedApp?.status === "pending") {
      await supabase
        .from("applications")
        .update({ status: "under_review" })
        .eq("id", formData.application_id)
    }

    setShowModal(false)
    setFormData({ applicant_id: "", application_id: "", scheduled_date: "", scheduled_time: "", notes: "" })
    setSelectedApplicantApps([])
    fetchData()
  }

  const updateStatus = async (id, status) => {
    await supabase.from("appointments").update({ status }).eq("id", id)
    fetchData()
  }

  const statusColor = (status) => {
    if (status === "confirmed") return "bg-blue-100 text-blue-700"
    if (status === "completed") return "bg-green-100 text-green-700"
    if (status === "cancelled") return "bg-red-100 text-red-700"
    return "bg-yellow-100 text-yellow-700"
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">📅 Appointments</h1>
            <p className="text-gray-500 text-sm">Schedule and manage applicant appointments</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            + Schedule Appointment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", value: appointments.length, color: "border-blue-500" },
            { label: "Confirmed", value: appointments.filter(a => a.status === "confirmed").length, color: "border-green-500" },
            { label: "Cancelled", value: appointments.filter(a => a.status === "cancelled").length, color: "border-red-500" },
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border-t-4 ${stat.color}`}>
              <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-orange-500 font-semibold">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📅</p>
              <p>No appointments scheduled yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Applicant</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Notes</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-900">
                      {apt.profiles?.full_name}
                      <p className="text-xs text-gray-400">{apt.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(apt.scheduled_date).toLocaleDateString("en-PH", {
                        year: "numeric", month: "short", day: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{apt.scheduled_time}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{apt.notes || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {apt.status !== "completed" && (
                          <button
                            onClick={() => updateStatus(apt.id, "completed")}
                            className="bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded text-xs font-medium transition"
                          >
                            Complete
                          </button>
                        )}
                        {apt.status !== "cancelled" && (
                          <button
                            onClick={() => updateStatus(apt.id, "cancelled")}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded text-xs font-medium transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border-t-4 border-orange-500">
            <h2 className="text-lg font-bold text-blue-900 mb-4">📅 Schedule Appointment</h2>
            <form onSubmit={handleSchedule} className="space-y-4">

              {/* Step 1 - Select Applicant */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Select Applicant <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.applicant_id}
                  onChange={handleApplicantChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                >
                  <option value="">-- Select applicant --</option>
                  {applicants.map((applicant) => (
                    <option key={applicant.id} value={applicant.id}>
                      {applicant.full_name} — {applicant.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2 - Select Application (optional) */}
              {selectedApplicantApps.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Select Application
                  </label>
                  <select
                    value={formData.application_id}
                    onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">-- Select application (optional) --</option>
                    {selectedApplicantApps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.type} — {app.status} — {new Date(app.submitted_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.applicant_id && selectedApplicantApps.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-lg text-xs">
                  ⚠️ This applicant has no applications yet. You can still schedule an appointment.
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional instructions for the applicant..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold text-sm transition"
                >
                  Schedule & Notify Applicant
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedApplicantApps([])
                    setFormData({ applicant_id: "", application_id: "", scheduled_date: "", scheduled_time: "", notes: "" })
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}