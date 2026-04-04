import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import StaffLayout from "../../components/StaffLayout"

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
    pending:      { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", icon: "⏳" },
    under_review: { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   icon: "🔍" },
    approved:     { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  icon: "✅" },
    rejected:     { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    icon: "❌" },
    for_release:  { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", icon: "📤" },
  }
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", icon: "❓" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {status?.replace(/_/g, " ").toUpperCase()}
    </span>
  )
}

const ImageModal = ({ src, label, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute -top-10 right-0 text-white text-sm font-bold bg-red-600 px-3 py-1 rounded-lg">✕ Close</button>
      <p className="text-white text-xs font-semibold mb-2 text-center uppercase">{label}</p>
      <img src={src} alt={label} className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl" />
    </div>
  </div>
)

const DocCard = ({ label, url }) => {
  const [open, setOpen] = useState(false)
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
      {open && isImage && <ImageModal src={url} label={label} onClose={() => setOpen(false)} />}
      <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
        <div className="relative h-36 bg-gray-100 flex items-center justify-center cursor-pointer group" onClick={() => isImage && setOpen(true)}>
          {isImage ? (
            <>
              <img src={url} alt={label} className="w-full h-full object-cover group-hover:opacity-90 transition" />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-xs bg-black bg-opacity-60 px-3 py-1.5 rounded-full transition">🔍 Click to enlarge</span>
              </div>
            </>
          ) : isPdf ? (
            <div className="flex flex-col items-center text-gray-400"><span className="text-4xl">📑</span><span className="text-xs mt-1">PDF Document</span></div>
          ) : (
            <div className="flex flex-col items-center text-gray-400"><span className="text-4xl">📄</span><span className="text-xs mt-1">File</span></div>
          )}
        </div>
        <div className="px-3 py-2 bg-white border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-600 leading-tight mb-1 line-clamp-2">{label}</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium" onClick={e => e.stopPropagation()}>
            🔗 Open / Download
          </a>
        </div>
      </div>
    </>
  )
}

export default function StaffApplicationDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [app,     setApp]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState("")

  const fetchApplication = useCallback(async () => {
  setLoading(true)
  try {
    const { data, error: fetchError } = await supabase
      .from("applications")
      .select(`*, profiles!applications_applicant_id_fkey(full_name, email)`)
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError
    setApp(data)
  } catch (err) {
    setError("Failed to load application: " + err.message)
  }
  setLoading(false)
}, [id])
useEffect(() => {
  if (!id) return
  fetchApplication()
}, [fetchApplication, id])

  if (loading) return <StaffLayout><div className="flex items-center justify-center h-64 text-orange-500 font-semibold text-sm gap-2"><span className="animate-spin text-2xl">⏳</span> Loading…</div></StaffLayout>
  if (error && !app) return <StaffLayout><div className="max-w-3xl mx-auto mt-10 bg-red-50 border border-red-300 text-red-700 p-6 rounded-xl text-sm"><p className="font-bold mb-1">❌ Error</p><p>{error}</p></div></StaffLayout>
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

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-5 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">← Back</button>

        {/* READ-ONLY NOTICE */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 mb-5 text-xs text-yellow-800 flex items-center gap-2">
          <span className="text-lg">👁️</span>
          <span><strong>View Only</strong> — Staff can review application details but cannot change status. Please contact an admin to update this application.</span>
        </div>

        <div className="bg-white rounded-2xl shadow-md border-t-4 border-orange-500 p-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-4 border-orange-200 overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {docs.owner_photo ? <img src={docs.owner_photo} alt="Owner" className="w-full h-full object-cover" /> : <span className="text-4xl text-gray-300">👤</span>}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-blue-900">{d.franchise_owner || profile.full_name || "—"}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isRenewal ? "🔄 Franchise Renewal" : "📋 New Registration"}&nbsp;·&nbsp;Control No: <strong>{d.control_number || "—"}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(app.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <StatusBadge status={app.status} />
              <p className="text-xs text-gray-400">App ID: <span className="font-mono text-gray-500">{app.id}</span></p>
            </div>
          </div>

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
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-3">🔄 Renewal-Specific Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label="Old Owner (if transferred)" value={d.old_owner} />
                  <Field label="Franchise Status"           value={d.franchise_status} />
                  <Field label="Franchise Number"           value={d.franchise_number} />
                  <Field label="Franchise Expiration"       value={d.franchise_expiration} />
                </div>
              </div>
            )}
          </Section>

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

          <Section icon="📎" title="Uploaded Documents & Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {officialDocs.map(doc => <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />)}
            </div>
          </Section>

          <Section icon="🔧" title="Tricycle Condition Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tricyclePhotos.map(doc => <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />)}
            </div>
          </Section>

          <Section icon="🏠" title="Garage Condition Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {garagePhotos.map(doc => <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />)}
            </div>
          </Section>

          {d.remarks && (
            <Section icon="📝" title="Applicant Remarks / Notes">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line">{d.remarks}</div>
            </Section>
          )}

          {app.admin_remarks && (
            <Section icon="🗒️" title="Admin Remarks">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800 whitespace-pre-line">{app.admin_remarks}</div>
            </Section>
          )}

        </div>
      </div>
    </StaffLayout>
  )
}