import { useState, useRef, useEffect } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import ApplicantLayout from "../../components/ApplicantLayout"
import { notifyAdmin } from "../../lib/notifications"
import {useMemo } from "react" 

const inputClass = (hasError) =>
  `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`
const labelClass = "block text-xs font-semibold text-gray-600 mb-1"

// ── Generate Control Number (stored inside details JSONB only) ───────────────
async function generateControlNumber() {
  const year = new Date().getFullYear()
  const prefix = `SJ-${year}-`
  try {
    const { data } = await supabase
      .from("applications")
      .select("details")
      .order("submitted_at", { ascending: false })
      .limit(200)
    let maxSeq = 0
    if (data) {
      for (const row of data) {
        const cn = row.details?.control_number || ""
        if (cn.startsWith(prefix)) {
          const seq = parseInt(cn.replace(prefix, ""), 10)
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
        }
      }
    }
    return `${prefix}${String(maxSeq + 1).padStart(6, "0")}`
  } catch {
    return `${prefix}${String(Date.now()).slice(-6)}`
  }
}

// ── Image Preview Card ───────────────────────────────────────────────────────
function ImagePreviewCard({ file, onClose, onFileChange, fileKey }) {
  const inputRef = useRef()
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-bold text-gray-700 truncate">{file.name}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <img src={URL.createObjectURL(file)} alt="preview" className="w-full max-h-80 object-contain rounded-xl border" />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold transition">✅ Okay</button>
          <button onClick={() => inputRef.current?.click()} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-bold transition">🔄 Replace</button>
        </div>
        <input ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
          onChange={(e) => { onFileChange(e, fileKey); onClose() }} />
      </div>
    </div>
  )
}

// ── File Upload Box ──────────────────────────────────────────────────────────
function FileUploadBox({ label, fileKey, files, onFileChange, hasError, required = true, accept = ".pdf,.jpg,.jpeg,.png" }) {
  const [preview, setPreview] = useState(false)
  const file = files[fileKey]
  const isImage = file && file.type?.startsWith("image/")
  return (
    <div>
      <label className={labelClass}>{label} {required && <span className="text-red-500">*</span>}</label>
      <label
        className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition ${
          file ? "border-orange-400 bg-orange-50" : hasError ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-orange-400 bg-gray-50"
        }`}
        onClick={file && isImage ? (e) => { e.preventDefault(); setPreview(true) } : undefined}
      >
        <span className="text-xl">{file ? (isImage ? "🖼️" : "📄") : "📎"}</span>
        <span className="text-xs text-gray-500 mt-1 text-center px-2 truncate max-w-[90%]">
          {file ? file.name : "Click to browse"}
        </span>
        {!file && <input type="file" name={fileKey} accept={accept} onChange={onFileChange} className="hidden" />}
      </label>
      {preview && file && isImage && (
        <ImagePreviewCard file={file} onClose={() => setPreview(false)} fileKey={fileKey}
          onFileChange={(e, key) => onFileChange({ target: { name: key, files: e.target.files } })} />
      )}
      {file && (
        <label className="mt-1 text-xs text-orange-500 underline cursor-pointer">
          {isImage ? "Click image to preview / replace" : "Replace file"}
          <input type="file" name={fileKey} accept={accept} onChange={onFileChange} className="hidden" />
        </label>
      )}
    </div>
  )
}

function SectionHeader({ icon, title }) {
  return (
    <h2 className="text-xs font-bold text-gray-700 mb-4 pb-2 border-b-2 border-orange-200 uppercase tracking-widest flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
  )
}

function StepBar({ step, total, labels }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-orange-500" : "bg-gray-200"}`} />
        ))}
        <span className="ml-2 text-xs text-gray-400 whitespace-nowrap font-medium">Step {step}/{total}</span>
      </div>
      {labels && <p className="text-xs font-bold text-orange-600 uppercase tracking-widest text-center">{labels[step - 1]}</p>}
    </div>
  )
}

