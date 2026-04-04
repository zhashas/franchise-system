import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import StaffLayout from "../../components/StaffLayout"

export default function StaffAppointments() {
  const [appointments, setAppointments] = useState([])
  const [applicants,   setApplicants]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [searchQuery,  setSearchQuery]  = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formData,     setFormData]     = useState({ applicant_id: "", application_id: "", scheduled_date: "", scheduled_time: "", notes: "" })
  const [selectedApplicantApps, setSelectedApplicantApps] = useState([])

  const fetchData = async () => {
    const { data: apts } = await supabase
      .from("appointments").select("*, profiles(full_name, email)")
      .order("scheduled_date", { ascending: true })
    setAppointments(apts || [])
    const { data: profs } = await supabase.from("profiles").select("*").eq("role", "applicant").order("full_name")
    setApplicants(profs || [])
    setLoading(false)
  }
useEffect(() => {
  const loadData = async () => {
    await fetchData()
  }
  loadData()
}, []) // dependencies remain empty

  const handleApplicantChange = async (e) => {
    const applicantId = e.target.value
    setFormData({ ...formData, applicant_id: applicantId, application_id: "" })
    if (!applicantId) { setSelectedApplicantApps([]); return }
    const { data: apps } = await supabase.from("applications").select("*").eq("applicant_id", applicantId).order("created_at", { ascending: false })
    setSelectedApplicantApps(apps || [])
  }

  const handleSchedule = async (e) => {
    e.preventDefault()
    const selectedApp = selectedApplicantApps.find(a => a.id === formData.application_id)

    await supabase.from("appointments").insert({
      applicant_id:    formData.applicant_id,
      application_id:  formData.application_id || null,
      scheduled_date:  formData.scheduled_date,
      scheduled_time:  formData.scheduled_time,
      notes:           formData.notes,
      status:          "confirmed",
    })

    await supabase.from("notifications").insert({
      recipient_id:      formData.applicant_id,
      recipient_type:    "applicant",
      sender_type:       "staff",
      notification_type: "appointment_scheduled",
      title:             "📅 Appointment Scheduled!",
      message:           `Your appointment has been scheduled on ${new Date(formData.scheduled_date).toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at ${formData.scheduled_time}. ${formData.notes ? "Note: " + formData.notes : "Please proceed to the Municipal Hall, San Jose, Occidental Mindoro."}`,
      is_read:           false,
    })

    if (selectedApp?.status === "pending") {
      await supabase.from("applications").update({ status: "under_review" }).eq("id", formData.application_id)
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

  const statusBadge = (s) => {
    if (s === "confirmed") return { bg: "#DBEAFE", color: "#1D4ED8", label: "Confirmed" }
    if (s === "completed") return { bg: "#DCFCE7", color: "#16A34A", label: "Completed" }
    if (s === "cancelled") return { bg: "#FEE2E2", color: "#DC2626", label: "Cancelled" }
    return { bg: "#FEF9C3", color: "#D97706", label: "Pending" }
  }

  const filterStats = [
    { key: "all",       label: "All",       value: appointments.length,                                            accent: "#6B7280", bg: "#F3F4F6" },
    { key: "confirmed", label: "Confirmed", value: appointments.filter(a => a.status === "confirmed").length,     accent: "#60A5FA", bg: "#EFF6FF" },
    { key: "completed", label: "Completed", value: appointments.filter(a => a.status === "completed").length,     accent: "#34D399", bg: "#ECFDF5" },
    { key: "cancelled", label: "Cancelled", value: appointments.filter(a => a.status === "cancelled").length,     accent: "#F87171", bg: "#FEF2F2" },
  ]

  const filtered = appointments
    .filter(a => statusFilter === "all" || a.status === statusFilter)
    .filter(a => {
      const q = searchQuery.toLowerCase()
      return a.profiles?.full_name?.toLowerCase().includes(q) || a.profiles?.email?.toLowerCase().includes(q) || a.scheduled_date?.includes(q) || a.notes?.toLowerCase().includes(q)
    })

  const inputStyle = { fontSize: "13px", border: "1.5px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%", outline: "none" }

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-xl p-6 border bg-blue-50 border-blue-200 flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">APPOINTMENTS</h1>
            <p className="text-sm text-gray-600">Manage and schedule applicant appointments.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-sm px-5 py-2.5 rounded-lg transition">
            + Schedule Appointment
          </button>
        </div>

        {/* FILTER STATS */}
        <div className="grid grid-cols-4 gap-4">
          {filterStats.map(s => (
            <div key={s.key} onClick={() => setStatusFilter(s.key)}
              className={`p-4 rounded-lg border cursor-pointer transition ${statusFilter === s.key ? "ring-2 ring-black scale-[1.02]" : "hover:scale-[1.01]"}`}
              style={{ background: s.bg, borderColor: s.accent }}>
              <p className="text-2xl font-semibold" style={{ color: s.accent }}>{s.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: s.accent }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <span className="text-lg">⌕</span>
          <input type="text" placeholder="Search by name, email, date…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="text-xs bg-gray-100 px-3 py-1 rounded text-gray-500 font-semibold">Clear</button>}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><p className="text-4xl mb-3">📅</p><p className="text-gray-400 text-sm">No appointments found.</p></div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Applicant", "Date", "Time", "Notes", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-800 p-2 rounded-full">👤</span>
                      <div>
                        <p className="font-semibold text-gray-800">{a.profiles?.full_name}</p>
                        <p className="text-xs text-gray-400">{a.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{new Date(a.scheduled_date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</td>
                    <td className="px-5 py-3 text-gray-700">{a.scheduled_time}</td>
                    <td className="px-5 py-3 text-xs text-gray-500 max-w-[180px] truncate">{a.notes || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold`} style={{ background: statusBadge(a.status).bg, color: statusBadge(a.status).color }}>
                        {statusBadge(a.status).label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {a.status !== "completed" && (
                          <button onClick={() => updateStatus(a.id, "completed")} className="px-3 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100">Complete</button>
                        )}
                        {a.status !== "cancelled" && (
                          <button onClick={() => updateStatus(a.id, "cancelled")} className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          )}
        </div>

        {!loading && <p className="text-right text-xs text-gray-400">Showing <strong>{filtered.length}</strong> of <strong>{appointments.length}</strong> appointments</p>}
      </div>

      {/* SCHEDULE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-5 pb-4 border-b">
              <div><h2 className="text-base font-bold text-gray-800">Schedule Appointment</h2><p className="text-xs text-gray-400 mt-1">Fill in the details to notify the applicant.</p></div>
              <span className="bg-yellow-400 rounded-lg p-2 text-lg">📅</span>
            </div>
            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Applicant <span className="text-red-500">*</span></label>
                <select value={formData.applicant_id} onChange={handleApplicantChange} required style={inputStyle}>
                  <option value="">-- Select applicant --</option>
                  {applicants.map(a => <option key={a.id} value={a.id}>{a.full_name} — {a.email}</option>)}
                </select>
              </div>
              {selectedApplicantApps.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Application <span className="text-gray-400 font-normal">(optional)</span></label>
                  <select value={formData.application_id} onChange={e => setFormData({ ...formData, application_id: e.target.value })} style={inputStyle}>
                    <option value="">-- Select application --</option>
                    {selectedApplicantApps.map(app => <option key={app.id} value={app.id}>{app.type} — {app.status} — {new Date(app.created_at).toLocaleDateString()}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input type="date" value={formData.scheduled_date} min={new Date().toISOString().split("T")[0]} onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
                  <input type="time" value={formData.scheduled_time} onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })} required style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: "none" }} placeholder="Additional instructions…" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-black text-yellow-400 font-bold text-sm py-2.5 rounded-xl hover:opacity-90 transition">Schedule & Notify</button>
                <button type="button" onClick={() => { setShowModal(false); setFormData({ applicant_id: "", application_id: "", scheduled_date: "", scheduled_time: "", notes: "" }); setSelectedApplicantApps([]) }} className="flex-1 bg-gray-100 text-gray-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  )
}