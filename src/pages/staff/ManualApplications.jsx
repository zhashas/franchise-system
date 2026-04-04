import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import StaffLayout from "../../components/StaffLayout"

// ─── REQUIREMENTS CHECKLIST (same as applicant form) ─────────────────────────
const REQUIREMENTS = [
  { key: "or_latest",         label: "Latest O.R. (Official Receipt) – LTO" },
  { key: "cr",                label: "Certificate of Registration (C.R.) – LTO" },
  { key: "cedula",            label: "Cedula (Updated)" },
  { key: "police_clearance",  label: "Police Clearance" },
  { key: "barangay_residency",label: "Barangay Residency (Updated)" },
  { key: "voters_cert",       label: "Voter's Certification – COMELEC" },
  { key: "stencil_motor",     label: "Stencil ng Motor (Engine / Chassis)" },
]
const TRICYCLE_CHECKS = [
  { key: "tricycle_condition", label: "Tricycle Condition (Overall)" },
  { key: "left_signal",        label: "Left Signal Light" },
  { key: "right_signal",       label: "Right Signal Light" },
  { key: "head_light",         label: "Head Light" },
  { key: "tail_light",         label: "Tail Light" },
  { key: "ilaw_sidecar",       label: "Ilaw sa Loob ng Sidecar" },
  { key: "basurahan_sidecar",  label: "Basurahan sa Loob ng Sidecar" },
]
const GARAGE_CHECKS = [
  { key: "garage_condition", label: "Garage Condition (Overall)" },
  { key: "garage_photo",     label: "Garage / Garahe (with vehicle)" },
]

// ─── helpers ──────────────────────────────────────────────────────────────────
const TOTAL_SLOTS = 5200

const todayStr = () => new Date().toISOString().split("T")[0]
const addYears = (str, n) => { const d = new Date(str); d.setFullYear(d.getFullYear() + n); return d.toISOString().split("T")[0] }

// Generate next available franchise number in SJ-XXXX format
const generateFranchiseNumber = (usedNumbers) => {
  const usedSet = new Set(usedNumbers.map(n => n.toUpperCase()))
  for (let i = 0; i <= TOTAL_SLOTS; i++) {
    const candidate = `SJ-${String(i).padStart(4, "0")}`
    if (!usedSet.has(candidate)) return candidate
  }
  return null // all slots used
}

const emptyForm = {
  // Personal
  application_type:     "new",
  franchise_owner:      "",
  control_number:       "",
  contact_number:       "",
  email:                "",
  address:              "",
  date_of_birth:        "",
  place_of_birth:       "",
  civil_status:         "",
  nationality:          "Filipino",
  // Renewal extras
  old_owner:            "",
  franchise_status:     "",
  franchise_number_old: "",
  franchise_expiration: "",
  // Motorcycle
  make:                 "",
  color:                "",
  motor_no:             "",
  chassis_no:           "",
  plate_no:             "",
  classification:       "",
  // Status
  remarks:              "",
}

const emptyChecklist = () => {
  const obj = {}
  ;[...REQUIREMENTS, ...TRICYCLE_CHECKS, ...GARAGE_CHECKS].forEach(r => { obj[r.key] = false })
  return obj
}

