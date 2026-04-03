import { useState, useRef, useEffect } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import ApplicantLayout from "../../components/ApplicantLayout"
import { notifyAdmin } from "../../lib/notifications"

// ─── helpers ────────────────────────────────────────────────────────────────
const inputClass = (hasError) =>
  `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`
const labelClass = "block text-xs font-semibold text-gray-600 mb-1"

// Photo / file upload button
function FileUploadBox({ label, fileKey, files, onFileChange, hasError, accept = ".pdf,.jpg,.jpeg,.png" }) {
  return (
    <div>
      <label className={labelClass}>
        {label} <span className="text-red-500">*</span>
      </label>
      <label
        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition ${
          files[fileKey]
            ? "border-orange-400 bg-orange-50"
            : hasError
            ? "border-red-400 bg-red-50"
            : "border-gray-300 hover:border-orange-400 bg-gray-50"
        }`}
      >
        <span className="text-2xl">{files[fileKey] ? "✅" : "📄"}</span>
        <span className="text-xs text-gray-500 mt-1 text-center px-2 truncate max-w-full">
          {files[fileKey] ? files[fileKey].name : "Click to browse"}
        </span>
        <input type="file" name={fileKey} accept={accept} onChange={onFileChange} className="hidden" />
      </label>
    </div>
  )
}

// Multi-photo upload box
function MultiPhotoBox({ label, fileKey, files, onFileChange, hasError }) {
  return (
    <div>
      <label className={labelClass}>
        {label} <span className="text-red-500">*</span>
      </label>
      <label
        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition ${
          files[fileKey]
            ? "border-orange-400 bg-orange-50"
            : hasError
            ? "border-red-400 bg-red-50"
            : "border-gray-300 hover:border-orange-400 bg-gray-50"
        }`}
      >
        <span className="text-2xl">{files[fileKey] ? "🖼️" : "📷"}</span>
        <span className="text-xs text-gray-500 mt-1 text-center px-2 truncate max-w-full">
          {files[fileKey] ? files[fileKey].name : "Click to upload photo"}
        </span>
        <input type="file" name={fileKey} accept="image/*" onChange={onFileChange} className="hidden" />
      </label>
    </div>
  )
}

