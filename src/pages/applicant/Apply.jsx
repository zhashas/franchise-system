import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import ApplicantLayout from "../../components/ApplicantLayout"

export default function Apply() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    type: "",
    franchise_owner: "",
    address: "",
    date_of_birth: "",
    place_of_birth: "",
    civil_status: "",
    nationality: "Filipino",
    email: "",
    contact_number: "",
    old_owner: "",
    status: "",
    franchise_number: "",
    franchise_expiration: "",
    remarks: "",
    make: "",
    color: "",
    motor_no: "",
    chassis_no: "",
    plate_no: "",
    classification: "",
  })

  const [files, setFiles] = useState({
    or_cr: null,
    barangay_clearance: null,
    cedula: null,
    photo: null,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Input handlers
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleFileChange = (e) => setFiles({ ...files, [e.target.name]: e.target.files[0] })

  // File upload helper
  const uploadFile = async (file, path) => {
    if (!file) return null
    const { error: uploadError } = await supabase.storage
      .from("franchise-documents")
      .upload(path, file, { upsert: true })
    if (uploadError) return null
    const { data: urlData } = supabase.storage.from("franchise-documents").getPublicUrl(path)
    return urlData.publicUrl
  }

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Upload files
      const orCrUrl = await uploadFile(files.or_cr, `${user.id}/or_cr_${Date.now()}`)
      const barangayUrl = await uploadFile(files.barangay_clearance, `${user.id}/barangay_${Date.now()}`)
      const cedulaUrl = await uploadFile(files.cedula, `${user.id}/cedula_${Date.now()}`)
      const photoUrl = await uploadFile(files.photo, `${user.id}/photo_${Date.now()}`)

      // Insert application
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

      // Notify admin
      const notifTitle = formData.type === "registration"
        ? "New Application Submitted"
        : "Franchise Renewal Submitted"

      const notifMessage = `${formData.franchise_owner} submitted a ${formData.type} application.`

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: notifTitle,
        message: notifMessage,
        is_read: false,
        created_at: new Date()
      })

      setSuccess(true)
      setLoading(false)

      setTimeout(() => {
        handleReset()
        navigate("/applicant/dashboard")
      }, 2000)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      type: "",
      franchise_owner: "",
      address: "",
      date_of_birth: "",
      place_of_birth: "",
      civil_status: "",
      nationality: "Filipino",
      email: "",
      contact_number: "",
      old_owner: "",
      status: "",
      franchise_number: "",
      franchise_expiration: "",
      remarks: "",
      make: "",
      color: "",
      motor_no: "",
      chassis_no: "",
      plate_no: "",
      classification: "",
    })
    setFiles({
      or_cr: null,
      barangay_clearance: null,
      cedula: null,
      photo: null,
    })
    setError("")
    setSuccess(false)
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 text-sm font-medium">
              ✅ Application submitted successfully! Redirecting to dashboard...
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Application Type */}
            <div>
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
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      onChange={handleChange}
                      className="hidden"
                      required
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
                {/* Franchise Owner and Photo */}
                <div className="md:col-span-2 flex gap-4 items-start">
                  <div className="flex-1">
                    <label className={labelClass}>Franchise Owner <span className="text-red-500">*</span></label>
                    <input type="text" name="franchise_owner" value={formData.franchise_owner} onChange={handleChange} placeholder="Full Name" className={inputClass} required />
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

                {/* Remaining personal inputs */}
                {["address","date_of_birth","place_of_birth","civil_status","nationality","email","contact_number","old_owner","status","franchise_number","franchise_expiration"].map(field => (
                  <div key={field}>
                    <label className={labelClass}>{field.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())} {["address","date_of_birth","civil_status","contact_number"].includes(field) && <span className="text-red-500">*</span>}</label>
                    {field === "civil_status" ? (
                      <select name={field} value={formData[field]} onChange={handleChange} className={inputClass} required={field==="civil_status"}>
                        <option value="">-- Select --</option>
                        <option>Single</option>
                        <option>Married</option>
                        <option>Widowed</option>
                        <option>Separated</option>
                      </select>
                    ) : field==="date_of_birth"||field==="franchise_expiration" ? (
                      <input type="date" name={field} value={formData[field]} onChange={handleChange} className={inputClass} required={field==="date_of_birth"} />
                    ) : (
                      <input type="text" name={field} value={formData[field]} onChange={handleChange} placeholder={field.replace("_"," ")} className={inputClass} required={["address","date_of_birth","civil_status","contact_number"].includes(field)} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Motorcycle Info */}
            <div>
              <h2 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-orange-200 uppercase tracking-wide">
                🏍️ Motorcycle Information
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["make","color","motor_no","chassis_no","plate_no","classification"].map(field => (
                  <div key={field}>
                    <label className={labelClass}>{field.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())} {["make","color","motor_no","chassis_no","plate_no"].includes(field) && <span className="text-red-500">*</span>}</label>
                    <input type="text" name={field} value={formData[field]} onChange={handleChange} placeholder={field.replace("_"," ")} className={inputClass} required={["make","color","motor_no","chassis_no","plate_no"].includes(field)} />
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
                {["or_cr","barangay_clearance","cedula"].map(doc => (
                  <div key={doc}>
                    <label className={labelClass}>{doc.replace("_"," ").toUpperCase()} <span className="text-red-500">*</span></label>
                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition ${files[doc] ? "border-orange-400 bg-orange-50" : "border-gray-300 hover:border-orange-400"}`}>
                      <span className="text-2xl">{files[doc] ? "✅" : "📄"}</span>
                      <span className="text-xs text-gray-500 mt-1 text-center px-2">{files[doc] ? files[doc].name : "Click to browse"}</span>
                      <input type="file" name={doc} accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" required />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className={labelClass}>Remarks</label>
              <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Additional notes or remarks..." rows={3} className={inputClass} />
            </div>

            {/* Submit & Reset */}
            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition duration-200">
                {loading ? "Submitting..." : "Submit Application"}
              </button>
              <button type="button" onClick={handleReset} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition duration-200">
                Reset Form
              </button>
            </div>

          </form>
        </div>
      </div>
    </ApplicantLayout>
  )
}