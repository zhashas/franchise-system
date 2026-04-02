import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"

export default function AdminDashboard() {
  const [profile, setProfile] = useState(null)
  const [franchises, setFranchises] = useState([])

  const emptyForm = {
    franchise_number: "",
    plate_number: "",
    owner_name: "",
    date_issued: "",
    expiration_date: "",
    status: "available",
  }

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single()

      const { data: fr } = await supabase
        .from("franchises").select("*")
        .order("created_at", { ascending: false })

      setProfile(profileData)
      setFranchises(fr || [])
    })()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from("profiles").select("*").eq("id", user.id).single()
    setProfile(profileData)

    const { data: fr } = await supabase
      .from("franchises").select("*")
      .order("created_at", { ascending: false })
    setFranchises(fr || [])
  }

  // ========================
  // FRONT-END VALIDATION
  // ========================
  const validate = () => {
    const plateRegex = /^[A-Z]{2,3}-[0-9]{3,4}$/

    if (!form.franchise_number.trim()) {
      alert("Franchise number is required.")
      return false
    }
    if (!form.plate_number.trim()) {
      alert("Plate number is required.")
      return false
    }
    if (!plateRegex.test(form.plate_number.trim())) {
      alert("Invalid plate number format.\nExpected format: ABC-1234 or AB-123")
      return false
    }
    if (!form.owner_name.trim()) {
      alert("Owner name is required.")
      return false
    }
    if (!form.date_issued) {
      alert("Date issued is required.")
      return false
    }
    if (!form.expiration_date) {
      alert("Expiration date is required.")
      return false
    }
    if (new Date(form.expiration_date) <= new Date(form.date_issued)) {
      alert("Expiration date must be after the date issued.")
      return false
    }
    return true
  }

  // ========================
  // FRIENDLY DB ERROR PARSER
  // ========================
  const parseDbError = (error) => {
    if (!error) return "An unknown error occurred."

    if (error.code === "23505") {
      if (error.message.includes("unique_franchise_number"))
        return "This franchise number already exists. Please use a different one."
      if (error.message.includes("unique_plate_number"))
        return "This plate number is already registered. Please check and try again."
      return "A duplicate entry was detected. Please check your inputs."
    }

    if (error.code === "23514") {
      if (error.message.includes("valid_plate_format"))
        return "Invalid plate number format. Use format: ABC-1234 or AB-123"
      if (error.message.includes("valid_date_range"))
        return "Expiration date must be after the date issued."
      return "One of the values you entered is not valid."
    }

    if (error.code === "42501") {
      return "Permission denied. You may not have access to perform this action."
    }

    return error.message || "Something went wrong. Please try again."
  }

  // ========================
  // SUBMIT (CREATE / UPDATE)
  // ========================
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      franchise_number: form.franchise_number.trim().toUpperCase(),
      plate_number: form.plate_number.trim().toUpperCase(),
      owner_name: form.owner_name.trim(),
      date_issued: form.date_issued,
      expiration_date: form.expiration_date,
      status: form.status,
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("franchises")
          .update(payload)
          .eq("id", editingId)

        if (error) {
          console.error("Update error:", error)
          alert(parseDbError(error))
          return
        }
      } else {
        const { error } = await supabase
          .from("franchises")
          .insert([payload])

        if (error) {
          console.error("Insert error:", error)
          alert(parseDbError(error))
          return
        }
      }

      await fetchData()
      setForm(emptyForm)
      setEditingId(null)

    } catch (err) {
      console.error("Submit error:", err)
      alert("Unexpected error. Please try again.")
    }
  }

  // ========================
  // EDIT
  // ========================
  const handleEdit = (f) => {
    setForm({
      franchise_number: f.franchise_number || "",
      plate_number: f.plate_number || "",
      owner_name: f.owner_name || "",
      date_issued: f.date_issued || "",
      expiration_date: f.expiration_date || "",
      status: f.status || "available",
    })
    setEditingId(f.id)
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  }

  // ========================
  // DELETE
  // ========================
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this franchise record?")) return
    const { error } = await supabase.from("franchises").delete().eq("id", id)
    if (error) {
      alert("Failed to delete: " + error.message)
      return
    }
    await fetchData()
  }

 const statusStyles = {
  active: {
    badge: "bg-green-100 text-green-700 border border-green-300",
    dot: "bg-green-500",
  },
  expired: {
    badge: "bg-red-100 text-red-700 border border-red-300",
    dot: "bg-red-500",
  },
  available: {
    badge: "bg-gray-100 text-gray-600 border border-gray-300",
    dot: "bg-gray-400",
  },
}