export default function StaffManualApplication() {
  const [form,              setForm]              = useState(emptyForm)
  const [checklist,         setChecklist]         = useState(emptyChecklist())
  const [generatedFrNum,    setGeneratedFrNum]    = useState("")
  const [applicants,        setApplicants]        = useState([])
  const [selectedApplicant, setSelectedApplicant] = useState("")
  const [submitting,        setSubmitting]        = useState(false)
  const [successMsg,        setSuccessMsg]        = useState("")
  const [errorMsg,          setErrorMsg]          = useState("")
  const [availableSlots,    setAvailableSlots]    = useState(TOTAL_SLOTS)
  const [,    setExistingFrNums]    = useState([])

  useEffect(() => { loadInitialData() }, [])

  const loadInitialData = async () => {
    const [{ data: profs }, { data: fr }] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "applicant").order("full_name"),
      supabase.from("franchises").select("franchise_number, status").order("franchise_number"),
    ])
    setApplicants(profs || [])

    const nums = (fr || []).filter(f => f.status === "active").map(f => f.franchise_number)
    setExistingFrNums(nums)

    const allNums    = (fr || []).map(f => f.franchise_number)
    const nextNum    = generateFranchiseNumber(allNums)
    setGeneratedFrNum(nextNum || "NO SLOTS AVAILABLE")

    const usedSlots  = (fr || []).filter(f => f.status === "active").length
    setAvailableSlots(TOTAL_SLOTS - usedSlots)
  }

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const toggleCheck = (key) => setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  const checkAll    = (keys, val) => setChecklist(prev => { const next = { ...prev }; keys.forEach(k => next[k] = val); return next })

  const allReqChecked      = REQUIREMENTS.every(r => checklist[r.key])
  const allTricycleChecked = TRICYCLE_CHECKS.every(r => checklist[r.key])
  const allGarageChecked   = GARAGE_CHECKS.every(r => checklist[r.key])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg(""); setSuccessMsg("")

    if (!selectedApplicant) { setErrorMsg("Please select an applicant."); return }
    if (!generatedFrNum || generatedFrNum === "NO SLOTS AVAILABLE") { setErrorMsg("No franchise slots available."); return }
    if (!allReqChecked) { setErrorMsg("All required documents must be verified (checked)."); return }

    setSubmitting(true)
    try {
      const approvedToday = todayStr()
      const expiry        = addYears(approvedToday, 3)
      const isRenewal     = form.application_type === "renewal"

      // 1 — Insert application as already-approved
      const details = {
        franchise_owner:     form.franchise_owner,
        control_number:      form.control_number,
        contact_number:      form.contact_number,
        email:               form.email,
        address:             form.address,
        date_of_birth:       form.date_of_birth,
        place_of_birth:      form.place_of_birth,
        civil_status:        form.civil_status,
        nationality:         form.nationality,
        make:                form.make,
        color:               form.color,
        motor_no:            form.motor_no,
        chassis_no:          form.chassis_no,
        plate_no:            form.plate_no,
        classification:      form.classification,
        remarks:             form.remarks,
        franchise_number:    isRenewal ? form.franchise_number_old : generatedFrNum,
        ...(isRenewal && {
          old_owner:            form.old_owner,
          franchise_status:     form.franchise_status,
          franchise_expiration: form.franchise_expiration,
        }),
        documents: {
          checklist_verified: true,
          ...Object.fromEntries(Object.entries(checklist).map(([k, v]) => [k, v ? "verified_by_staff" : null])),
        },
      }

      const { data: appErr } = await supabase
        .from("applications")
        .insert({
          applicant_id:  selectedApplicant,
          type:          isRenewal ? "renewal" : "new",
          status:        "approved",
          details,
          admin_remarks: "Manually processed by staff. All documents verified on-site.",
          created_at:    new Date().toISOString(),
        })
        .select()
        .single()

      if (appErr) throw appErr

      // 2 — Create / update franchise record
      const frPayload = {
        franchise_number: isRenewal ? (form.franchise_number_old?.toUpperCase() || generatedFrNum) : generatedFrNum,
        owner_name:       form.franchise_owner,
        plate_number:     (form.plate_no || "").toUpperCase(),
        date_issued:      approvedToday,
        expiration_date:  expiry,
        status:           "active",
        applicant_id:     selectedApplicant,
      }

      if (isRenewal && form.franchise_number_old) {
        const { error: updErr } = await supabase.from("franchises").update(frPayload).eq("franchise_number", form.franchise_number_old.toUpperCase())
        if (updErr) {
          await supabase.from("franchises").upsert([frPayload], { onConflict: "franchise_number" })
        }
      } else {
        await supabase.from("franchises").upsert([frPayload], { onConflict: "franchise_number" })
      }

      // 3 — Notify applicant
      await supabase.from("notifications").insert({
        recipient_id:      selectedApplicant,
        recipient_type:    "applicant",
        sender_type:       "staff",
        notification_type: "status_approved",
        title:             "✅ Franchise Application Approved",
        message:           `Your franchise application has been processed and approved on-site. Franchise No: ${frPayload.franchise_number}. Valid until ${expiry}.`,
        is_read:           false,
      })

      setSuccessMsg(`✅ Application submitted and approved! Franchise Number: ${frPayload.franchise_number} | Valid until: ${expiry}`)
      setForm(emptyForm)
      setChecklist(emptyChecklist())
      setSelectedApplicant("")
      loadInitialData()  // refresh available slot count
    } catch (err) {
      setErrorMsg("Submission failed: " + err.message)
    }
    setSubmitting(false)
  }

  const CheckItem = ({ item, checked }) => (
    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${checked ? "bg-green-50 border-green-300" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
      <input type="checkbox" checked={checked} onChange={() => toggleCheck(item.key)} className="w-4 h-4 accent-green-600" />
      <span className={`text-sm ${checked ? "text-green-700 font-medium line-through decoration-green-400" : "text-gray-700"}`}>{item.label}</span>
      {checked && <span className="ml-auto text-green-500 text-xs font-bold">✓ Verified</span>}
    </label>
  )

  const CheckGroup = ({ title, items, keys, allChecked }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</p>
        <button type="button" onClick={() => checkAll(keys, !allChecked)}
          className={`text-xs px-3 py-1 rounded-full font-semibold border transition ${allChecked ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"}`}>
          {allChecked ? "✓ All Verified" : "Check All"}
        </button>
      </div>
      {items.map(item => <CheckItem key={item.key} item={item} checked={checklist[item.key]} />)}
    </div>
  )

  return (
    <StaffLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-xl p-6 border bg-orange-50 border-orange-200">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">MANUAL APPLICATION</h1>
              <p className="text-sm text-gray-600 mt-1">Process walk-in applications. Staff verifies documents on-site using the checklist.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Available Franchise Slots</p>
              <p className="text-3xl font-bold text-orange-600">{availableSlots} <span className="text-sm text-gray-400">/ {TOTAL_SLOTS}</span></p>
            </div>
          </div>
        </div>

        {/* GENERATED FRANCHISE NUMBER */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Auto-Generated Franchise Number</p>
            <p className="text-2xl font-bold text-yellow-800 font-mono">{generatedFrNum || "Loading…"}</p>
            <p className="text-xs text-yellow-600 mt-0.5">Unique · Excludes all active franchise numbers · SJ-0000 to SJ-5200</p>
          </div>
          <span className="text-4xl">🏷️</span>
        </div>

        {successMsg && <div className="bg-green-50 border border-green-300 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">{successMsg}</div>}
        {errorMsg   && <div className="bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* SELECT APPLICANT */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-gray-700 border-b pb-2 flex items-center gap-2">👤 Applicant Selection</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Registered Applicant <span className="text-red-500">*</span></label>
              <select value={selectedApplicant} onChange={e => setSelectedApplicant(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="">-- Select registered applicant --</option>
                {applicants.map(a => <option key={a.id} value={a.id}>{a.full_name} — {a.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Application Type</label>
              <div className="flex gap-3">
                {["new", "renewal"].map(t => (
                  <label key={t} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition ${form.application_type === t ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="application_type" value={t} checked={form.application_type === t} onChange={() => setField("application_type", t)} className="accent-orange-500" />
                    <span className="text-sm font-medium capitalize">{t === "new" ? "📋 New Registration" : "🔄 Renewal"}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* PERSONAL INFORMATION */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-bold text-sm text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">👤 Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Full Name / Franchise Owner", key: "franchise_owner", required: true, col: 2 },
                { label: "Control Number",              key: "control_number" },
                { label: "Contact Number",              key: "contact_number", required: true },
                { label: "Email Address",               key: "email", type: "email" },
                { label: "Address",                     key: "address", required: true, col: 2 },
                { label: "Date of Birth",               key: "date_of_birth", type: "date" },
                { label: "Place of Birth",              key: "place_of_birth" },
                { label: "Civil Status",                key: "civil_status" },
                { label: "Nationality",                 key: "nationality" },
              ].map(f => (
                <div key={f.key} className={f.col === 2 ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                  <input type={f.type || "text"} value={form[f.key]} onChange={e => setField(f.key, e.target.value)} required={f.required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              ))}
            </div>

            {form.application_type === "renewal" && (
              <div className="mt-5 pt-4 border-t border-dashed border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 uppercase mb-3">🔄 Renewal Details</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: "Old Owner (if transferred)", key: "old_owner" },
                    { label: "Franchise Status",           key: "franchise_status" },
                    { label: "Existing Franchise Number",  key: "franchise_number_old", required: true },
                    { label: "Franchise Expiration",       key: "franchise_expiration", type: "date" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                      <input type={f.type || "text"} value={form[f.key]} onChange={e => setField(f.key, e.target.value.toUpperCase())} required={f.required}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MOTORCYCLE INFO */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-bold text-sm text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">🏍️ Motorcycle Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Make (Brand)",           key: "make",           required: true, col: 2 },
                { label: "Color",                  key: "color",          required: true },
                { label: "Motor / Engine Number",  key: "motor_no",       required: true },
                { label: "Chassis Number",         key: "chassis_no",     required: true },
                { label: "Plate Number",           key: "plate_no",       required: true },
                { label: "Classification",         key: "classification" },
              ].map(f => (
                <div key={f.key} className={f.col === 2 ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                  <input type="text" value={form[f.key]} onChange={e => setField(f.key, e.target.value.toUpperCase())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
              ))}
            </div>
          </div>

          {/* REQUIREMENTS CHECKLIST */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="font-bold text-sm text-gray-700 border-b pb-2 mb-4 flex items-center gap-2">
              ✅ Document Verification Checklist
              <span className="ml-auto text-xs font-normal text-gray-400">Check each item after physical verification</span>
            </h2>

            <div className="space-y-6">
              <CheckGroup
                title="📎 Official Documents"
                items={REQUIREMENTS}
                keys={REQUIREMENTS.map(r => r.key)}
                allChecked={allReqChecked}
              />
              <CheckGroup
                title="🔧 Tricycle Condition"
                items={TRICYCLE_CHECKS}
                keys={TRICYCLE_CHECKS.map(r => r.key)}
                allChecked={allTricycleChecked}
              />
              <CheckGroup
                title="🏠 Garage Condition"
                items={GARAGE_CHECKS}
                keys={GARAGE_CHECKS.map(r => r.key)}
                allChecked={allGarageChecked}
              />
            </div>

            {/* Progress */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {(() => {
                const total   = REQUIREMENTS.length + TRICYCLE_CHECKS.length + GARAGE_CHECKS.length
                const checked = Object.values(checklist).filter(Boolean).length
                const pct     = Math.round((checked / total) * 100)
                return (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Verification Progress</span>
                      <span>{checked}/{total} items</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-orange-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                    {!allReqChecked && <p className="text-xs text-red-500 mt-1">⚠️ All official documents must be verified to proceed.</p>}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* REMARKS */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">📝 Staff Remarks (optional)</label>
            <textarea value={form.remarks} onChange={e => setField("remarks", e.target.value)} rows={3} placeholder="Any notes about this application…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
          </div>

          {/* SUBMIT */}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting || !allReqChecked}
              className={`flex-1 font-bold text-sm py-3.5 rounded-xl transition shadow-sm ${allReqChecked && !submitting ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              {submitting ? "⏳ Submitting…" : `✅ Submit & Approve Application (${generatedFrNum})`}
            </button>
            <button type="button" onClick={() => { setForm(emptyForm); setChecklist(emptyChecklist()); setSelectedApplicant(""); setSuccessMsg(""); setErrorMsg("") }}
              className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition text-sm">
              Reset
            </button>
          </div>

        </form>
      </div>
    </StaffLayout>
  )
}