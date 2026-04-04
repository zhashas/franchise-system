import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"

// ─── helpers ─────────────────────────────────────────────────────────────────
const Section = ({ icon, title, children }) => (
  <div className="mb-8">
    <h2 className="text-xs font-bold text-gray-700 mb-4 pb-2 border-b-2 border-orange-200 uppercase tracking-widest flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
    {children}
  </div>
)

const Field = ({ label, value, span = "" }) => (
  <div className={span}>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 min-h-[36px]">
      {value || <span className="text-gray-400 italic">—</span>}
    </p>
  </div>
)

const StatusBadge = ({ status }) => {
  const map = {
    pending:      { bg: "bg-yellow-100",  text: "text-yellow-800",  border: "border-yellow-300",  icon: "⏳" },
    under_review: { bg: "bg-blue-100",    text: "text-blue-800",    border: "border-blue-300",    icon: "🔍" },
    approved:     { bg: "bg-green-100",   text: "text-green-800",   border: "border-green-300",   icon: "✅" },
    rejected:     { bg: "bg-red-100",     text: "text-red-800",     border: "border-red-300",     icon: "❌" },
    for_release:  { bg: "bg-purple-100",  text: "text-purple-800",  border: "border-purple-300",  icon: "📤" },
  }
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", icon: "❓" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {status?.replace(/_/g, " ").toUpperCase()}
    </span>
  )
}

// ── Image modal ───────────────────────────────────────────────────────────────
const ImageModal = ({ src, label, onClose }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 text-white text-sm font-bold bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
      >
        ✕ Close
      </button>
      <p className="text-white text-xs font-semibold mb-2 text-center uppercase tracking-wide">{label}</p>
      <img src={src} alt={label} className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
    </div>
  </div>
)

// ── Document / photo card ─────────────────────────────────────────────────────
const DocCard = ({ label, url }) => {
  const [modalOpen, setModalOpen] = useState(false)

  if (!url) return (
    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-xs text-center px-2">
      <span className="text-2xl mb-1">📄</span>
      <span className="font-medium text-gray-500 text-xs mb-1">{label}</span>
      <span className="italic">Not uploaded</span>
    </div>
  )

  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)
  const isPdf   = /\.pdf(\?|$)/i.test(url)

  return (
    <>
      {modalOpen && isImage && (
        <ImageModal src={url} label={label} onClose={() => setModalOpen(false)} />
      )}
      <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
        <div
          className="relative h-36 bg-gray-100 flex items-center justify-center cursor-pointer group"
          onClick={() => isImage && setModalOpen(true)}
        >
          {isImage ? (
            <>
              <img
                src={url}
                alt={label}
                className="w-full h-full object-cover group-hover:opacity-90 transition"
                onError={e => {
                  e.target.style.display = "none"
                  e.target.nextSibling.style.display = "flex"
                }}
              />
              <div className="hidden absolute inset-0 flex-col items-center justify-center text-gray-400 text-xs">
                <span className="text-3xl">🖼️</span>
                <span>Image unavailable</span>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-xs bg-black bg-opacity-60 px-3 py-1.5 rounded-full transition">
                  🔍 Click to enlarge
                </span>
              </div>
            </>
          ) : isPdf ? (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl">📑</span>
              <span className="text-xs mt-1">PDF Document</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl">📄</span>
              <span className="text-xs mt-1">File</span>
            </div>
          )}
        </div>
        <div className="px-3 py-2 bg-white border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-600 leading-tight mb-1 line-clamp-2">{label}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
            onClick={e => e.stopPropagation()}
          >
            🔗 Open / Download
          </a>
        </div>
      </div>
    </>
  )
}

// ─── NOTIFICATION TEMPLATES ───────────────────────────────────────────────────
const STATUS_NOTIF = {
  under_review: {
    title:   "Application Under Review 🔍",
    message: "Your franchise application is now being reviewed by the admin. You will be notified of the result shortly.",
    type:    "status_under_review",
  },
  approved: {
    title:   "Application Approved ✅",
    message: "Congratulations! Your franchise application has been approved. Your franchise is now valid for 3 years.",
    type:    "status_approved",
  },
  rejected: {
    title:   "Application Rejected ❌",
    message: "We regret to inform you that your franchise application has been rejected.",
    type:    "status_rejected",
  },
  for_release: {
    title:   "Franchise Ready for Release 📤",
    message: "Your franchise documents are ready for release. Please visit the Municipal Hall to claim your franchise permit.",
    type:    "status_for_release",
  },
}

