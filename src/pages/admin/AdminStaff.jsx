import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  ShieldCheck,
  X,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Shield,
} from "lucide-react";

/* ── Avatar ──────────────────────────────────────────────────────── */
const Avatar = ({ name }) => {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const colors = [
    "bg-orange-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
};

/* ── Toast ───────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
    >
      {type === "success" ? (
        <CheckCircle size={16} />
      ) : (
        <AlertCircle size={16} />
      )}
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
};

/* ── COMPONENT ───────────────────────────────────────────────────── */
export default function AdminStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addTab, setAddTab] = useState("promote");
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [newStaff, setNewStaff] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  /* ── fetch ───────────────────────────────────────────────────── */
  const fetchStaff = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "staff")
      .order("full_name", { ascending: true });
    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* ── promote ─────────────────────────────────────────────────── */
  const handlePromote = async (e) => {
    e.preventDefault();
    setPromoting(true);
    try {
      const email = promoteEmail.trim().toLowerCase();
      const { data: found } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();
      if (!found) {
        showToast("No account found with that email.", "error");
        return;
      }
      if (found.role === "staff") {
        showToast("This user is already a staff member.", "error");
        return;
      }
      if (found.role === "admin") {
        showToast("Cannot demote an admin account.", "error");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ role: "staff" })
        .eq("id", found.id);
      if (error) throw error;
      setPromoteEmail("");
      setShowAddModal(false);
      showToast(`${found.full_name} has been promoted to Staff.`);
      fetchStaff();
    } catch {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setPromoting(false);
    }
  };

  /* ── create ──────────────────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (newStaff.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    setCreating(true);
    try {
      const {
        data: { session: adminSession },
      } = await supabase.auth.getSession();
      if (!adminSession)
        throw new Error(
          "Admin session not found. Please refresh and try again.",
        );
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: newStaff.email.trim().toLowerCase(),
          password: newStaff.password,
        });
      if (signUpError) throw signUpError;
      if (!signUpData?.user) throw new Error("Sign-up returned no user.");
      const newUserId = signUpData.user.id;
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: newUserId,
          full_name: newStaff.full_name.trim(),
          email: newStaff.email.trim().toLowerCase(),
          phone: newStaff.phone.trim(),
          role: "staff",
        },
        { onConflict: "id" },
      );
      if (upsertError) throw upsertError;
      const { error: roleError } = await supabase
        .from("profiles")
        .update({ role: "staff" })
        .eq("id", newUserId);
      if (roleError)
        console.warn("[AdminStaff] role update warning:", roleError.message);
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
      const createdName = newStaff.full_name.trim();
      setNewStaff({ full_name: "", email: "", phone: "", password: "" });
      setShowAddModal(false);
      showToast(`Staff account for ${createdName} created successfully!`);
      fetchStaff();
    } catch (err) {
      try {
        const {
          data: { session: adminSession },
        } = await supabase.auth.getSession();
        if (!adminSession) await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      showToast(err.message || "Failed to create staff account.", "error");
    } finally {
      setCreating(false);
    }
  };

  /* ── edit / remove ───────────────────────────────────────────── */
  const openEdit = (member) => {
    setEditTarget(member);
    setEditForm({
      full_name: member.full_name || "",
      phone: member.phone || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editForm.full_name, phone: editForm.phone })
      .eq("id", editTarget.id);
    setSaving(false);
    if (error) {
      showToast("Failed to update staff info.", "error");
      return;
    }
    showToast("Staff info updated successfully.");
    setEditTarget(null);
    fetchStaff();
  };

  const handleRemove = async () => {
    setRemoving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: "applicant" })
      .eq("id", removeTarget.id);
    setRemoving(false);
    if (error) {
      showToast("Failed to remove staff member.", "error");
      return;
    }
    showToast(`${removeTarget.full_name} has been removed from staff.`);
    setRemoveTarget(null);
    fetchStaff();
  };

  const filtered = staff.filter(
    (s) =>
      (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  const openRecruitment = () => {
    setAddTab("promote");
    setShowAddModal(true);
  };

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              <span className="text-gray-900 ">STAFF</span>
              <span className="text-purple-500 ">COMMAND.</span>
            </h1>
            <div className="mt-1 h-0.5 w-48 bg-gradient-to-r from-purple-500 to-transparent rounded-full" />
            <p className="text-sm text-gray-400 font-medium mt-2 tracking-wide">
              Personnel management and privilege escalation portal.
            </p>
          </div>
          <button
            onClick={openRecruitment}
            className="flex items-center gap-2 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-black text-sm px-5 py-3 rounded-xl transition-all whitespace-nowrap"
          >
            <UserPlus size={15} />
            <span>Enlist New Staff</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ── PERSONNEL PANEL ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[320px] flex flex-col">
          {/* Controls bar */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-gray-300 text-lg flex-shrink-0">⌕</span>
              <input
                type="text"
                placeholder="Search personnel by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent min-w-0"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-[11px] font-bold text-gray-400 hover:text-gray-600 bg-gray-100 px-2 py-1 rounded-lg transition flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap flex-shrink-0">
              Authorized Personnel:{" "}
              <span className="text-gray-700">{filtered.length}</span>
            </span>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                Syncing Personnel…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <Users size={40} className="text-gray-200" />
              <p className="text-base font-black text-gray-600">
                No Personnel Found
              </p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                {search
                  ? `No results for "${search}"`
                  : "No staff members enlisted yet. Use the recruitment panel to add personnel."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["#", "Personnel", "Contact", "Role", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((member, idx) => (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* # */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-300 font-mono">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </td>

                      {/* Personnel */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.full_name} />
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {member.full_name || "—"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
                              {member.email || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <p className="text-xs text-gray-500 font-mono">
                          {member.phone || (
                            <span className="text-gray-300">—</span>
                          )}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                          <ShieldCheck size={10} /> Staff
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(member)}
                            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition uppercase tracking-wide"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setRemoveTarget(member)}
                            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition uppercase tracking-wide"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && staff.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-400">
                All actions taken by staff are{" "}
                <strong className="text-gray-600">
                  logged and audit-ready
                </strong>
                .
              </span>
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                {filtered.length} / {staff.length} personnel shown
              </span>
            </div>
          )}
        </div>

        {/* ── PROTOCOL BANNER (dark) ── */}
        <div className="bg-gray-900 rounded-2xl px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                Protocol Header
              </p>
              <p className="text-sm text-gray-300 leading-relaxed max-w-lg">
                Elevate high-performing applicants to staff roles to handle the
                increasing volume of tricycle franchises. All actions taken by
                staff are logged and audit-ready.
              </p>
            </div>
          </div>
          <button
            onClick={openRecruitment}
            className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-black text-xs px-5 py-3 rounded-xl transition uppercase tracking-wider whitespace-nowrap shadow"
          >
            Open Recruitment Panel
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ADD STAFF MODAL
      ══════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-black text-gray-900">
                  Enlist New Staff
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Fill in the details to authorize personnel.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                  <UserPlus size={16} className="text-purple-600" />
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-300 hover:text-gray-500 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-50 border-b border-gray-100">
              {[
                { id: "promote", label: "Promote Existing" },
                { id: "create", label: "Create New Account" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAddTab(tab.id)}
                  className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider transition ${
                    addTab === tab.id
                      ? "border-b-2 border-purple-500 text-purple-600 bg-white"
                      : "text-gray-400 hover:text-gray-600"
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
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                    <p className="font-black mb-1 uppercase tracking-wide">
                      ℹ️ How this works
                    </p>
                    <p>
                      Enter the email of an existing registered user. Their role
                      will be upgraded from <strong>Applicant → Staff</strong>,
                      granting them access to the Staff portal.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                      User Email Address
                    </label>
                    <input
                      type="email"
                      value={promoteEmail}
                      onChange={(e) => setPromoteEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 bg-gray-50 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={promoting}
                    className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-black text-sm py-3 rounded-xl transition shadow"
                  >
                    {promoting ? "Promoting…" : "Promote to Staff"}
                  </button>
                </form>
              )}

              {/* CREATE TAB */}
              {addTab === "create" && (
                <form onSubmit={handleCreate} className="space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                    <p className="font-black mb-1 uppercase tracking-wide">
                      ⚠️ Note
                    </p>
                    <p>
                      A new account will be created and assigned the{" "}
                      <strong>Staff</strong> role. Provide the staff member with
                      their credentials to log in.
                    </p>
                  </div>
                  {[
                    {
                      label: "Full Name",
                      name: "full_name",
                      type: "text",
                      placeholder: "Juan Dela Cruz",
                    },
                    {
                      label: "Email",
                      name: "email",
                      type: "email",
                      placeholder: "staff@sanjose.gov",
                    },
                    {
                      label: "Phone",
                      name: "phone",
                      type: "tel",
                      placeholder: "09XXXXXXXXX",
                    },
                    {
                      label: "Password",
                      name: "password",
                      type: "password",
                      placeholder: "Min. 6 characters",
                    },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={newStaff[field.name]}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        required
                        className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 bg-gray-50 transition"
                      />
                    </div>
                  ))}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-black text-sm py-3 rounded-xl transition shadow"
                    >
                      {creating ? "Creating Account…" : "Create Staff Account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl border border-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════ */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-black text-gray-900">
                  Edit Personnel
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update staff member information.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Pencil size={15} className="text-blue-600" />
                </div>
                <button
                  onClick={() => setEditTarget(null)}
                  className="text-gray-300 hover:text-gray-500 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <form
              onSubmit={handleSaveEdit}
              className="px-6 py-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <Avatar name={editTarget.full_name} />
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {editTarget.full_name}
                  </p>
                  <p className="text-xs text-gray-400">{editTarget.email}</p>
                </div>
              </div>
              {[
                {
                  label: "Full Name",
                  key: "full_name",
                  type: "text",
                  placeholder: "Juan Dela Cruz",
                },
                {
                  label: "Phone",
                  key: "phone",
                  type: "tel",
                  placeholder: "09XXXXXXXXX",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={editForm[field.key]}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    required={field.key === "full_name"}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 bg-gray-50 transition"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-black text-sm py-3 rounded-xl transition shadow"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl border border-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          REMOVE MODAL
      ══════════════════════════════════════════ */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-base font-black text-gray-900 mb-1">
                Remove Personnel?
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-bold text-gray-700">
                  {removeTarget.full_name}
                </span>{" "}
                will lose staff access.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Their account will be downgraded to <strong>Applicant</strong>.
                This can be undone by re-enlisting them.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-black text-sm py-3 rounded-xl transition"
                >
                  {removing ? "Removing…" : "Yes, Remove"}
                </button>
                <button
                  onClick={() => setRemoveTarget(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl border border-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ─────────────────────────────── */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AdminLayout>
  );
}
