import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"
import {
  UserPlus, Users, Search, X, CheckCircle, AlertCircle,
  Pencil, Trash2, ShieldCheck, Eye, EyeOff, RefreshCw
} from "lucide-react"

/* ── Avatar ──────────────────────────────────────────────────────────────── */
const Avatar = ({ name }) => {
  const initials = (name || "?")
    .split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")
  const colors = [
    "bg-sky-500", "bg-emerald-500", "bg-violet-500",
    "bg-rose-500", "bg-amber-500", "bg-teal-500",
  ]
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

/* ── Toast ───────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold
      ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}

/* ── Status badge ────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    pending:  { bg: "bg-yellow-100",  text: "text-yellow-700",  label: "Pending"   },
    approved: { bg: "bg-green-100",   text: "text-green-700",   label: "Approved"  },
    rejected: { bg: "bg-red-100",     text: "text-red-700",     label: "Rejected"  },
    active:   { bg: "bg-blue-100",    text: "text-blue-700",    label: "Active"    },
  }
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status || "—" }
  return (
    <span className={`inline-flex items-center gap-1 ${s.bg} ${s.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>
      {s.label}
    </span>
  )
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function AdminAddApplicant() {
  const [applicants,    setApplicants]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState("")
  const [toast,         setToast]         = useState(null)
  const [activeTab,     setActiveTab]     = useState("list")   // "list" | "create"
  const [showPassword,  setShowPassword]  = useState(false)

  // Create form
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", address: "", password: "",
  })
  const [creating, setCreating] = useState(false)

  // Edit modal
  const [editTarget, setEditTarget]  = useState(null)
  const [editForm,   setEditForm]    = useState({ full_name: "", phone: "", address: "" })
  const [saving,     setSaving]      = useState(false)

  // Remove modal
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing,     setRemoving]     = useState(false)

  /* ── fetch ─────────────────────────────────────────────────────────────── */
  const fetchApplicants = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "applicant")
      .order("full_name", { ascending: true })
    setApplicants(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchApplicants() }, [])

  const showToast = (msg, type = "success") => setToast({ msg, type })

  /* ── create ────────────────────────────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error"); return
    }
    setCreating(true)
    try {
      // Save current admin session
      const { data: { session: adminSession } } = await supabase.auth.getSession()

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
      })
      if (signUpError) throw signUpError
      if (!signUpData?.user) throw new Error("Sign-up failed.")

      const { error: profileError } = await supabase.from("profiles").upsert({
        id:        signUpData.user.id,
        full_name: form.full_name,
        email:     form.email,
        phone:     form.phone,
        address:   form.address,
        role:      "applicant",
      })
      if (profileError) throw profileError

      // Restore admin session
      if (adminSession) {
        await supabase.auth.setSession({
          access_token:  adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      const name = form.full_name
      setForm({ full_name: "", email: "", phone: "", address: "", password: "" })
      setActiveTab("list")
      showToast(`Applicant account for ${name} created!`)
      fetchApplicants()
    } catch (err) {
      showToast(err.message || "Failed to create applicant account.", "error")
    } finally {
      setCreating(false)
    }
  }

  /* ── edit ──────────────────────────────────────────────────────────────── */
  const openEdit = (a) => {
    setEditTarget(a)
    setEditForm({ full_name: a.full_name || "", phone: a.phone || "", address: a.address || "" })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editForm.full_name, phone: editForm.phone, address: editForm.address })
      .eq("id", editTarget.id)
    setSaving(false)
    if (error) { showToast("Failed to update applicant.", "error"); return }
    showToast("Applicant info updated.")
    setEditTarget(null)
    fetchApplicants()
  }

  /* ── remove ────────────────────────────────────────────────────────────── */
  const handleRemove = async () => {
    setRemoving(true)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", removeTarget.id)
    setRemoving(false)
    if (error) { showToast("Failed to delete applicant.", "error"); return }
    showToast(`${removeTarget.full_name}'s account has been removed.`)
    setRemoveTarget(null)
    fetchApplicants()
  }

  /* ── filter ────────────────────────────────────────────────────────────── */
  const filtered = applicants.filter(a =>
    (a.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.email     || "").toLowerCase().includes(search.toLowerCase()) ||
    (a.phone     || "").toLowerCase().includes(search.toLowerCase())
  )

  /* ── render ────────────────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-xl p-6 border bg-sky-50 border-sky-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500 p-2.5 rounded-xl">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">APPLICANT MANAGEMENT</h1>
                <p className="text-sm text-gray-600 mt-0.5">Create and manage tricycle franchise applicant accounts.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("list")}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow ${
                  activeTab === "list"
                    ? "bg-sky-500 text-white"
                    : "bg-white text-sky-600 border border-sky-300 hover:bg-sky-50"
                }`}
              >
                <Users size={15} /> View All
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow ${
                  activeTab === "create"
                    ? "bg-sky-500 text-white"
                    : "bg-white text-sky-600 border border-sky-300 hover:bg-sky-50"
                }`}
              >
                <UserPlus size={15} /> Create Account
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Applicants", value: applicants.length,                          bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700"    },
            { label: "With Phone",       value: applicants.filter(a => a.phone).length,     bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
            { label: "With Address",     value: applicants.filter(a => a.address).length,   bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
            { label: "Registered Today", value: applicants.filter(a => {
                const d = new Date(a.created_at)
                const n = new Date()
                return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
              }).length,                                                                       bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className={`text-xs mt-0.5 font-medium ${s.text}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── CREATE ACCOUNT TAB ─────────────────────────────────────────── */}
        {activeTab === "create" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="bg-sky-500 p-2 rounded-lg">
                <UserPlus size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-sm">Create New Applicant Account</h2>
                <p className="text-xs text-gray-500 mt-0.5">Fill in the details below to register a new franchise applicant.</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="px-6 py-6 space-y-5">
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                <p className="font-semibold mb-1">ℹ️ About Applicant Accounts</p>
                <p>A new user account will be created with the <strong>Applicant</strong> role. They can then log in and submit franchise applications through the portal. Provide them with their login credentials.</p>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Juan Dela Cruz"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="applicant@email.com"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="09XXXXXXXXX"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min. 6 characters"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.password && form.password.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters.</p>
                  )}
                </div>
              </div>

              {/* Address — full width */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Home Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Barangay, San Jose, Occidental Mindoro"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Creating Account…
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Create Applicant Account
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ full_name: "", email: "", phone: "", address: "", password: "" })}
                  className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── LIST TAB ──────────────────────────────────────────────────── */}
        {activeTab === "list" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Search bar */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name, email, or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none placeholder-gray-400"
              />
              {search
                ? <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                : <button onClick={fetchApplicants} className="text-gray-400 hover:text-sky-500 transition"><RefreshCw size={14} /></button>
              }
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">Loading applicants…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl mb-2">🧍</p>
                <p className="text-gray-400 text-sm">{search ? "No applicants match your search." : "No applicants registered yet."}</p>
                {!search && (
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-3 text-sky-500 hover:underline text-sm font-semibold"
                  >
                    + Create the first one
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((applicant, idx) => (
                  <div key={applicant.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                    <span className="text-xs text-gray-300 w-5 text-right">{idx + 1}</span>
                    <Avatar name={applicant.full_name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{applicant.full_name || "—"}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-gray-500 truncate">📧 {applicant.email || "—"}</span>
                        {applicant.phone   && <span className="text-xs text-gray-500">📞 {applicant.phone}</span>}
                        {applicant.address && <span className="text-xs text-gray-400 truncate">📍 {applicant.address}</span>}
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1 bg-sky-100 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <ShieldCheck size={11} /> Applicant
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(applicant)}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setRemoveTarget(applicant)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
                Showing {filtered.length} of {applicants.length} applicants
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ──────────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-sky-500">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Pencil size={16} className="text-sky-500" />
                <h2 className="font-bold text-gray-800">Edit Applicant Info</h2>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <Avatar name={editTarget.full_name} />
                <div>
                  <p className="text-xs font-semibold text-gray-700">{editTarget.full_name}</p>
                  <p className="text-xs text-gray-500">{editTarget.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="09XXXXXXXXX"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Barangay, San Jose, Occidental Mindoro"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REMOVE MODAL ────────────────────────────────────────────────── */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-red-500">
            <div className="px-6 py-6 text-center">
              <p className="text-4xl mb-3">🗑️</p>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Delete Applicant?</h2>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">{removeTarget.full_name}</span>'s account will be permanently deleted.
              </p>
              <p className="text-xs text-red-400 mb-5">
                ⚠️ This action cannot be undone. All associated data will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  {removing ? "Deleting…" : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setRemoveTarget(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}