// ─── section header ──────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <h2 className="text-xs font-bold text-gray-700 mb-3 pb-2 border-b-2 border-orange-200 uppercase tracking-widest flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function Apply() {
  const navigate = useNavigate()

  const [appType, setAppType] = useState("") // "registration" | "renewal"

  const emptyForm = {
    // personal
    franchise_owner: "", control_number: "",
    address: "", date_of_birth: "", place_of_birth: "",
    civil_status: "", nationality: "Filipino",
    email: "", contact_number: "",
    // renewal-only
    old_owner: "", franchise_status: "", franchise_number: "", franchise_expiration: "",
    // motorcycle
    make: "", color: "", motor_no: "", chassis_no: "", plate_no: "", classification: "",
    // remarks
    remarks: "",
  }

  const [formData, setFormData] = useState(emptyForm)

  // ── files – registration docs
  const emptyFiles = {
    // shared docs
    or_latest: null,
    cr: null,
    cedula: null,
    police_clearance: null,
    barangay_residency: null,
    voters_cert: null,
    // registration-only
    stencil_motor: null,
    // multi-photo uploads (one file per slot)
    tricycle_condition: null,
    left_signal: null,
    right_signal: null,
    head_light: null,
    tail_light: null,
    ilaw_sidecar: null,
    basurahan_sidecar: null,
    garage_condition: null,
    garage_photo: null,
    // personal photo
    owner_photo: null,
  }

  const [files, setFiles] = useState(emptyFiles)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [blockReason, setBlockReason] = useState("") // pending/max block
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [duplicateAlerts, setDuplicateAlerts] = useState([]) // array of messages

  // refs for scroll-to
  const refs = {
    type: useRef(null),
    franchise_owner: useRef(null),
    control_number: useRef(null),
    address: useRef(null),
    date_of_birth: useRef(null),
    civil_status: useRef(null),
    contact_number: useRef(null),
    make: useRef(null),
    color: useRef(null),
    motor_no: useRef(null),
    chassis_no: useRef(null),
    plate_no: useRef(null),
    or_latest: useRef(null),
    cr: useRef(null),
    cedula: useRef(null),
    police_clearance: useRef(null),
    barangay_residency: useRef(null),
    voters_cert: useRef(null),
    stencil_motor: useRef(null),
    tricycle_condition: useRef(null),
    garage_condition: useRef(null),
  }

  const scrollTo = (key) => refs[key]?.current?.scrollIntoView({ behavior: "smooth", block: "center" })

  // ── check applicant eligibility on mount & when appType changes
  useEffect(() => {
    if (!appType) return
    checkApplicantEligibility()
  }, [appType])

  const checkApplicantEligibility = async () => {
    setCheckingStatus(true)
    setBlockReason("")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check for pending / under-review application
      const { data: pending } = await supabase
        .from("applications")
        .select("id, status, type")
        .eq("applicant_id", user.id)
        .in("status", ["pending", "under_review"])
        .limit(1)

      if (pending && pending.length > 0) {
        setBlockReason(
          `You already have a ${pending[0].type} application currently being processed (status: ${pending[0].status}). Please wait for the admin to finalize it before submitting a new one.`
        )
        setCheckingStatus(false)
        return
      }

      // Check maximum 3 approved franchises
      const { data: approved } = await supabase
        .from("applications")
        .select("id")
        .eq("applicant_id", user.id)
        .eq("status", "approved")

      if (approved && approved.length >= 3) {
        setBlockReason(
          "You have reached the maximum limit of 3 approved franchises. No further applications can be submitted."
        )
      }
    } catch (err) {
      console.error("Eligibility check error:", err)
    }
    setCheckingStatus(false)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
    setDuplicateAlerts([])
  }

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] })
    setError("")
  }

  const handleReset = () => {
    setFormData(emptyForm)
    setFiles(emptyFiles)
    setError("")
    setSuccess(false)
    setDuplicateAlerts([])
  }

  // ── duplicate field check
  const checkDuplicates = async () => {
    const alerts = []
    try {
      const checks = [
        { field: "motor_no", value: formData.motor_no, label: "Engine/Motor Number" },
        { field: "chassis_no", value: formData.chassis_no, label: "Chassis Number" },
        { field: "plate_no", value: formData.plate_no, label: "Plate Number" },
      ]

      for (const check of checks) {
        if (!check.value.trim()) continue
        // Query approved applications containing this value in details JSONB
        const { data } = await supabase
          .from("applications")
          .select("id")
          .eq("status", "approved")
          .contains("details", { [check.field]: check.value.trim() })
          .limit(1)

        if (data && data.length > 0) {
          alerts.push(`⚠️ ${check.label} "${check.value.trim()}" is already registered in an approved franchise and cannot be reused.`)
        }
      }
    } catch (err) {
      console.error("Duplicate check error:", err)
    }
    return alerts
  }

  const uploadFile = async (file, path) => {
    if (!file) return null
    const { error: uploadError } = await supabase.storage
      .from("franchise-documents")
      .upload(path, file, { upsert: true })
    if (uploadError) return null
    const { data: urlData } = supabase.storage.from("franchise-documents").getPublicUrl(path)
    return urlData.publicUrl
  }

  // ── validation
  const validateForm = () => {
    const req = (cond, msg, refKey) => {
      if (!cond) { setError("⚠️" + msg); scrollTo(refKey); return false }
      return true
    }

    if (!appType) { setError("Please select an Application Type."); scrollTo("type"); return false }
    if (!req(formData.franchise_owner.trim(), "Franchise Owner name is required.", "franchise_owner")) return false
    if (!req(formData.control_number.trim(), "Control Number is required.", "control_number")) return false
    if (!req(formData.address.trim(), "Address is required.", "address")) return false
    if (!req(formData.date_of_birth, "Date of Birth is required.", "date_of_birth")) return false
    if (!req(formData.civil_status, "Civil Status is required.", "civil_status")) return false
    if (!req(formData.contact_number.trim(), "Contact Number is required.", "contact_number")) return false
    if (!req(formData.make.trim(), "Motorcycle Make is required.", "make")) return false
    if (!req(formData.color.trim(), "Motorcycle Color is required.", "color")) return false
    if (!req(formData.motor_no.trim(), "Motor/Engine Number is required.", "motor_no")) return false
    if (!req(formData.chassis_no.trim(), "Chassis Number is required.", "chassis_no")) return false
    if (!req(formData.plate_no.trim(), "Plate Number is required.", "plate_no")) return false

    // documents
    if (appType === "registration") {
      if (!req(files.stencil_motor, "Stencil ng Motor (Engine/Chassis) photo is required.", "stencil_motor")) return false
    }
    if (!req(files.or_latest, "Latest OR (Official Receipt) from LTO is required.", "or_latest")) return false
    if (!req(files.cr, "Certificate of Registration (CR) from LTO is required.", "cr")) return false
    if (!req(files.cedula, "Cedula (Updated) is required.", "cedula")) return false
    if (!req(files.police_clearance, "Police Clearance is required.", "police_clearance")) return false
    if (!req(files.barangay_residency, "Barangay Residency is required.", "barangay_residency")) return false
    if (!req(files.voters_cert, "Voter's Certification (COMELEC, Updated) is required.", "voters_cert")) return false

    // tricycle condition photos
    if (!req(files.tricycle_condition, "Tricycle condition photo is required.", "tricycle_condition")) return false
    if (!req(files.garage_condition, "Garage condition photo is required.", "garage_condition")) return false

    return true
  }

  // ── submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setDuplicateAlerts([])

    if (!validateForm()) return
    if (blockReason) return

    setLoading(true)

    try {
      // 1. Duplicate check
      const dupes = await checkDuplicates()
      if (dupes.length > 0) {
        setDuplicateAlerts(dupes)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      const uid = user.id
      const ts = Date.now()

      // 2. Upload all files
      const urls = {}
      const fileMap = {
        or_latest: `${uid}/or_latest_${ts}`,
        cr: `${uid}/cr_${ts}`,
        cedula: `${uid}/cedula_${ts}`,
        police_clearance: `${uid}/police_clearance_${ts}`,
        barangay_residency: `${uid}/barangay_residency_${ts}`,
        voters_cert: `${uid}/voters_cert_${ts}`,
        stencil_motor: `${uid}/stencil_motor_${ts}`,
        tricycle_condition: `${uid}/tricycle_condition_${ts}`,
        left_signal: `${uid}/left_signal_${ts}`,
        right_signal: `${uid}/right_signal_${ts}`,
        head_light: `${uid}/head_light_${ts}`,
        tail_light: `${uid}/tail_light_${ts}`,
        ilaw_sidecar: `${uid}/ilaw_sidecar_${ts}`,
        basurahan_sidecar: `${uid}/basurahan_sidecar_${ts}`,
        garage_condition: `${uid}/garage_condition_${ts}`,
        garage_photo: `${uid}/garage_photo_${ts}`,
        owner_photo: `${uid}/owner_photo_${ts}`,
      }

      for (const [key, path] of Object.entries(fileMap)) {
        if (files[key]) urls[key] = await uploadFile(files[key], path)
      }

      // 3. Insert application
      const { data: newApp, error: insertError } = await supabase
        .from("applications")
        .insert({
          applicant_id: uid,
          type: appType,
          status: "pending",
          details: {
            ...formData,
            documents: urls,
          },
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 4. Notify admin
      if (newApp) {
        await notifyAdmin({
          senderId: uid,
          title: appType === "registration" ? "New Franchise Application" : "Franchise Renewal Submitted",
          message: `${formData.franchise_owner} has submitted a ${appType} application.`,
          applicationId: newApp.id,
          notificationType: "application_submitted",
        })
      }

      setSuccess(true)
    } catch (err) {
      setError("❌ " + err.message)
    }

    setLoading(false)
  }

  const isRenewal = appType === "renewal"
  const isRegistration = appType === "registration"

  // ── render
  return (
    <ApplicantLayout backLabel="Back to Dashboard" backPath="/applicant/dashboard">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md border-t-4 border-orange-500 p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 mb-3">
              <span className="text-3xl">🛺</span>
            </div>
            <h1 className="text-xl font-extrabold text-blue-900 uppercase tracking-wide">
              Application for Tricycle Franchise
            </h1>
            <p className="text-gray-400 text-sm mt-1">Municipality of San Jose, Occidental Mindoro</p>
          </div>

          {/* ── Application Type Toggle */}
          <div ref={refs.type} className="mb-8">
            <p className="text-sm font-bold text-red-700 mb-3 text-center uppercase tracking-wide">
              SELECT APPLICATION TYPE <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  id: "registration",
                  icon: "📋",
                  label: "New Registration",
                  sub: "Apply for a brand-new franchise",
                  color: "blue",
                },
                {
                  id: "renewal",
                  icon: "🔄",
                  label: "Renewal",
                  sub: "Renew an existing franchise",
                  color: "green",
                },
              ].map(({ id, icon, label, sub}) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setAppType(id); setError(""); setDuplicateAlerts([]) }}
                  className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-3 font-semibold transition-all duration-200 text-center shadow-sm
                    ${appType === id
                      ? id === "registration"
                        ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-300 scale-105 shadow-lg"
                        : "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-300 scale-105 shadow-lg"
                      : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  style={{ borderWidth: "2px" }}
                >
                  {appType === id && (
                    <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-white shadow-sm border">
                      ✓ Selected
                    </span>
                  )}
                  <span className="text-4xl">{icon}</span>
                  <span className="text-base font-extrabold uppercase tracking-wide">{label}</span>
                  <span className="text-xs font-normal text-gray-500">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Block notice */}
          {checkingStatus && (
            <div className="bg-blue-50 border border-blue-300 text-blue-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
              <span className="animate-spin">⏳</span> Checking your application status…
            </div>
          )}

          {blockReason && !checkingStatus && (
            <div className="bg-yellow-50 border-2 border-yellow-400 text-yellow-800 p-5 rounded-xl mb-6 text-sm flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🚫</span>
              <div>
                <p className="font-bold mb-1">Application Blocked</p>
                <p>{blockReason}</p>
              </div>
            </div>
          )}

          {/* ── Duplicate alerts */}
          {duplicateAlerts.length > 0 && (
            <div className="bg-red-50 border-2 border-red-400 text-red-700 p-5 rounded-xl mb-6 text-sm space-y-2">
              <p className="font-bold flex items-center gap-2"><span>❌</span> Duplicate Records Found</p>
              {duplicateAlerts.map((msg, i) => <p key={i}>{msg}</p>)}
              <p className="text-xs text-red-500 mt-1">Please verify the details and contact the admin if you believe this is an error.</p>
            </div>
          )}

          {/* ── General error */}
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-start gap-2 animate-pulse">
              <span className="flex-shrink-0 text-lg">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* ── Form (shown only when type is selected & not blocked) */}
          {appType && !blockReason && !checkingStatus && (
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* ─ Note banner */}
              <div className={`rounded-xl p-4 text-sm border-l-4 ${
                isRegistration ? "bg-blue-50 border-blue-400 text-blue-800" : "bg-emerald-50 border-emerald-400 text-emerald-800"
              }`}>
                <p className="font-bold mb-1">
                  {isRegistration ? "📋 New Franchise Registration" : "🔄 Franchise Renewal"}
                </p>
                <p className="text-xs">
                  {isRegistration
                    ? "Complete all required fields and upload all supporting documents. Your application will be reviewed by the admin. You may only submit one application at a time."
                    : "Please provide your existing franchise details and upload updated documents. The admin will process your renewal request. One active application is allowed at a time."}
                </p>
              </div>

              {/* ─ Personal Information */}
              <div>
                <SectionHeader icon="👤" title="Personal Information" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Owner + Photo */}
                  <div className="md:col-span-2 flex gap-4 items-start">
                    <div className="flex-1" ref={refs.franchise_owner}>
                      <label className={labelClass}>Owners Name <span className="text-red-500">*</span></label>
                      <input
                        type="text" name="franchise_owner" value={formData.franchise_owner}
                        onChange={handleChange} placeholder="Full Name"
                        className={inputClass(error.includes("Franchise Owner") && !formData.franchise_owner)}
                      />
                    </div>
                    <div className="text-center">
                      <label className={labelClass}>Photo</label>
                      <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-400 transition overflow-hidden">
                        {files.owner_photo
                          ? <img src={URL.createObjectURL(files.owner_photo)} alt="preview" className="w-full h-full object-cover" />
                          : <span className="text-3xl text-gray-300">📷</span>
                        }
                        <input type="file" name="owner_photo" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div ref={refs.control_number}>
                    <label className={labelClass}>Control Number <span className="text-red-500">*</span></label>
                    <input
                      type="text" name="control_number" value={formData.control_number}
                      onChange={handleChange} placeholder="e.g. 2024-0001"
                      className={inputClass(error.includes("Control Number") && !formData.control_number)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Contact Number (Numeric) <span className="text-red-500">*</span></label>
                    <input
                      ref={refs.contact_number}
                      type="tel" name="contact_number" value={formData.contact_number}
                      onChange={handleChange} placeholder="09XXXXXXXXX"
                      className={inputClass(error.includes("Contact Number") && !formData.contact_number)}
                    />
                  </div>

                  <div ref={refs.address} className="md:col-span-2">
                    <label className={labelClass}>Address <span className="text-red-500">*</span></label>
                    <input
                      type="text" name="address" value={formData.address}
                      onChange={handleChange} placeholder="Barangay, San Jose, Occ. Mindoro"
                      className={inputClass(error.includes("Address") && !formData.address)}
                    />
                  </div>

                  <div ref={refs.date_of_birth}>
                    <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                    <input
                      type="date" name="date_of_birth" value={formData.date_of_birth}
                      onChange={handleChange}
                      className={inputClass(error.includes("Date of Birth") && !formData.date_of_birth)}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Place of Birth</label>
                    <input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} placeholder="City/Municipality" className={inputClass(false)} />
                  </div>

                  <div ref={refs.civil_status}>
                    <label className={labelClass}>Civil Status <span className="text-red-500">*</span></label>
                    <select
                      name="civil_status" value={formData.civil_status} onChange={handleChange}
                      className={inputClass(error.includes("Civil Status") && !formData.civil_status)}
                    >
                      <option value="">-- Select --</option>
                      <option>Single</option><option>Married</option>
                      <option>Widowed</option><option>Separated</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Nationality</label>
                    <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={inputClass(false)} />
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className={inputClass(false)} />
                  </div>

                  {/* Renewal-only fields */}
                  {isRenewal && (
                    <>
                      <div>
                        <label className={labelClass}>Old Owner</label>
                        <input type="text" name="old_owner" value={formData.old_owner} onChange={handleChange} placeholder="If transferred" className={inputClass(false)} />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <input type="text" name="franchise_status" value={formData.franchise_status} onChange={handleChange} placeholder="e.g. Active" className={inputClass(false)} />
                      </div>
                      <div>
                        <label className={labelClass}>Franchise Number</label>
                        <input type="text" name="franchise_number" value={formData.franchise_number} onChange={handleChange} placeholder="Existing franchise #" className={inputClass(false)} />
                      </div>
                      <div>
                        <label className={labelClass}>Franchise Expiration</label>
                        <input type="date" name="franchise_expiration" value={formData.franchise_expiration} onChange={handleChange} className={inputClass(false)} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ─ Motorcycle Information */}
              <div>
                <SectionHeader icon="🏍️" title="Motorcycle Information (Old)" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: "make", label: "Make (e.g. RUSI, HONDA, KAWASAKI…)", required: true, span: "md:col-span-2" },
                    { name: "color", label: "Color", required: true },
                    { name: "motor_no", label: "Motor Number (Engine Number)", required: true },
                    { name: "chassis_no", label: "Chassis Number", required: true },
                    { name: "plate_no", label: "Plate Number", required: true },
                    { name: "classification", label: "for hire or not?", required: false },
                  ].map((f) => (
                    <div key={f.name} ref={refs[f.name]} className={f.span || ""}>
                      <label className={labelClass}>
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text" name={f.name} value={formData[f.name]}
                        onChange={handleChange} placeholder={f.label}
                        className={inputClass(
                          f.required && error.toLowerCase().includes(f.label.toLowerCase().split(" ")[0]) && !formData[f.name]
                        )}
                      />
                    </div>
                  ))}
                </div>

                {/* Duplicate check inline hint */}
                <p className="text-xs text-gray-400 mt-2">
                  ⚠️ Engine Number, Chassis Number, and Plate Number must be unique. Duplicates from approved franchises will be rejected.
                </p>
              </div>

              {/* ─ Document Uploads */}
              <div>
                <SectionHeader icon="📎" title="Upload Photo of the Following" />
                <p className="text-xs text-gray-500 italic mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  📌 Mag-upload ng litrato ng mga sumusunod na dokumento. Tiyaking malinaw at nababasa ang bawat dokumento.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Registration-only: Stencil */}
                  {isRegistration && (
                    <div ref={refs.stencil_motor} className="md:col-span-2 lg:col-span-3">
                      <MultiPhotoBox
                        label="Stencil ng Motor (Engine / Chassis)"
                        fileKey="stencil_motor"
                        files={files} onFileChange={handleFileChange}
                        hasError={error.includes("Stencil") && !files.stencil_motor}
                      />
                    </div>
                  )}

                  <div ref={refs.or_latest}>
                    <FileUploadBox label="Latest Official Receipt (O.R.) ng Motor galing LTO" fileKey="or_latest" files={files} onFileChange={handleFileChange} hasError={error.includes("OR") && !files.or_latest} />
                  </div>
                  <div ref={refs.cr}>
                    <FileUploadBox label="Certificate of Registration (C.R.) ng Motor galing LTO" fileKey="cr" files={files} onFileChange={handleFileChange} hasError={error.includes("CR") && !files.cr} />
                  </div>
                  <div ref={refs.cedula}>
                    <FileUploadBox label="Cedula (Updated)" fileKey="cedula" files={files} onFileChange={handleFileChange} hasError={error.includes("Cedula") && !files.cedula} />
                  </div>
                  <div ref={refs.police_clearance}>
                    <FileUploadBox label="Police Clearance" fileKey="police_clearance" files={files} onFileChange={handleFileChange} hasError={error.includes("Police") && !files.police_clearance} />
                  </div>
                  <div ref={refs.barangay_residency}>
                    <FileUploadBox label="Barangay Residency (Updated)" fileKey="barangay_residency" files={files} onFileChange={handleFileChange} hasError={error.includes("Barangay") && !files.barangay_residency} />
                  </div>
                  <div ref={refs.voters_cert}>
                    <FileUploadBox label="Voter's Certification – COMELEC (Updated)" fileKey="voters_cert" files={files} onFileChange={handleFileChange} hasError={error.includes("Voter") && !files.voters_cert} />
                  </div>
                </div>
              </div>

              {/* ─ Tricycle & Garage Condition */}
              <div>
                <SectionHeader icon="🔧" title="Tricycle & Garage Condition" />

                {/* Tricycle Condition */}
                <div className="mb-4">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-3">
                    Tricycle Condition — <span className="text-gray-500 normal-case font-normal">litrato ng mga sumusunod</span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div ref={refs.tricycle_condition} className="md:col-span-3">
                      <MultiPhotoBox label="Tricycle Condition (Overall)" fileKey="tricycle_condition" files={files} onFileChange={handleFileChange} hasError={error.includes("Tricycle condition") && !files.tricycle_condition} />
                    </div>
                    <MultiPhotoBox label="Left Signal Light (Photo of Working Signal Light)" fileKey="left_signal" files={files} onFileChange={handleFileChange} hasError={false} />
                    <MultiPhotoBox label="Right Signal Light (Photo of Working Signal Light)" fileKey="right_signal" files={files} onFileChange={handleFileChange} hasError={false} />
                    <MultiPhotoBox label="Head Light (Photo of Working Headlight)" fileKey="head_light" files={files} onFileChange={handleFileChange} hasError={false} />
                    <MultiPhotoBox label="Tailight (Photo of Working Tailight)" fileKey="tail_light" files={files} onFileChange={handleFileChange} hasError={false} />
                    <MultiPhotoBox label="Ilaw sa Loob ng Sidecar (Photo of Working Light)" fileKey="ilaw_sidecar" files={files} onFileChange={handleFileChange} hasError={false} />
                    <MultiPhotoBox label="Basurahan sa Loob ng Sidecar (Photo – Trash Can)" fileKey="basurahan_sidecar" files={files} onFileChange={handleFileChange} hasError={false} />
                  </div>
                </div>

                {/* Garage Condition */}
                <div>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-3">
                    Garage Condition — <span className="text-gray-500 normal-case font-normal">litrato ng mga sumusunod</span>
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div ref={refs.garage_condition}>
                      <MultiPhotoBox label="Garage Condition (Overall)" fileKey="garage_condition" files={files} onFileChange={handleFileChange} hasError={error.includes("Garage condition") && !files.garage_condition} />
                    </div>
                    <MultiPhotoBox label="Garage / Garahe (litrato ng garahe kasama ang sasakyan / tricycle)" fileKey="garage_photo" files={files} onFileChange={handleFileChange} hasError={false} />
                  </div>
                </div>
              </div>

              {/* ─ Remarks */}
              <div>
                <SectionHeader icon="📝" title="Remarks / Notes" />
                <textarea
                  name="remarks" value={formData.remarks} onChange={handleChange}
                  placeholder="Additional notes, remarks, or special instructions…"
                  rows={3} className={inputClass(false)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use this field for any additional information you want the admin to know about your application.
                </p>
              </div>

              {/* ─ Submission rules reminder */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-600 mb-2">📌 Important Reminders:</p>
                <p>• You may only have <strong>one active (pending/under review) application</strong> at a time.</p>
                <p>• A maximum of <strong>3 approved franchises</strong> per applicant is allowed.</p>
                <p>• <strong>Engine Number, Chassis Number, and Plate Number</strong> must be unique — no duplicates from approved franchises will be accepted.</p>
                <p>• Wait for admin approval before submitting another application.</p>
              </div>

              {/* ─ Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit" disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm tracking-wide text-white transition shadow-md ${
                    appType === "registration"
                      ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                      : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading ? "⏳ Submitting…" : appType === "registration" ? "📋 Submit New Registration" : "🔄 Submit Renewal"}
                </button>
                <button
                  type="button" onClick={handleReset}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition"
                >
                  🔃 Reset Form
                </button>
              </div>
            </form>
          )}

          {/* No type selected prompt */}
          {!appType && (
            <div className="text-center py-12 text-gray-400">
              <span className="text-5xl">☝️</span>
              <p className="mt-3 text-sm font-medium">Please select an application type above to begin.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-green-500 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-extrabold text-blue-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-500 text-sm mb-2">
              Your <span className="font-semibold text-orange-600 capitalize">{appType}</span> application has been successfully submitted.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              The admin will review your application and notify you of updates. You cannot submit another application while this one is being processed.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left text-xs text-green-700 space-y-1">
              <p>✅ Application recorded</p>
              <p>✅ Documents uploaded</p>
              <p>✅ Admin notified</p>
              <p>⏳ Awaiting admin review</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { handleReset(); navigate("/applicant/dashboard") }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm transition"
              >
                🏠 Go to Dashboard
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition"
              >
                📋 New Application
              </button>
            </div>
          </div>
        </div>
      )}
    </ApplicantLayout>
  )
}