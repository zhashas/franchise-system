import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabaseClient"
import ApplicantLayout from "../../components/ApplicantLayout"

export default function FranchiseRenewal() {
  const [profile, setProfile] = useState(null)
  const [lastApplication, setLastApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [files, setFiles] = useState({ or_cr: null, barangay_clearance: null })
  const [formData, setFormData] = useState({
    address: "",
    contact_number: "",
    remarks: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single()
      setProfile(profileData)

      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .eq("applicant_id", user.id)
        .eq("type", "registration")
        .eq("status", "approved")
        .order("submitted_at", { ascending: false })
        .limit(1)
      setLastApplication(apps?.[0] || null)
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] })
  }

  const uploadFile = async (file, path) => {
    if (!file) return null
    const { error } = await supabase.storage.from("franchise-documents").upload(path, file, { upsert: true })
    if (error) return null
    const { data: urlData } = supabase.storage.from("franchise-documents").getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const { data: { user } } = await supabase.auth.getUser()

    const orCrUrl = await uploadFile(files.or_cr, `${user.id}/renewal_or_cr_${Date.now()}`)
    const barangayUrl = await uploadFile(files.barangay_clearance, `${user.id}/renewal_barangay_${Date.now()}`)

    const { error } = await supabase.from("applications").insert({
      applicant_id: user.id,
      type: "renewal",
      status: "pending",
      details: {
        franchise_owner: profile?.full_name,
        franchise_number: lastApplication?.details?.franchise_number || "—",
        address: formData.address,
        contact_number: formData.contact_number,
        remarks: formData.remarks,
        plate_no: lastApplication?.details?.plate_no,
        make: lastApplication?.details?.make,
        documents: {
          or_cr: orCrUrl,
          barangay_clearance: barangayUrl,
        }
      },
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  const statusSteps = [
    { label: "Submitted", done: true },
    { label: "For Verification", done: lastApplication?.status === "under_review" || lastApplication?.status === "approved" },
    { label: "Approved", done: lastApplication?.status === "approved" },
  ]

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-semibold">Loading...</div>

  return (
    <ApplicantLayout>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-t-4 border-orange-500">
          <h1 className="text-xl font-bold text-blue-900 uppercase">🔄 Franchise Renewal</h1>
          <p className="text-gray-500 text-sm mt-1">Renew your existing tricycle franchise by updating your details and uploading required documents.</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 font-medium text-sm">
            ✅ Renewal application submitted successfully! The admin will review your request.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {!lastApplication && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-xl mb-6 text-sm">
            ⚠️ You don't have an approved registration yet. Please submit a registration application first before renewing.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left — Renewal Form */}
          <div className="md:col-span-2 space-y-6">

            {/* Renewal Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b">📋 Renewal Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Franchise Number", value: lastApplication?.details?.franchise_number || "—" },
                  { label: "Status", value: lastApplication?.status || "—" },
                  { label: "Operator Name", value: profile?.full_name || "—" },
                  { label: "Expiration Date", value: lastApplication?.details?.franchise_expiration || "—" },
                  { label: "Plate No.", value: lastApplication?.details?.plate_no || "—" },
                  { label: "Vehicle Make", value: lastApplication?.details?.make || "—" },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="font-semibold text-blue-900 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Renewal Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b">📝 Renewal Form</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Current address"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleChange}
                      placeholder="09XXXXXXXXX"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      required
                    />
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "or_cr", label: "Updated OR/CR" },
                    { name: "barangay_clearance", label: "Barangay Clearance" },
                  ].map((doc) => (
                    <div key={doc.name}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {doc.label} <span className="text-red-500">*</span>
                      </label>
                      <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition ${
                        files[doc.name] ? "border-orange-400 bg-orange-50" : "border-gray-300 hover:border-orange-400"
                      }`}>
                        <span className="text-xl">{files[doc.name] ? "✅" : "📄"}</span>
                        <span className="text-xs text-gray-500 mt-1 text-center px-2">
                          {files[doc.name] ? files[doc.name].name : "Click to browse"}
                        </span>
                        <input
                          type="file"
                          name={doc.name}
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                      </label>
                    </div>
                  ))}
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !lastApplication || success}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition"
                >
                  {submitting ? "Submitting..." : success ? "Submitted ✅" : "Submit Renewal Application"}
                </button>
              </form>
            </div>
          </div>

          {/* Right — Application Status */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b">📊 Application Status</h2>
              <div className="space-y-4">
                {statusSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      step.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm font-medium ${step.done ? "text-green-700" : "text-gray-400"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks Box */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">💬 Remarks</h2>
              <p className="text-xs text-gray-400 italic">
                {lastApplication?.admin_remarks || "No remarks from admin yet."}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs text-orange-700 font-semibold mb-1">📌 Reminder</p>
              <p className="text-xs text-orange-600">
                Make sure all uploaded documents are clear and valid. Incomplete submissions may cause delays in processing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ApplicantLayout>
  )
}