function FranchisePicker({ franchises, selected, onSelect }) {
  const today = new Date()
  const eligible = franchises.filter(f => {
    if (f.status !== "active" || !f.expiration_date) return false
    const daysLeft = Math.round((new Date(f.expiration_date + "T00:00:00") - today) / 86_400_000)
    return daysLeft <= 30
  })
  if (eligible.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-4 text-sm">
        <p className="font-bold mb-1">⚠️ No Franchises Eligible for Renewal</p>
        <p className="text-xs">You can only renew a franchise within 30 days of its expiration date.</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {eligible.map(f => {
        const daysLeft = Math.round((new Date(f.expiration_date + "T00:00:00") - today) / 86_400_000)
        return (
          <button key={f.id} type="button" onClick={() => onSelect(f)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected?.id === f.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300" : "border-gray-200 hover:border-emerald-300 bg-white"
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-800">Franchise #{f.franchise_number}</p>
                <p className="text-xs text-gray-500 mt-0.5">Plate: {f.plate_number || "—"} · Expires: {f.expiration_date}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${daysLeft <= 15 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                {daysLeft}d left
              </span>
            </div>
            {selected?.id === f.id && <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Selected</p>}
          </button>
        )
      })}
    </div>
  )
}

function WarningPopup({ messages, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-red-500">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <h2 className="text-base font-extrabold text-gray-800">Duplicate Records Found</h2>
            <p className="text-xs text-gray-400">Please review the issues below</p>
          </div>
        </div>
        <div className="space-y-2 mb-5">
          {messages.map((m, i) => <div key={i} className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">{m}</div>)}
        </div>
        <button onClick={onClose} className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm transition">
          Understood — Fix & Resubmit
        </button>
      </div>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Apply() {
  const navigate = useNavigate()
  const [appType, setAppType] = useState("")
  const [step, setStep] = useState(1)
  const TOTAL_STEPS = 3
  const STEP_LABELS = ["Personal & Vehicle Info", "Required Documents", "Vehicle & Garage Photos"]

  const [myFranchises, setMyFranchises] = useState([])
  const [selectedFranchise, setSelectedFranchise] = useState(null)

const emptyForm = useMemo(() => ({
  franchise_owner: "", address: "", date_of_birth: "", place_of_birth: "",
  civil_status: "", nationality: "Filipino", email: "", contact_number: "",
  old_owner: "", franchise_status: "", franchise_number: "", franchise_expiration: "",
  make: "", color: "", motor_no: "", chassis_no: "", plate_no: "", classification: "", remarks: "",
}), [])

const emptyFiles = useMemo(() => ({
  or_latest: null, cr: null, cedula: null, police_clearance: null,
  barangay_residency: null, voters_cert: null, stencil_motor: null,
  tricycle_condition: null, left_signal: null, right_signal: null,
  head_light: null, tail_light: null, ilaw_sidecar: null, basurahan_sidecar: null,
  garage_condition: null, garage_photo: null, owner_photo: null,
}), [])

  const [formData, setFormData] = useState(emptyForm)
  const [files, setFiles] = useState(emptyFiles)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedControlNumber, setSubmittedControlNumber] = useState("")
  const [error, setError] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [duplicateAlerts, setDuplicateAlerts] = useState([])
  const [showDupPopup, setShowDupPopup] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const topRef = useRef(null)
  const errorRef = useRef(null)

  useEffect(() => {
    if (appType !== "renewal") return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("franchises").select("*").eq("applicant_id", user.id).order("franchise_number")
      setMyFranchises(data || [])
    })()
  }, [appType])

  useEffect(() => {
    if (!selectedFranchise) return
    setFormData(prev => ({
      ...prev,
      franchise_number: selectedFranchise.franchise_number || "",
      franchise_expiration: selectedFranchise.expiration_date || "",
      franchise_status: selectedFranchise.status || "",
      plate_no: selectedFranchise.plate_number || prev.plate_no,
    }))
  }, [selectedFranchise])

useEffect(() => {
  if (!appType) return
  checkApplicantEligibility()
  setStep(1)
  setSelectedFranchise(null)
  setFormData(emptyForm)
  setFiles(emptyFiles)
  setError("")
  setFieldErrors({})
}, [appType, emptyForm, emptyFiles])

  const checkApplicantEligibility = async () => {
    setCheckingStatus(true); setBlockReason("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: pending } = await supabase.from("applications").select("id,status,type")
        .eq("applicant_id", user.id).in("status", ["pending", "under_review"]).limit(1)
      if (pending?.length > 0) {
        setBlockReason(`You already have a ${pending[0].type} application being processed (status: ${pending[0].status}).`)
        setCheckingStatus(false); return
      }
      const { data: approved } = await supabase.from("applications").select("id").eq("applicant_id", user.id).eq("status", "approved")
      if (approved?.length >= 3) setBlockReason("You have reached the maximum limit of 3 approved franchises.")
    } catch (err) { console.error(err) }
    setCheckingStatus(false)
  }

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setFieldErrors(p => ({ ...p, [e.target.name]: false })); setError("") }
  const handleFileChange = (e) => { setFiles({ ...files, [e.target.name]: e.target.files[0] }); setFieldErrors(p => ({ ...p, [e.target.name]: false })); setError("") }
  const handleReset = () => { setFormData(emptyForm); setFiles(emptyFiles); setError(""); setSuccess(false); setDuplicateAlerts([]); setStep(1); setSelectedFranchise(null); setFieldErrors({}) }

  const validateStep1 = () => {
    const errs = {}
    if (!formData.franchise_owner.trim()) errs.franchise_owner = true
    if (!formData.address.trim()) errs.address = true
    if (!formData.date_of_birth) errs.date_of_birth = true
    if (!formData.civil_status) errs.civil_status = true
    if (!formData.contact_number.trim()) errs.contact_number = true
    if (!formData.make.trim()) errs.make = true
    if (!formData.color.trim()) errs.color = true
    if (!formData.motor_no.trim()) errs.motor_no = true
    if (!formData.chassis_no.trim()) errs.chassis_no = true
    if (!formData.plate_no.trim()) errs.plate_no = true
    if (appType === "renewal" && !selectedFranchise) errs.selectedFranchise = true
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) { setError("⚠️ Please fill in all required fields."); errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return false }
    return true
  }

  const validateStep2 = () => {
    const errs = {}
    if (appType === "registration" && !files.stencil_motor) errs.stencil_motor = true
    if (!files.or_latest) errs.or_latest = true
    if (!files.cr) errs.cr = true
    if (!files.cedula) errs.cedula = true
    if (!files.police_clearance) errs.police_clearance = true
    if (!files.barangay_residency) errs.barangay_residency = true
    if (!files.voters_cert) errs.voters_cert = true
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) { setError("⚠️ Please upload all required documents."); errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return false }
    return true
  }

  const validateStep3 = () => {
    const errs = {}
    if (!files.tricycle_condition) errs.tricycle_condition = true
    if (!files.garage_condition) errs.garage_condition = true
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) { setError("⚠️ Required condition photos are missing."); errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return false }
    return true
  }

  const goNext = () => { setError(""); if (step === 1 && !validateStep1()) return; if (step === 2 && !validateStep2()) return; setStep(s => Math.min(s + 1, TOTAL_STEPS)); topRef.current?.scrollIntoView({ behavior: "smooth" }) }
  const goBack = () => { setError(""); setStep(s => Math.max(s - 1, 1)); topRef.current?.scrollIntoView({ behavior: "smooth" }) }

  const checkDuplicates = async () => {
    const alerts = []
    for (const check of [
      { field: "motor_no", value: formData.motor_no, label: "Engine/Motor Number" },
      { field: "chassis_no", value: formData.chassis_no, label: "Chassis Number" },
      { field: "plate_no", value: formData.plate_no, label: "Plate Number" },
    ]) {
      if (!check.value.trim()) continue
      const { data } = await supabase.from("applications").select("id").eq("status", "approved").contains("details", { [check.field]: check.value.trim() }).limit(1)
      if (data?.length > 0) alerts.push(`  ${check.label} "${check.value.trim()}" is already registered in an approved franchise.`)
    }
    return alerts
  }

  const uploadFile = async (file, path) => {
    if (!file) return null
    const { error: e } = await supabase.storage.from("franchise-documents").upload(path, file, { upsert: true })
    if (e) return null
    return supabase.storage.from("franchise-documents").getPublicUrl(path).data.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setDuplicateAlerts([])
    if (!validateStep3()) return
    if (blockReason) return
    setLoading(true)
    try {
      const dupes = await checkDuplicates()
      if (dupes.length > 0) { setDuplicateAlerts(dupes); setShowDupPopup(true); setLoading(false); return }

      const { data: { user } } = await supabase.auth.getUser()
      const uid = user.id; const ts = Date.now()

      // ✅ Control number ONLY stored in details JSONB — no separate column
      const controlNumber = await generateControlNumber()

      const urls = {}
      const fileMap = {
        or_latest: `${uid}/or_latest_${ts}`, cr: `${uid}/cr_${ts}`, cedula: `${uid}/cedula_${ts}`,
        police_clearance: `${uid}/police_clearance_${ts}`, barangay_residency: `${uid}/barangay_residency_${ts}`,
        voters_cert: `${uid}/voters_cert_${ts}`, stencil_motor: `${uid}/stencil_motor_${ts}`,
        tricycle_condition: `${uid}/tricycle_condition_${ts}`, left_signal: `${uid}/left_signal_${ts}`,
        right_signal: `${uid}/right_signal_${ts}`, head_light: `${uid}/head_light_${ts}`,
        tail_light: `${uid}/tail_light_${ts}`, ilaw_sidecar: `${uid}/ilaw_sidecar_${ts}`,
        basurahan_sidecar: `${uid}/basurahan_sidecar_${ts}`, garage_condition: `${uid}/garage_condition_${ts}`,
        garage_photo: `${uid}/garage_photo_${ts}`, owner_photo: `${uid}/owner_photo_${ts}`,
      }
      for (const [key, path] of Object.entries(fileMap)) {
        if (files[key]) urls[key] = await uploadFile(files[key], path)
      }

      const details = {
        ...formData,
        control_number: controlNumber, // ✅ ONLY in details
        ...(appType === "renewal" && selectedFranchise ? { franchise_number: selectedFranchise.franchise_number } : {}),
        documents: urls,
      }

      // ✅ No control_number top-level column — only applicant_id, type, status, details
      const { data: newApp, error: insertError } = await supabase
        .from("applications")
        .insert({ applicant_id: uid, type: appType, status: "pending", details, submitted_at: new Date().toISOString() })
        .select().single()

      if (insertError) throw insertError

      if (newApp) {
        await notifyAdmin({
          senderId: uid,
          title: appType === "registration" ? "New Franchise Application" : "Franchise Renewal Submitted",
          message: `${formData.franchise_owner} submitted a ${appType} application. Control #: ${controlNumber}`,
          applicationId: newApp.id,
          notificationType: "application_submitted",
        })
      }

      setSubmittedControlNumber(controlNumber)
      setSuccess(true)
    } catch (err) { setError("❌ " + err.message) }
    setLoading(false)
  }

  const isRenewal = appType === "renewal"
  const isRegistration = appType === "registration"

  return (
    <ApplicantLayout backLabel="Back to Dashboard" backPath="/applicant/dashboard">
      <div className="max-w-7xl mx-auto px-4 py-6" ref={topRef}>
        <div className="bg-white rounded-2xl shadow-md border-t-4 border-orange-500 p-6 md:p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 mb-3">
              <span className="text-3xl">🛺</span>
            </div>
            <h1 className="text-xl font-extrabold text-blue-900 uppercase tracking-wide">Application for Tricycle Franchise</h1>
            <p className="text-gray-400 text-sm mt-1">Municipality of San Jose, Occidental Mindoro</p>
          </div>

          {/* Type Toggle */}
          <div className="mb-6">
            <p className="text-sm font-bold text-red-700 mb-3 text-center uppercase tracking-wide">SELECT APPLICATION TYPE <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "registration", icon: "📋", label: "New Registration", sub: "Apply for a brand-new franchise" },
                { id: "renewal", icon: "🔄", label: "Renewal", sub: "Renew an existing franchise" },
              ].map(({ id, icon, label, sub }) => (
                <button key={id} type="button" onClick={() => { setAppType(id); setError(""); setDuplicateAlerts([]) }}
                  className={`relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl font-semibold transition-all duration-200 text-center shadow-sm border-2 ${
                    appType === id
                      ? id === "registration" ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-300 scale-[1.03] shadow-lg" : "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300 scale-[1.03] shadow-lg"
                      : "border-red-400 bg-white text-gray-600 hover:border-orange-300 hover:bg-orange-50"
                  }`}>
                  {appType === id && <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-white shadow border">✓</span>}
                  <span className="text-3xl">{icon}</span>
                  <span className="text-sm font-extrabold uppercase">{label}</span>
                  <span className="text-xs font-normal text-gray-400">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {checkingStatus && <div className="bg-blue-50 border border-blue-300 text-blue-700 p-4 rounded-xl mb-4 text-sm flex items-center gap-2"><span className="animate-spin">⏳</span> Checking status…</div>}
          {blockReason && !checkingStatus && (
            <div className="bg-yellow-50 border-2 border-yellow-400 text-yellow-800 p-5 rounded-xl mb-4 text-sm flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🚫</span>
              <div><p className="font-bold mb-1">Application Blocked</p><p>{blockReason}</p></div>
            </div>
          )}
          {error && (
            <div ref={errorRef} className="bg-red-50 border border-red-400 text-red-600 p-4 rounded-xl mb-4 text-sm flex items-start gap-2">
              <span className="flex-shrink-0 text-lg">⚠️</span><span className="font-medium">{error}</span>
            </div>
          )}
          {showDupPopup && duplicateAlerts.length > 0 && <WarningPopup messages={duplicateAlerts} onClose={() => setShowDupPopup(false)} />}

          {appType && !blockReason && !checkingStatus && (
            <form onSubmit={handleSubmit}>
              <StepBar step={step} total={TOTAL_STEPS} labels={STEP_LABELS} />

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  {isRenewal && (
                    <div>
                      <SectionHeader icon="🔄" title="Select Franchise to Renew" />
                      <FranchisePicker franchises={myFranchises} selected={selectedFranchise} onSelect={setSelectedFranchise} />
                      {fieldErrors.selectedFranchise && <p className="text-xs text-red-500 mt-2">⚠️ Please select a franchise to renew.</p>}
                    </div>
                  )}
                  <SectionHeader icon="👤" title="Personal Information" />
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <label className={labelClass}>Owner's Name <span className="text-red-500">*</span></label>
                      <input type="text" name="franchise_owner" value={formData.franchise_owner} onChange={handleChange} placeholder="Full Name" className={inputClass(fieldErrors.franchise_owner)} />
                    </div>
                    <div>
                      <label className={labelClass}>Photo</label>
                      <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition overflow-hidden">
                        {files.owner_photo ? <img src={URL.createObjectURL(files.owner_photo)} alt="preview" className="w-full h-full object-cover" /> : <span className="text-2xl text-gray-300">📷</span>}
                        <input type="file" name="owner_photo" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                  {isRenewal && (
                    <div>
                      <label className={labelClass}>Franchise Number (auto-filled)</label>
                      <input type="text" readOnly value={selectedFranchise?.franchise_number || ""} className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500" placeholder="Will auto-fill after selecting franchise" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Address <span className="text-red-500">*</span></label>
                      <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Barangay, San Jose, Occ. Mindoro" className={inputClass(fieldErrors.address)} />
                    </div>
                    <div>
                      <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                      <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={inputClass(fieldErrors.date_of_birth)} />
                    </div>
                    <div>
                      <label className={labelClass}>Place of Birth</label>
                      <input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} placeholder="City/Municipality" className={inputClass(false)} />
                    </div>
                    <div>
                      <label className={labelClass}>Civil Status <span className="text-red-500">*</span></label>
                      <select name="civil_status" value={formData.civil_status} onChange={handleChange} className={inputClass(fieldErrors.civil_status)}>
                        <option value="">-- Select --</option>
                        <option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Nationality</label>
                      <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={inputClass(false)} />
                    </div>
                    <div>
                      <label className={labelClass}>Contact Number <span className="text-red-500">*</span></label>
                      <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleChange} placeholder="09XXXXXXXXX" className={inputClass(fieldErrors.contact_number)} />
                    </div>
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className={inputClass(false)} />
                    </div>
                    {isRenewal && selectedFranchise && (
                      <>
                        <div>
                          <label className={labelClass}>Old Owner (if transferred)</label>
                          <input type="text" name="old_owner" value={formData.old_owner} onChange={handleChange} placeholder="Previous owner name" className={inputClass(false)} />
                        </div>
                        <div>
                          <label className={labelClass}>Franchise Expiration</label>
                          <input type="text" readOnly value={selectedFranchise.expiration_date || ""} className="w-full border border-gray-200 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="pt-1">
                    <SectionHeader icon="🏍️" title="Motorcycle Information" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className={labelClass}>Make <span className="text-red-500">*</span></label>
                        <input type="text" name="make" value={formData.make} onChange={handleChange} placeholder="e.g. RUSI, HONDA, KAWASAKI" className={inputClass(fieldErrors.make)} />
                      </div>
                      <div>
                        <label className={labelClass}>Color <span className="text-red-500">*</span></label>
                        <input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="e.g. Red" className={inputClass(fieldErrors.color)} />
                      </div>
                      <div>
                        <label className={labelClass}>Motor/Engine No. <span className="text-red-500">*</span></label>
                        <input type="text" name="motor_no" value={formData.motor_no} onChange={handleChange} placeholder="Engine Number" className={inputClass(fieldErrors.motor_no)} />
                      </div>
                      <div>
                        <label className={labelClass}>Chassis No. <span className="text-red-500">*</span></label>
                        <input type="text" name="chassis_no" value={formData.chassis_no} onChange={handleChange} placeholder="Chassis Number" className={inputClass(fieldErrors.chassis_no)} />
                      </div>
                      <div>
                        <label className={labelClass}>Plate No. <span className="text-red-500">*</span></label>
                        <input type="text" name="plate_no" value={formData.plate_no} onChange={handleChange} placeholder="Plate Number" className={inputClass(fieldErrors.plate_no)} />
                      </div>
                      <div>
                        <label className={labelClass}>Classification</label>
                        <select name="classification" value={formData.classification} onChange={handleChange} className={inputClass(false)}>
                          <option value="">-- Select --</option>
                          <option value="for_hire">For Hire</option>
                          <option value="not_for_hire">Not for Hire</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">⚠️ Engine, Chassis, and Plate Numbers must be unique across all approved franchises.</p>
                  </div>
                  <div>
                    <SectionHeader icon="📝" title="Remarks / Notes" />
                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Additional notes or special instructions…" rows={2} className={inputClass(false)} />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-600 mb-1">📌 Important Reminders:</p>
                    <p>• One active application (pending/under review) at a time.</p>
                    <p>• Maximum of <strong>3 approved franchises</strong> per applicant.</p>
                    <p>• Engine, Chassis, and Plate Numbers must be unique.</p>
                    {isRegistration && <p>• <strong>Franchise number is auto-generated</strong> upon approval — not required here.</p>}
                    {isRenewal && <p>• <strong>Franchise number remains the same</strong> upon renewal.</p>}
                  </div>
                  <button type="button" onClick={goNext} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-md">Next: Documents →</button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <SectionHeader icon="📎" title="Upload Required Documents" />
                  <p className="text-xs text-gray-500 italic bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">📌 Mag-upload ng litrato ng mga sumusunod na dokumento. Tiyaking malinaw at nababasa ang bawat dokumento.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isRegistration && (
                      <div className="col-span-full">
                        <FileUploadBox label="Stencil ng Motor (Engine / Chassis)" fileKey="stencil_motor" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.stencil_motor} accept="image/*" />
                      </div>
                    )}
                    <FileUploadBox label="Latest O.R. ng Motor (LTO)" fileKey="or_latest" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.or_latest} />
                    <FileUploadBox label="Certificate of Registration C.R. (LTO)" fileKey="cr" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.cr} />
                    <FileUploadBox label="Cedula (Updated)" fileKey="cedula" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.cedula} />
                    <FileUploadBox label="Police Clearance" fileKey="police_clearance" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.police_clearance} />
                    <FileUploadBox label="Barangay Residency (Updated)" fileKey="barangay_residency" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.barangay_residency} />
                    <FileUploadBox label="Voter's Certification – COMELEC (Updated)" fileKey="voters_cert" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.voters_cert} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={goBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition">← Back</button>
                    <button type="button" onClick={goNext} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-md">Next: Photos →</button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <SectionHeader icon="🔧" title="Tricycle Condition Photos" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="col-span-full">
                      <FileUploadBox label="Tricycle Condition (Overall)" fileKey="tricycle_condition" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.tricycle_condition} accept="image/*" />
                    </div>
                    <FileUploadBox label="Left Signal Light" fileKey="left_signal" required={false} files={files} onFileChange={handleFileChange} hasError={false} accept="image/*" />
                    <FileUploadBox label="Right Signal Light" fileKey="right_signal" required={false} files={files} onFileChange={handleFileChange} hasError={false} accept="image/*" />
                    <FileUploadBox label="Head Light" fileKey="head_light" required={false} files={files} onFileChange={handleFileChange} hasError={false} accept="image/*" />
                    <FileUploadBox label="Tail Light" fileKey="tail_light" required={false} files={files} onFileChange={handleFileChange} hasError={false} accept="image/*" />
                    <FileUploadBox label="Ilaw sa Loob ng Sidecar" fileKey="ilaw_sidecar" required={false} files={files} onFileChange={handleFileChange} hasError={false} accept="image/*" />
                    <FileUploadBox label="Basurahan sa Loob ng Sidecar" fileKey="basurahan_sidecar" required={false} files={files} onFileChange={handleFileChange} hasError={false} accept="image/*" />
                  </div>
                  <SectionHeader icon="🏠" title="Garage Condition Photos" />
                  <div className="grid grid-cols-2 gap-4">
                    <FileUploadBox label="Garage Condition (Overall)" fileKey="garage_condition" files={files} onFileChange={handleFileChange} hasError={!!fieldErrors.garage_condition} accept="image/*" />
                    <FileUploadBox label="Garage / Garahe (with tricycle)" fileKey="garage_photo" required={false} files={files} onFileChange={handleFileChange} hasError={false} accept="image/*" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={goBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition">← Back</button>
                    <button type="submit" disabled={loading}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition shadow-md ${isRegistration ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"} disabled:opacity-60 disabled:cursor-not-allowed`}>
                      {loading ? "⏳ Submitting…" : isRegistration ? "📋 Submit Registration" : "🔄 Submit Renewal"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {!appType && (
            <div className="text-center py-12 text-gray-400">
              <span className="text-5xl">✋🏻🛑⛔️</span>
              <p className="mt-3 text-sm font-medium">Please select an application type above to begin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-green-500 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-extrabold text-blue-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-500 text-sm mb-1">Your <span className="font-semibold text-orange-600 capitalize">{appType}</span> application has been successfully submitted.</p>
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 my-4">
              <p className="text-xs text-gray-500 mb-1">Your Control Number</p>
              <p className="text-lg font-extrabold text-orange-600 tracking-widest">{submittedControlNumber}</p>
              <p className="text-xs text-gray-400 mt-1">Use this to track your application</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-left text-xs text-green-700 space-y-1">
              <p>✅ Application recorded</p><p>✅ Documents uploaded</p>
              <p>✅ Admin notified</p><p>⏳ Awaiting admin review</p>
            </div>
            <button onClick={() => { handleReset(); navigate("/applicant/apply") }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm transition">
              📋 View My Applications
            </button>
          </div>
        </div>
      )}
    </ApplicantLayout>
  )
}