// ─── HELPER: add years to a date string (YYYY-MM-DD) ─────────────────────────
const addYears = (dateStr, years) => {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().split("T")[0]
}

// ─── HELPER: today as YYYY-MM-DD ──────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0]

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminApplicationDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [app,            setApp]            = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState("")
  const [successMsg,     setSuccessMsg]     = useState("")
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [adminRemarks,   setAdminRemarks]   = useState("")
  const [showRemarkBox,  setShowRemarkBox]  = useState(false)
  const [pendingStatus,  setPendingStatus]  = useState("")

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchApplication() }, [id])

  const fetchApplication = async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select(`
          *,
          profiles!applications_applicant_id_fkey(
            full_name, email
          )
        `)
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError
      setApp(data)
      setAdminRemarks(data.admin_remarks || "")
    } catch (err) {
      setError("Failed to load application: " + err.message)
    }
    setLoading(false)
  }

  const initiateStatusChange = (newStatus) => {
    setError("")
    setSuccessMsg("")
    setPendingStatus(newStatus)
    setShowRemarkBox(true)
  }

  // ─── AUTO-SYNC FRANCHISE RECORD ────────────────────────────────────────────
  // Called whenever an application is approved.
  // • New registration  → INSERT a new franchise row (status = "active")
  // • Renewal           → UPDATE the existing franchise row matched by
  //                       franchise_number; reset dates for 3-year validity
  const syncFranchiseRecord = async (application) => {
    const d             = application.details  || {}
    const isRenewal     = application.type === "renewal"
    const approvedToday = todayStr()
    const newExpiry     = addYears(approvedToday, 3)

    const franchisePayload = {
      owner_name:       d.franchise_owner || application.profiles?.full_name || "",
      plate_number:     (d.plate_no || "").toUpperCase(),
      date_issued:      approvedToday,
      expiration_date:  newExpiry,
      status:           "active",
      // Store applicant_id so the scheduler can notify them later
      applicant_id:     application.applicant_id,
    }

    if (isRenewal && d.franchise_number) {
      // ── RENEWAL: update existing record by franchise_number ────────────────
      const { error: updateErr } = await supabase
        .from("franchises")
        .update(franchisePayload)
        .eq("franchise_number", d.franchise_number.toUpperCase())

      if (updateErr) {
        console.warn("Franchise renewal update warning:", updateErr.message)
        // Fallback: insert if no matching record found
        const { error: insertErr } = await supabase
          .from("franchises")
          .insert([{ ...franchisePayload, franchise_number: d.franchise_number.toUpperCase() }])
        if (insertErr) console.error("Franchise insert fallback error:", insertErr.message)
      }
    } else {
      // ── NEW REGISTRATION: insert a new franchise row ───────────────────────
      // Generate a franchise number from control number or a timestamp fallback
      const franchiseNumber = d.franchise_number
        || d.control_number
        || `TRIC-${Date.now().toString().slice(-6)}`

      // Upsert so re-approving the same app is idempotent
      const { error: insertErr } = await supabase
        .from("franchises")
        .upsert(
          [{ ...franchisePayload, franchise_number: franchiseNumber.toUpperCase() }],
          { onConflict: "franchise_number" }
        )
      if (insertErr) console.error("Franchise upsert error:", insertErr.message)
    }
  }

  // ─── CONFIRM STATUS CHANGE ─────────────────────────────────────────────────
  const confirmStatusChange = async () => {
    if (!pendingStatus) return
    setStatusUpdating(true)
    setError("")
    try {
      // 1 ── Update status & admin_remarks in applications table
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: pendingStatus, admin_remarks: adminRemarks })
        .eq("id", id)

      if (updateError) throw updateError

      // 2 ── If approved: auto-create / update franchise record
      if (pendingStatus === "approved") {
        await syncFranchiseRecord(app)
      }

      // 3 ── Insert notification row for the applicant
      const template = STATUS_NOTIF[pendingStatus]
      if (template && app?.applicant_id) {
        const extraNote = adminRemarks.trim()
          ? ` Admin note: "${adminRemarks.trim()}"`
          : ""

        // For approval, enrich the message with the 3-year expiry date
        let finalMessage = template.message + extraNote
        if (pendingStatus === "approved") {
          const expiry = addYears(todayStr(), 3)
          finalMessage =
            `Congratulations! Your franchise application has been approved. ` +
            `Your franchise is now active and valid until ${expiry}.` +
            (extraNote || "")
        }

        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            recipient_id:      app.applicant_id,
            recipient_type:    "applicant",
            sender_type:       "admin",
            application_id:    id,
            notification_type: template.type,
            title:             template.title,
            message:           finalMessage,
            is_read:           false,
          })

        if (notifError) console.warn("Notification insert warning:", notifError.message)
      }

      // 4 ── Update local state
      setApp(prev => ({ ...prev, status: pendingStatus, admin_remarks: adminRemarks }))
      setShowRemarkBox(false)
      setPendingStatus("")

      const extraInfo = pendingStatus === "approved"
        ? ` Franchise record has been automatically created/updated with a 3-year validity (expires ${addYears(todayStr(), 3)}).`
        : ""

      setSuccessMsg(
        `✅ Status updated to "${pendingStatus.replace(/_/g, " ")}" and applicant has been notified.${extraInfo}`
      )
    } catch (err) {
      setError("Status update failed: " + err.message)
    }
    setStatusUpdating(false)
  }

  // ── Loading / error screens ───────────────────────────────────────────────
  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-orange-500 font-semibold text-sm gap-2">
        <span className="animate-spin text-2xl">⏳</span> Loading application details…
      </div>
    </AdminLayout>
  )

  if (error && !app) return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto mt-10 bg-red-50 border border-red-300 text-red-700 p-6 rounded-xl text-sm">
        <p className="font-bold mb-1">❌ Error</p>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-xs text-blue-600 hover:underline">
          ← Go Back
        </button>
      </div>
    </AdminLayout>
  )

  if (!app) return null

  const d         = app.details  || {}
  const docs      = d.documents  || {}
  const isRenewal = app.type === "renewal"
  const profile   = app.profiles || {}

  const officialDocs = [
    { label: "Latest O.R. (Official Receipt) – LTO",     key: "or_latest" },
    { label: "Certificate of Registration (C.R.) – LTO", key: "cr" },
    { label: "Cedula (Updated)",                          key: "cedula" },
    { label: "Police Clearance",                          key: "police_clearance" },
    { label: "Barangay Residency (Updated)",              key: "barangay_residency" },
    { label: "Voter's Certification – COMELEC",           key: "voters_cert" },
    { label: "Stencil ng Motor (Engine / Chassis)",       key: "stencil_motor" },
  ]
  const tricyclePhotos = [
    { label: "Tricycle Condition (Overall)",  key: "tricycle_condition" },
    { label: "Left Signal Light",             key: "left_signal" },
    { label: "Right Signal Light",            key: "right_signal" },
    { label: "Head Light",                    key: "head_light" },
    { label: "Tail Light",                    key: "tail_light" },
    { label: "Ilaw sa Loob ng Sidecar",       key: "ilaw_sidecar" },
    { label: "Basurahan sa Loob ng Sidecar",  key: "basurahan_sidecar" },
  ]
  const garagePhotos = [
    { label: "Garage Condition (Overall)",     key: "garage_condition" },
    { label: "Garage / Garahe (with vehicle)", key: "garage_photo" },
  ]
  const statusButtons = [
    { status: "under_review", label: "Mark Under Review", color: "bg-blue-500 hover:bg-blue-600",     icon: "🔍" },
    { status: "approved",     label: "Approve",           color: "bg-green-500 hover:bg-green-600",   icon: "✅" },
    { status: "rejected",     label: "Reject",            color: "bg-red-500 hover:bg-red-600",       icon: "❌" },
    { status: "for_release",  label: "Mark For Release",  color: "bg-purple-500 hover:bg-purple-600", icon: "📤" },
  ]

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">

        <button
          onClick={() => navigate(-1)}
          className="mb-5 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow-md border-t-4 border-orange-500 p-8">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-4 border-orange-200 overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {docs.owner_photo
                  ? <img src={docs.owner_photo} alt="Owner" className="w-full h-full object-cover" />
                  : <span className="text-4xl text-gray-300">👤</span>
                }
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-blue-900">
                  {d.franchise_owner || profile.full_name || "—"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isRenewal ? "🔄 Franchise Renewal" : "📋 New Registration"}
                  &nbsp;·&nbsp; Control No: <strong>{d.control_number || "—"}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Submitted: {new Date(app.created_at).toLocaleDateString("en-PH", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <StatusBadge status={app.status} />
              <p className="text-xs text-gray-400">
                App ID: <span className="font-mono text-gray-500">{app.id}</span>
              </p>
            </div>
          </div>

          {/* ── Personal Information ── */}
          <Section icon="👤" title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Full Name / Franchise Owner" value={d.franchise_owner}    span="lg:col-span-2" />
              <Field label="Control Number"              value={d.control_number} />
              <Field label="Contact Number"              value={d.contact_number} />
              <Field label="Email Address"               value={d.email || profile.email} />
              <Field label="Address"                     value={d.address}             span="sm:col-span-2 lg:col-span-3" />
              <Field label="Date of Birth"               value={d.date_of_birth} />
              <Field label="Place of Birth"              value={d.place_of_birth} />
              <Field label="Civil Status"                value={d.civil_status} />
              <Field label="Nationality"                 value={d.nationality} />
            </div>
            {isRenewal && (
              <div className="mt-5 pt-4 border-t border-dashed border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-3">
                  🔄 Renewal-Specific Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Old Owner (if transferred)" value={d.old_owner} />
                  <Field label="Franchise Status"           value={d.franchise_status} />
                  <Field label="Franchise Number"           value={d.franchise_number} />
                  <Field label="Franchise Expiration"       value={d.franchise_expiration} />
                </div>
              </div>
            )}
          </Section>

          {/* ── Motorcycle Information ── */}
          <Section icon="🏍️" title="Motorcycle Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Make (Brand)"          value={d.make}           span="sm:col-span-2" />
              <Field label="Color"                 value={d.color} />
              <Field label="Motor / Engine Number" value={d.motor_no} />
              <Field label="Chassis Number"        value={d.chassis_no} />
              <Field label="Plate Number"          value={d.plate_no} />
              <Field label="Classification"        value={d.classification} />
            </div>
          </Section>

          {/* ── Official Documents ── */}
          <Section icon="📎" title="Uploaded Documents & Photos">
            <p className="text-xs text-gray-400 italic mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              📌 Click any image to enlarge. Use "Open / Download" to view the original file.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {officialDocs.map(doc => <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />)}
            </div>
          </Section>

          {/* ── Tricycle Condition ── */}
          <Section icon="🔧" title="Tricycle Condition Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tricyclePhotos.map(doc => <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />)}
            </div>
          </Section>

          {/* ── Garage Condition ── */}
          <Section icon="🏠" title="Garage Condition Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {garagePhotos.map(doc => <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />)}
            </div>
          </Section>

          {/* ── Applicant Remarks ── */}
          {d.remarks && (
            <Section icon="📝" title="Applicant Remarks / Notes">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line">
                {d.remarks}
              </div>
            </Section>
          )}

          {/* ── Previous Admin Remarks ── */}
          {app.admin_remarks && (
            <Section icon="🗒️" title="Admin Remarks (Previous)">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800 whitespace-pre-line">
                {app.admin_remarks}
              </div>
            </Section>
          )}

          {/* ── Admin Actions ── */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">⚙️ Admin Actions</p>

            {successMsg && (
              <div className="bg-green-50 border border-green-300 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
                {successMsg}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {/* ── Approval info banner ── */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-xs text-blue-700">
              <p className="font-bold mb-1">ℹ️ Approval Auto-Actions</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                <li>Approving will <strong>automatically create or update</strong> the franchise record in the dashboard.</li>
                <li>Franchise validity is set to <strong>3 years</strong> from today's approval date.</li>
                <li>For renewals, the existing record (matched by franchise number) will be <strong>reset</strong> to a new 3-year term.</li>
                <li>The applicant will receive an <strong>approval notification</strong> with their new expiry date.</li>
              </ul>
            </div>

            {showRemarkBox && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  Add a remark before confirming&nbsp;
                  <span className="capitalize text-orange-600 font-bold">
                    {pendingStatus?.replace(/_/g, " ")}
                  </span>:
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  This remark will be included in the notification sent to the applicant.
                </p>
                <textarea
                  value={adminRemarks}
                  onChange={e => setAdminRemarks(e.target.value)}
                  placeholder="Optional admin remarks / reason…"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={confirmStatusChange}
                    disabled={statusUpdating}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-60"
                  >
                    {statusUpdating
                      ? "⏳ Updating…"
                      : `✅ Confirm — ${pendingStatus?.replace(/_/g, " ").toUpperCase()}`}
                  </button>
                  <button
                    onClick={() => { setShowRemarkBox(false); setPendingStatus("") }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {statusButtons.map(btn => (
                <button
                  key={btn.status}
                  onClick={() => initiateStatusChange(btn.status)}
                  disabled={app.status === btn.status || statusUpdating || showRemarkBox}
                  className={`${btn.color} text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {btn.icon} {btn.label}
                  {app.status === btn.status && (
                    <span className="ml-1 text-xs font-normal opacity-75">(current)</span>
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Current status: <StatusBadge status={app.status} />
            </p>
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}