import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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

    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "applicant")
      .order("full_name", { ascending: true })
    setApplicants(profs || [])
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => await fetchData()
    init()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleApplicantChange = async (e) => {
    const applicantId = e.target.value
    setFormData({ ...formData, applicant_id: applicantId, application_id: "" })
    if (!applicantId) { setSelectedApplicantApps([]); return }
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

    await supabase.from("notifications").insert({
      user_id: formData.applicant_id,
      title: "📅 Appointment Scheduled!",
      message: `Your appointment has been scheduled on ${new Date(formData.scheduled_date).toLocaleDateString("en-PH", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      })} at ${formData.scheduled_time}. ${formData.notes ? "Note: " + formData.notes : "Please proceed to the Municipal Hall, San Jose, Occidental Mindoro."}`,
      is_read: false,
      created_at: new Date(),
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

  const statusBadge = (status) => {
    if (status === "confirmed") return { bg: "#DBEAFE", color: "#1D4ED8", label: "Confirmed" }
    if (status === "completed") return { bg: "#DCFCE7", color: "#16A34A", label: "Completed" }
    if (status === "cancelled") return { bg: "#FEE2E2", color: "#DC2626", label: "Cancelled" }
    return { bg: "#FEF9C3", color: "#D97706", label: "Pending" }
  }

  const filtered = appointments
    .filter(apt => statusFilter === "all" ? true : apt.status === statusFilter)
    .filter(apt => {
      const q = searchQuery.toLowerCase()
      return (
        apt.profiles?.full_name?.toLowerCase().includes(q) ||
        apt.profiles?.email?.toLowerCase().includes(q) ||
        apt.notes?.toLowerCase().includes(q) ||
        apt.scheduled_date?.includes(q)
      )
    })

  const pro = {
    font: "'Poppins', sans-serif",
    primary: "#FECE14",
    secondary: "#000000",
    surface: "#FFFFFF",
    text: "#111827",
    muted: "#6B7280",
    border: "#E5E7EB",
    success: "#16A34A",
    danger: "#DC2626",
    warning: "#D97706",
  }

  const inputStyle = {
    fontFamily: pro.font,
    fontSize: "13px",
    color: pro.text,
    background: pro.surface,
    border: `1.5px solid ${pro.border}`,
    borderRadius: "8px",
    padding: "8px 12px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
  }

  const filterStats = [
    { key: "all", label: "All", value: appointments.length, accent: "#111827" },
    { key: "confirmed", label: "Confirmed", value: appointments.filter(a => a.status === "confirmed").length, accent: "#1D4ED8" },
    { key: "completed", label: "Completed", value: appointments.filter(a => a.status === "completed").length, accent: "#16A34A" },
    { key: "cancelled", label: "Cancelled", value: appointments.filter(a => a.status === "cancelled").length, accent: "#DC2626" },
  ]

  return (
    <AdminLayout>
      <div style={{ fontFamily: pro.font, maxWidth: "1280px", margin: "0 auto" }} className="space-y-6">

    {/* HEADER */}
      <div
        style={{
      background: "#EFF6FF",
      border: "1px solid #BFDBFE",
      borderRadius: "16px",
      padding: "24px 28px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
        }}>

          <div>
            <h1 style={{ color: "#000000", fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
              APPOINTMENTS
            </h1>
            <p style={{ color: "#000000", fontSize: "13px", margin: "4px 0 0", fontWeight: 400 }}>
              Manage schedules, applicants, and appointment flow.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: pro.primary,
              color: pro.secondary,
              fontFamily: pro.font,
              fontWeight: 700,
              fontSize: "13px",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            + Schedule Appointment
          </button>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {filterStats.map((stat) => {
            const isActive = statusFilter === stat.key
            return (
              <button
                key={stat.key}
                onClick={() => setStatusFilter(stat.key)}
                style={{
                  background: isActive ? stat.accent : pro.surface,
                  border: `2px solid ${isActive ? stat.accent : pro.border}`,
                  borderRadius: "12px",
                  padding: "16px 20px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: pro.font,
                  boxShadow: isActive ? `0 4px 14px ${stat.accent}33` : "0 1px 4px rgba(0,0,0,0.06)",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = stat.accent }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = pro.border }}
              >
                <p style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  margin: 0,
                  color: isActive ? "#fff" : stat.accent,
                  lineHeight: 1,
                }}>
                  {stat.value}
                </p>
                <p style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  margin: "6px 0 0",
                  color: isActive ? "rgba(255,255,255,0.85)" : pro.muted,
                }}>
                  {stat.label}
                </p>
              </button>
            )
          })}
        </div>

        {/* SEARCH BAR */}
        <div style={{
          background: pro.surface,
          border: `1.5px solid ${pro.border}`,
          borderRadius: "12px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
        }}>
          <span style={{ fontSize: "16px" }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, date, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              ...inputStyle,
              border: "none",
              padding: 0,
              fontSize: "13px",
              background: "transparent",
              flex: 1,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "#F3F4F6",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: 600,
                color: pro.muted,
                cursor: "pointer",
                fontFamily: pro.font,
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* TABLE */}
        <div style={{
          background: pro.surface,
          borderRadius: "16px",
          border: `1.5px solid ${pro.border}`,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: pro.muted, fontFamily: pro.font, fontSize: "14px" }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", fontFamily: pro.font }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📅</p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: pro.text, margin: "0 0 4px" }}>No appointments found</p>
              <p style={{ fontSize: "12px", color: pro.muted, margin: 0 }}>
                {searchQuery ? `No results for "${searchQuery}"` : "Schedule an appointment to get started."}
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: pro.font }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: `1.5px solid ${pro.border}` }}>
                  {["Applicant", "Date", "Time", "Notes", "Status", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "12px 20px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: pro.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((apt, i) => {
                  const badge = statusBadge(apt.status)
                  return (
                    <tr
                      key={apt.id}
                      style={{
                        borderBottom: i < filtered.length - 1 ? `1px solid ${pro.border}` : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: pro.text }}>{apt.profiles?.full_name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: pro.muted }}>{apt.profiles?.email}</p>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: pro.text }}>
                        {new Date(apt.scheduled_date).toLocaleDateString("en-PH", {
                          year: "numeric", month: "short", day: "numeric"
                        })}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: pro.text }}>{apt.scheduled_time}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: pro.muted, maxWidth: "180px" }}>
                        <span style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {apt.notes || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 600,
                          fontFamily: pro.font,
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {apt.status !== "completed" && (
                            <button
                              onClick={() => updateStatus(apt.id, "completed")}
                              style={{
                                background: "#F0FDF4",
                                color: pro.success,
                                border: `1px solid #BBF7D0`,
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: pro.font,
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#DCFCE7" }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#F0FDF4" }}
                            >
                              Complete
                            </button>
                          )}
                          {apt.status !== "cancelled" && (
                            <button
                              onClick={() => updateStatus(apt.id, "cancelled")}
                              style={{
                                background: "#FFF1F2",
                                color: pro.danger,
                                border: `1px solid #FECDD3`,
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "11px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: pro.font,
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#FEE2E2" }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#FFF1F2" }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* RESULTS COUNT */}
        {!loading && (
          <p style={{ textAlign: "right", fontSize: "12px", color: pro.muted, fontFamily: pro.font }}>
            Showing <strong style={{ color: pro.text }}>{filtered.length}</strong> of <strong style={{ color: pro.text }}>{appointments.length}</strong> appointments
          </p>
        )}
      </div>

      {/* SCHEDULE MODAL */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50
        }}>
          <div style={{
            background: pro.surface,
            borderRadius: "20px",
            padding: "28px",
            width: "100%",
            maxWidth: "460px",
            fontFamily: pro.font,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            border: `1px solid ${pro.border}`,
          }}>
            {/* Modal Header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: "20px", paddingBottom: "16px", borderBottom: `1.5px solid ${pro.border}`
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: pro.text }}>
                  Schedule Appointment
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: pro.muted }}>
                  Fill in the details to notify the applicant.
                </p>
              </div>
              <div style={{
                background: pro.primary,
                borderRadius: "10px",
                padding: "8px",
                fontSize: "18px",
                lineHeight: 1,
              }}>
                📅
              </div>
            </div>

            <form onSubmit={handleSchedule} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Select Applicant */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: pro.text, marginBottom: "6px" }}>
                  Select Applicant <span style={{ color: pro.danger }}>*</span>
                </label>
                <select
                  value={formData.applicant_id}
                  onChange={handleApplicantChange}
                  required
                  style={inputStyle}
                >
                  <option value="">-- Select applicant --</option>
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name} — {a.email}</option>
                  ))}
                </select>
              </div>

              {/* Select Application */}
              {selectedApplicantApps.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: pro.text, marginBottom: "6px" }}>
                    Select Application <span style={{ color: pro.muted, fontWeight: 400 }}>(optional)</span>
                  </label>
                  <select
                    value={formData.application_id}
                    onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">-- Select application --</option>
                    {selectedApplicantApps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.type} — {app.status} — {new Date(app.submitted_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.applicant_id && selectedApplicantApps.length === 0 && (
                <div style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A",
                  borderRadius: "8px", padding: "10px 12px",
                  fontSize: "12px", color: pro.warning, fontWeight: 500
                }}>
                  ⚠️ No applications found. You can still schedule an appointment.
                </div>
              )}

              {/* Date + Time Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: pro.text, marginBottom: "6px" }}>
                    Date <span style={{ color: pro.danger }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: pro.text, marginBottom: "6px" }}>
                    Time <span style={{ color: pro.danger }}>*</span>
                  </label>
                  <input
                    type="time"
                    name="scheduled_time"
                    value={formData.scheduled_time}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: pro.text, marginBottom: "6px" }}>
                  Notes <span style={{ color: pro.muted, fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional instructions for the applicant..."
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: pro.secondary,
                    color: pro.primary,
                    fontFamily: pro.font,
                    fontWeight: 700,
                    fontSize: "13px",
                    padding: "11px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  Schedule & Notify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedApplicantApps([])
                    setFormData({ applicant_id: "", application_id: "", scheduled_date: "", scheduled_time: "", notes: "" })
                  }}
                  style={{
                    flex: 1,
                    background: "#F3F4F6",
                    color: pro.text,
                    fontFamily: pro.font,
                    fontWeight: 600,
                    fontSize: "13px",
                    padding: "11px",
                    borderRadius: "10px",
                    border: `1.5px solid ${pro.border}`,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"}
                  onMouseLeave={e => e.currentTarget.style.background = "#F3F4F6"}
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