const stats = [
  {
    label: "Total Franchise Records",
    value: franchises.length,
    icon: "🏢",
    color: "bg-orange-50 border border-orange-200",
    textColor: "text-orange-600",
  },
  {
    label: "Active Franchises",
    value: franchises.filter(f => f.status === "active").length,
    icon: "✅",
    color: "bg-green-50 border border-green-200",
    textColor: "text-green-600",
  },
  {
    label: "Expired Franchises",
    value: franchises.filter(f => f.status === "expired").length,
    icon: "⛔",
    color: "bg-red-50 border border-red-200",
    textColor: "text-red-600",
  },
  {
    label: "Available Franchises",
    value: franchises.filter(f => f.status === "available").length,
    icon: "🟡",
    color: "bg-yellow-50 border border-yellow-200",
    textColor: "text-yellow-600",
  },
]
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded p-6 border bg-orange-100">
          <h1 className="text-xl font-bold">DASHBOARD</h1>
          <p className="text-sm mt-1">Welcome back, {profile?.full_name}.</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className={`p-4 rounded-lg shadow-sm ${s.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{s.icon}</span>
                <span className={`text-3xl font-bold ${s.textColor}`}>{s.value}</span>
              </div>
              <p className="text-xs font-medium text-gray-600 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid md:grid-cols-2 gap-5">
          <button
            onClick={() => navigate("/admin/applications")}
            className="p-5 bg-green-100 hover:bg-green-200 border border-green-300 rounded-md font-bold text-black shadow-sm transition">
            APPLICATIONS
          </button>
          <button
            onClick={() => navigate("/admin/appointments")}
            className="p-5 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-md font-bold text-black shadow-sm transition">
            APPOINTMENTS
          </button>
        </div>

        {/* FRANCHISE MANAGEMENT */}
        <div className="border rounded-xl bg-white p-5 shadow-sm flex flex-col max-h-[600px]">

          <div className="flex items-center gap-2 border-b pb-3">
            <span className="text-lg">🏢</span>
            <h2 className="font-bold text-base text-gray-800">
              Tricycle Franchise Management
            </h2>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">

              {/* Franchise Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Franchise Number <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="e.g. TRIC-001"
                  value={form.franchise_number}
                  onChange={e => setForm({ ...form, franchise_number: e.target.value.toUpperCase() })}
                  className="border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>

              {/* Plate Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Plate Number <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="e.g. ABC-1234"
                  value={form.plate_number}
                  onChange={e => setForm({ ...form, plate_number: e.target.value.toUpperCase() })}
                  className="border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
                <p className="text-xs text-gray-400">Format: ABC-1234 or AB-123</p>
              </div>

              {/* Owner Name */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="e.g. Juan Dela Cruz"
                  value={form.owner_name}
                  onChange={e => setForm({ ...form, owner_name: e.target.value })}
                  className="border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>

              {/* Date Issued */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Date Issued <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date_issued}
                  onChange={e => setForm({ ...form, date_issued: e.target.value })}
                  className="border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>

              {/* Expiration Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Expiration Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.expiration_date}
                  min={form.date_issued || undefined}
                  onChange={e => setForm({ ...form, expiration_date: e.target.value })}
                  className="border border-gray-300 p-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  required
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="border border-gray-300 p-2 rounded text-sm"
                >
                  <option value="available">🟡 Available</option>
                  <option value="active">✅ Active</option>
                  <option value="expired">⛔ Expired</option>
                </select>
              </div>

            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded text-sm">
                {editingId ? "✏️ Update Franchise" : "➕ Add Franchise"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setForm(emptyForm) }}
                  className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded text-sm">
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* LIST */}
          <div className="space-y-2 overflow-y-auto pr-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Franchise Records ({franchises.length})
            </p>

            {franchises.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6 border rounded-lg">
                No franchise records yet. Add one above.
              </p>
            )}

            {franchises.map(f => {
              const style = statusStyles[f.status] || statusStyles.available
              return (
                <div
                  key={f.id}
                  className="flex justify-between items-center border border-gray-200 p-3 rounded-lg bg-gray-50 hover:bg-white transition"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-gray-800">
                      {f.franchise_number}
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        🚗 {f.plate_number || "No plate"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      👤 {f.owner_name || "No owner assigned"}
                    </p>
                    {(f.date_issued || f.expiration_date) && (
                      <p className="text-xs text-gray-400">
                        📅 {f.date_issued || "—"} → {f.expiration_date || "—"}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${style.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </span>
                    <button
                      onClick={() => handleEdit(f)}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded">
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}