import { useState, useRef } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import ApplicantLayout from "../../components/ApplicantLayout"

export default function Apply() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    type: "", franchise_owner: "", address: "", date_of_birth: "",
    place_of_birth: "", civil_status: "", nationality: "Filipino",
    email: "", contact_number: "", old_owner: "", status: "",
    franchise_number: "", franchise_expiration: "", remarks: "",
    make: "", color: "", motor_no: "", chassis_no: "", plate_no: "", classification: "",
  })

  const [files, setFiles] = useState({
    or_cr: null, barangay_clearance: null, cedula: null, photo: null,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // ✅ Refs for scrolling to invalid fields
  const refs = {
    type: useRef(null),
    franchise_owner: useRef(null),
    address: useRef(null),
    date_of_birth: useRef(null),
    civil_status: useRef(null),
    contact_number: useRef(null),
    make: useRef(null),
    color: useRef(null),
    motor_no: useRef(null),
    chassis_no: useRef(null),
    plate_no: useRef(null),
    or_cr: useRef(null),
    barangay_clearance: useRef(null),
    cedula: useRef(null),
  }

  const scrollToField = (refKey) => {
    refs[refKey]?.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] })

  const uploadFile = async (file, path) => {
    if (!file) return null
    const { error: uploadError } = await supabase.storage
      .from("franchise-documents")
      .upload(path, file, { upsert: true })
    if (uploadError) return null
    const { data: urlData } = supabase.storage.from("franchise-documents").getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleReset = () => {
    setFormData({
      type: "", franchise_owner: "", address: "", date_of_birth: "",
      place_of_birth: "", civil_status: "", nationality: "Filipino",
      email: "", contact_number: "", old_owner: "", status: "",
      franchise_number: "", franchise_expiration: "", remarks: "",
      make: "", color: "", motor_no: "", chassis_no: "", plate_no: "", classification: "",
    })
    setFiles({ or_cr: null, barangay_clearance: null, cedula: null, photo: null })
    setError("")
    setSuccess(false)
  }

  const validateForm = () => {
    if (!formData.type) {
      setError("⚠️ Please select an Application Type (Registration or Renewal).")
      scrollToField("type")
      return false
    }
    if (!formData.franchise_owner.trim()) {
      setError("⚠️ Franchise Owner name is required.")
      scrollToField("franchise_owner")
      return false
    }
    if (!formData.address.trim()) {
      setError("⚠️ Address is required.")
      scrollToField("address")
      return false
    }
    if (!formData.date_of_birth) {
      setError("⚠️ Date of Birth is required.")
      scrollToField("date_of_birth")
      return false
    }
    if (!formData.civil_status) {
      setError("⚠️ Civil Status is required.")
      scrollToField("civil_status")
      return false
    }
    if (!formData.contact_number.trim()) {
      setError("⚠️ Contact Number is required.")
      scrollToField("contact_number")
      return false
    }
    if (!formData.make.trim()) {
      setError("⚠️ Motorcycle Make is required.")
      scrollToField("make")
      return false
    }
    if (!formData.color.trim()) {
      setError("⚠️ Motorcycle Color is required.")
      scrollToField("color")
      return false
    }
    if (!formData.motor_no.trim()) {
      setError("⚠️ Motor Number is required.")
      scrollToField("motor_no")
      return false
    }
    if (!formData.chassis_no.trim()) {
      setError("⚠️ Chassis Number is required.")
      scrollToField("chassis_no")
      return false
    }
    if (!formData.plate_no.trim()) {
      setError("⚠️ Plate Number is required.")
      scrollToField("plate_no")
      return false
    }
    if (!files.or_cr) {
      setError("⚠️ OR/CR document is required.")
      scrollToField("or_cr")
      return false
    }
    if (!files.barangay_clearance) {
      setError("⚠️ Barangay Clearance is required.")
      scrollToField("barangay_clearance")
      return false
    }
    if (!files.cedula) {
      setError("⚠️ Cedula is required.")
      scrollToField("cedula")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (!validateForm()) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const orCrUrl = await uploadFile(files.or_cr, `${user.id}/or_cr_${Date.now()}`)
      const barangayUrl = await uploadFile(files.barangay_clearance, `${user.id}/barangay_${Date.now()}`)
      const cedulaUrl = await uploadFile(files.cedula, `${user.id}/cedula_${Date.now()}`)
      const photoUrl = await uploadFile(files.photo, `${user.id}/photo_${Date.now()}`)

      const { error: appError } = await supabase.from("applications").insert({
        applicant_id: user.id,
        type: formData.type,
        status: "pending",
        details: {
          ...formData,
          documents: {
            or_cr: orCrUrl,
            barangay_clearance: barangayUrl,
            cedula: cedulaUrl,
            photo: photoUrl,
          }
        },
      })
      if (appError) throw appError

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: formData.type === "registration" ? "New Application Submitted" : "Franchise Renewal Submitted",
        message: `${formData.franchise_owner} submitted a ${formData.type} application.`,
        is_read: false,
        created_at: new Date()
      })

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      setError("❌ " + err.message)
      setLoading(false)
    }
  }

  const inputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
      hasError ? "border-red-400 bg-red-50" : "border-gray-300"
    }`

  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <ApplicantLayout backLabel="Back to Dashboard" backPath="/applicant/dashboard">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 border-t-4 border-orange-500">

          <h1 className="text-xl font-bold text-center text-blue-900 uppercase mb-1">
            Application for Tricycle Franchise
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            Municipality of San Jose, Occidental Mindoro
          </p>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-600 p-4 rounded-lg mb-6 text-sm flex items-start gap-2 animate-pulse">
              <span className="flex-shrink-0 mt-0.5 text-lg">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Application Type */}
            <div ref={refs.type}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Application Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {["registration", "renewal"].map((type) => (
                  <label
                    key={type}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition ${
                      formData.type === type
                        ? "border-orange-500 bg-orange-50"
                        : error.includes("Application Type") && !formData.type
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <p className="font-semibold text-blue-900 capitalize">{type}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {type === "registration" ? "New franchise application" : "Renew existing franchise"}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-orange-200 uppercase tracking-wide">
                👤 Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Franchise Owner + Photo */}
                <div className="md:col-span-2 flex gap-4 items-start">
                  <div className="flex-1" ref={refs.franchise_owner}>
                    <label className={labelClass}>Franchise Owner <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="franchise_owner"
                      value={formData.franchise_owner}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className={inputClass(error.includes("Franchise Owner") && !formData.franchise_owner)}
                    />
                  </div>
                  <div className="text-center">
                    <label className={labelClass}>Photo</label>
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 transition">
                      {files.photo ? (
                        <img src={URL.createObjectURL(files.photo)} alt="preview" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-3xl text-gray-300">📷</span>
                      )}
                      <input type="file" name="photo" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Address */}
                <div ref={refs.address}>
                  <label className={labelClass}>Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Barangay, San Jose, Occ. Mindoro"
                    className={inputClass(error.includes("Address") && !formData.address)}
                  />
                </div>

                {/* Date of Birth */}
                <div ref={refs.date_of_birth}>
                  <label className={labelClass}>Date of Birth <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className={inputClass(error.includes("Date of Birth") && !formData.date_of_birth)}
                  />
                </div>

                {/* Place of Birth */}
                <div>
                  <label className={labelClass}>Place of Birth</label>
                  <input type="text" name="place_of_birth" value={formData.place_of_birth} onChange={handleChange} placeholder="City/Municipality" className={inputClass(false)} />
                </div>

                {/* Civil Status */}
                <div ref={refs.civil_status}>
                  <label className={labelClass}>Civil Status <span className="text-red-500">*</span></label>
                  <select
                    name="civil_status"
                    value={formData.civil_status}
                    onChange={handleChange}
                    className={inputClass(error.includes("Civil Status") && !formData.civil_status)}
                  >
                    <option value="">-- Select --</option>
                    <option>Single</option>
                    <option>Married</option>
                    <option>Widowed</option>
                    <option>Separated</option>
                  </select>
                </div>

                {/* Nationality */}
                <div>
                  <label className={labelClass}>Nationality</label>
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className={inputClass(false)} />
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className={inputClass(false)} />
                </div>

                {/* Contact Number */}
                <div ref={refs.contact_number}>
                  <label className={labelClass}>Contact Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="09XXXXXXXXX"
                    className={inputClass(error.includes("Contact Number") && !formData.contact_number)}
                  />
                </div>

                {/* Old Owner */}
                <div>
                  <label className={labelClass}>Old Owner</label>
                  <input type="text" name="old_owner" value={formData.old_owner} onChange={handleChange} placeholder="If transferred" className={inputClass(false)} />
                </div>

                {/* Status */}
                <div>
                  <label className={labelClass}>Status</label>
                  <input type="text" name="status" value={formData.status} onChange={handleChange} placeholder="e.g. Active" className={inputClass(false)} />
                </div>

                {/* Franchise Number */}
                <div>
                  <label className={labelClass}>Franchise Number</label>
                  <input type="text" name="franchise_number" value={formData.franchise_number} onChange={handleChange} placeholder="For renewal only" className={inputClass(false)} />
                </div>

                {/* Franchise Expiration */}
                <div>
                  <label className={labelClass}>Franchise Expiration</label>
                  <input type="date" name="franchise_expiration" value={formData.franchise_expiration} onChange={handleChange} className={inputClass(false)} />
                </div>

              </div>
            </div>

            {/* Motorcycle Information */}
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-orange-200 uppercase tracking-wide">
                🏍️ Motorcycle Information
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { name: "make", label: "Make", required: true },
                  { name: "color", label: "Color", required: true },
                  { name: "motor_no", label: "Motor No.", required: true },
                  { name: "chassis_no", label: "Chassis No.", required: true },
                  { name: "plate_no", label: "Plate No.", required: true },
                  { name: "classification", label: "Classification", required: false },
                ].map((field) => (
                  <div key={field.name} ref={refs[field.name] || null}>
                    <label className={labelClass}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={field.label}
                      className={inputClass(
                        field.required &&
                        error.toLowerCase().includes(field.label.toLowerCase()) &&
                        !formData[field.name]
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Document Uploads */}
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-orange-200 uppercase tracking-wide">
                📎 Document Uploads
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "or_cr", label: "OR/CR" },
                  { name: "barangay_clearance", label: "Barangay Clearance" },
                  { name: "cedula", label: "Cedula" },
                ].map((doc) => (
                  <div key={doc.name} ref={refs[doc.name]}>
                    <label className={labelClass}>
                      {doc.label} <span className="text-red-500">*</span>
                    </label>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      files[doc.name]
                        ? "border-orange-400 bg-orange-50"
                        : error.includes(doc.label) && !files[doc.name]
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 hover:border-orange-400"
                    }`}>
                      <span className="text-2xl">{files[doc.name] ? "✅" : "📄"}</span>
                      <span className="text-xs text-gray-500 mt-1 text-center px-2">
                        {files[doc.name] ? files[doc.name].name : "Click to browse"}
                      </span>
                      <input
                        type="file"
                        name={doc.name}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className={labelClass}>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Additional notes or remarks..."
                rows={3}
                className={inputClass(false)}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition duration-200"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition duration-200"
              >
                Reset Form
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Success Modal */}
      {success && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md border-t-4 border-green-500 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-500 text-sm mb-2">
              Your <span className="font-semibold text-orange-600 capitalize">{formData.type}</span> application has been successfully submitted.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              The admin will review your application and notify you of any updates. Please wait for further instructions.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-left text-xs text-green-700 space-y-1">
              <p>✅ Application recorded</p>
              <p>✅ Documents uploaded</p>
              <p>✅ Admin notified</p>
              <p>⏳ Awaiting admin review</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { handleReset(); navigate("/applicant/dashboard") }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm transition"
              >
                🏠 Go to Dashboard
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold text-sm transition"
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