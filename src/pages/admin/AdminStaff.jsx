import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"
import { Users, UserPlus, Pencil, Trash2, ShieldCheck, Search, X, CheckCircle, AlertCircle } from "lucide-react"

/* ── helpers ─────────────────────────────────────────────────────── */
const Avatar = ({ name }) => {
  const initials = (name || "?")
    .split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")
  const colors = [
    "bg-orange-500", "bg-blue-500", "bg-green-500",
    "bg-purple-500", "bg-pink-500", "bg-teal-500",
  ]
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all
      ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}

/* ── main component ──────────────────────────────────────────────── */
export default function AdminStaff() {
  const [staff,        setStaff]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState("")
  const [toast,        setToast]        = useState(null)

  // Add Staff modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTab,       setAddTab]       = useState("promote") // "promote" | "create"
  const [promoteEmail, setPromoteEmail] = useState("")
  const [promoting,    setPromoting]    = useState(false)
  const [newStaff,     setNewStaff]     = useState({ full_name: "", email: "", phone: "", password: "" })
  const [creating,     setCreating]     = useState(false)

  // Edit modal state
  const [editTarget,   setEditTarget]   = useState(null)
  const [editForm,     setEditForm]     = useState({ full_name: "", phone: "" })
  const [saving,       setSaving]       = useState(false)

  // Remove modal state
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing,     setRemoving]     = useState(false)

  /* ── fetch ──────────────────────────────────────────────────────── */
  const fetchStaff = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "staff")
      .order("full_name", { ascending: true })
    setStaff(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchStaff() }, [])

  const showToast = (msg, type = "success") => setToast({ msg, type })

  /* ── promote existing user ───────────────────────────────────────── */
  const handlePromote = async (e) => {
    e.preventDefault()
    setPromoting(true)
    try {
      const email = promoteEmail.trim().toLowerCase()
      const { data: found } = await supabase
        .from("profiles").select("*").eq("email", email).single()

      if (!found) {
        showToast("No account found with that email.", "error")
        setPromoting(false)
        return
      }
      if (found.role === "staff") {
        showToast("This user is already a staff member.", "error")
        setPromoting(false)
        return
      }
      if (found.role === "admin") {
        showToast("Cannot demote an admin account.", "error")
        setPromoting(false)
        return
      }

      await supabase.from("profiles").update({ role: "staff" }).eq("id", found.id)
      setPromoteEmail("")
      setShowAddModal(false)
      showToast(`${found.full_name} has been promoted to Staff.`)
      fetchStaff()
    } catch {
      showToast("Something went wrong. Try again.", "error")
    } finally {
      setPromoting(false)
    }
  }

  /* ── create new staff account ────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault()
    if (newStaff.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error"); return
    }
    setCreating(true)
    try {
      // Save current admin session
      const { data: { session: adminSession } } = await supabase.auth.getSession()

      // Sign up new staff user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newStaff.email,
        password: newStaff.password,
      })

      if (signUpError) throw signUpError
      if (!signUpData?.user) throw new Error("Sign-up failed.")

      // Insert profile with staff role
      const { error: profileError } = await supabase.from("profiles").upsert({
        id:        signUpData.user.id,
        full_name: newStaff.full_name,
        email:     newStaff.email,
        phone:     newStaff.phone,
        role:      "staff",
      })
      if (profileError) throw profileError

      // Re-authenticate admin
      if (adminSession) {
        await supabase.auth.setSession({
          access_token:  adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        })
      }

      setNewStaff({ full_name: "", email: "", phone: "", password: "" })
      setShowAddModal(false)
      showToast(`Staff account for ${newStaff.full_name} created successfully!`)
      fetchStaff()
    } catch (err) {
      showToast(err.message || "Failed to create staff account.", "error")
    } finally {
      setCreating(false)
    }
  }

  /* ── edit ────────────────────────────────────────────────────────── */
  const openEdit = (member) => {
    setEditTarget(member)
    setEditForm({ full_name: member.full_name || "", phone: member.phone || "" })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editForm.full_name, phone: editForm.phone })
      .eq("id", editTarget.id)
    setSaving(false)
    if (error) { showToast("Failed to update staff info.", "error"); return }
    showToast("Staff info updated successfully.")
    setEditTarget(null)
    fetchStaff()
  }

  /* ── remove (demote to applicant) ────────────────────────────────── */
  const handleRemove = async () => {
    setRemoving(true)
    const { error } = await supabase
      .from("profiles")
      .update({ role: "applicant" })
      .eq("id", removeTarget.id)
    setRemoving(false)
    if (error) { showToast("Failed to remove staff member.", "error"); return }
    showToast(`${removeTarget.full_name} has been removed from staff.`)
    setRemoveTarget(null)
    fetchStaff()
  }

  /* ── filter ──────────────────────────────────────────────────────── */
  const filtered = staff.filter(s =>
    (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email     || "").toLowerCase().includes(search.toLowerCase())
  )

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-xl p-6 border bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2.5 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">STAFF MANAGEMENT</h1>
                <p className="text-sm text-gray-600 mt-0.5">Manage franchise division staff accounts and permissions.</p>
              </div>
            </div>
            <button
              onClick={() => { setShowAddModal(true); setAddTab("promote") }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow"
            >
              <UserPlus size={16} /> Add Staff
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Staff",   value: staff.length,                                                bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
            { label: "With Email",    value: staff.filter(s => s.email).length,                          bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
            { label: "With Phone",    value: staff.filter(s => s.phone).length,                          bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
            { label: "Active Roles",  value: staff.filter(s => s.role === "staff").length,               bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className={`text-xs mt-0.5 font-medium ${s.text}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH + LIST */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Loading staff…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-3xl mb-2">👤</p>
              <p className="text-gray-400 text-sm">{search ? "No staff match your search." : "No staff members yet."}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((member, idx) => (
                <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                  <span className="text-xs text-gray-300 w-5 text-right">{idx + 1}</span>
                  <Avatar name={member.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{member.full_name || "—"}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-gray-500 truncate">📧 {member.email || "—"}</span>
                      {member.phone && <span className="text-xs text-gray-500">📞 {member.phone}</span>}
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <ShieldCheck size={11} /> Staff
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(member)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setRemoveTarget(member)}
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
        </div>
      </div>

      {/* ── ADD STAFF MODAL ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-orange-500">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-orange-500" />
                <h2 className="font-bold text-gray-800">Add Staff Member</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {[
                { id: "promote", label: "Promote Existing User" },
                { id: "create",  label: "Create New Account"    },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAddTab(tab.id)}
                  className={`flex-1 py-3 text-xs font-semibold transition ${
                    addTab === tab.id
                      ? "border-b-2 border-orange-500 text-orange-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="px-6 py-5">
              {/* PROMOTE TAB */}
              {addTab === "promote" && (
                <form onSubmit={handlePromote} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                    <p className="font-semibold mb-1">ℹ️ How this works</p>
                    <p>Enter the email of an existing registered user. Their role will be upgraded from <strong>Applicant → Staff</strong>, granting them access to the Staff portal.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">User Email Address</label>
                    <input
                      type="email"
                      value={promoteEmail}
                      onChange={e => setPromoteEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={promoting}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                  >
                    {promoting ? "Promoting…" : "Promote to Staff"}
                  </button>
                </form>
              )}

              {/* CREATE TAB */}
              {addTab === "create" && (
                <form onSubmit={handleCreate} className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                    <p className="font-semibold mb-1">⚠️ Note</p>
                    <p>A new account will be created and assigned the Staff role. Provide the staff member with their credentials to log in.</p>
                  </div>
                  {[
                    { label: "Full Name",  name: "full_name", type: "text",     placeholder: "Juan Dela Cruz"   },
                    { label: "Email",      name: "email",     type: "email",    placeholder: "staff@sanjose.gov" },
                    { label: "Phone",      name: "phone",     type: "tel",      placeholder: "09XXXXXXXXX"       },
                    { label: "Password",   name: "password",  type: "password", placeholder: "Min. 6 characters"  },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.type}
                        value={newStaff[field.name]}
                        onChange={e => setNewStaff(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition mt-1"
                  >
                    {creating ? "Creating Account…" : "Create Staff Account"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-blue-500">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
              <div className="flex items-center gap-2">
                <Pencil size={16} className="text-blue-500" />
                <h2 className="font-bold text-gray-800">Edit Staff Info</h2>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <Avatar name={editTarget.full_name} />
                <div>
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
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="09XXXXXXXXX"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition"
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

      {/* ── REMOVE MODAL ─────────────────────────────────────────── */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border-t-4 border-red-500">
            <div className="px-6 py-6 text-center">
              <p className="text-4xl mb-3">🚫</p>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Remove Staff Member?</h2>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">{removeTarget.full_name}</span> will lose staff access.
              </p>
              <p className="text-xs text-gray-400 mb-5">
                Their account will be downgraded to <strong>Applicant</strong>. This can be undone by re-promoting them.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  {removing ? "Removing…" : "Yes, Remove"}
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

      {/* ── TOAST ────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

    </AdminLayout>
  )
}