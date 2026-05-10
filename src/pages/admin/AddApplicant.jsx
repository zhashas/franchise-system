// pages/admin/AddApplicant.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import AdminLayout from "../../components/AdminLayout";
import {
  UserPlus,
  Users,
  X,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronRight,
  UserCheck,
} from "lucide-react";

/* ── Avatar ──────────────────────────────────────────────────────────────── */
const Avatar = ({ name }) => {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const colors = [
    "bg-sky-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-amber-500",
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

/* ── Toast ───────────────────────────────────────────────────────────────── */
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold animate-in slide-in-from-bottom-4
      ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
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

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function AdminAddApplicant() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("list"); // "list" | "create"
  const [showPassword, setShowPassword] = useState(false);

  // Create form
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  // Remove modal
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  /* ── fetch ─────────────────────────────────────────────────────────────── */
  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "applicant")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setApplicants(data || []);
    } catch (err) {
      console.error("[AddApplicant] Fetch error:", err);
      showToast("Failed to load applicants.", "error");
    } finally {
      setLoading(false);
    }
  }, []); // No external dependencies — safe empty array

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* ── create ────────────────────────────────────────────────────────────── */
  const handleCreate = async (e) => {
    e.preventDefault();

    // Validation
    if (form.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    if (!form.full_name.trim()) {
      showToast("Full name is required.", "error");
      return;
    }

    if (!form.email.trim()) {
      showToast("Email is required.", "error");
      return;
    }

    setCreating(true);

    try {
      // Step 1: Verify admin session exists
      const {
        data: { session: adminSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !adminSession) {
        throw new Error("Admin session not found. Please log in again.");
      }

      // Step 2: Create user via Admin API (bypasses email confirmation)
      console.log("[AddApplicant] Creating user with admin client...");
      const { data: newUserData, error: signUpError } =
        await supabaseAdmin.auth.admin.createUser({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            role: "applicant",
          },
        });

      if (signUpError) {
        console.error("[AddApplicant] Signup error:", signUpError);
        throw signUpError;
      }

      if (!newUserData?.user) {
        throw new Error("User creation returned no user data.");
      }

      const newUserId = newUserData.user.id;
      console.log("[AddApplicant] User created with ID:", newUserId);

      // Step 3: Ensure profile exists in profiles table
      // (The trigger should handle this, but we verify/upsert to be safe)
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: newUserId,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          role: "applicant",
        },
        { onConflict: "id" },
      );

      if (upsertError) {
        console.error("[AddApplicant] Profile upsert error:", upsertError);
        throw upsertError;
      }

      // Step 4: Restore admin session (important!)
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });

      // Success cleanup
      const name = form.full_name.trim();
      setForm({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
      });
      setActiveTab("list");
      showToast(`✓ Applicant account for ${name} created successfully!`);

      // Refresh the list
      await fetchApplicants();
    } catch (err) {
      console.error("[AddApplicant] Creation error:", err);

      // Attempt to restore admin session even on error
      try {
        const {
          data: { session: adminSession },
        } = await supabase.auth.getSession();
        if (adminSession) {
          await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          });
        }
      } catch (restoreErr) {
        console.error("[AddApplicant] Session restore failed:", restoreErr);
      }

      // User-friendly error messages
      let errorMsg = "Failed to create applicant account.";

      if (
        err.message?.includes("already registered") ||
        err.message?.includes("User already registered") ||
        err.message?.includes("duplicate key")
      ) {
        errorMsg = "This email is already registered.";
      } else if (err.message?.includes("invalid email")) {
        errorMsg = "Invalid email format.";
      } else if (err.message?.includes("Password")) {
        errorMsg = err.message;
      } else if (err.message?.includes("session")) {
        errorMsg = "Admin session expired. Please refresh and try again.";
      } else if (err.message) {
        errorMsg = err.message;
      }

      showToast(errorMsg, "error");
    } finally {
      setCreating(false);
    }
  };

  /* ── edit ──────────────────────────────────────────────────────────────── */
  const openEdit = (a) => {
    setEditTarget(a);
    setEditForm({
      full_name: a.full_name || "",
      phone: a.phone || "",
      address: a.address || "",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editForm.full_name.trim()) {
      showToast("Full name cannot be empty.", "error");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name.trim(),
          phone: editForm.phone.trim(),
          address: editForm.address.trim(),
        })
        .eq("id", editTarget.id);

      if (error) throw error;

      showToast("✓ Applicant information updated successfully.");
      setEditTarget(null);
      await fetchApplicants();
    } catch (err) {
      console.error("[AddApplicant] Edit error:", err);
      showToast("Failed to update applicant.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── remove ────────────────────────────────────────────────────────────── */
  const handleRemove = async () => {
    setRemoving(true);
    try {
      // Delete from profiles (cascade will handle auth.users via RLS)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", removeTarget.id);

      if (error) throw error;

      showToast(`✓ ${removeTarget.full_name}'s account has been removed.`);
      setRemoveTarget(null);
      await fetchApplicants();
    } catch (err) {
      console.error("[AddApplicant] Delete error:", err);
      showToast("Failed to delete applicant.", "error");
    } finally {
      setRemoving(false);
    }
  };

  /* ── filter ────────────────────────────────────────────────────────────── */
  const filtered = applicants.filter(
    (a) =>
      (a.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(search.toLowerCase()),
  );

  /* ── render ────────────────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              <span className="text-gray-900">APPLICANT</span>
              <span className="text-sky-500"> REGISTRY.</span>
            </h1>
            <div className="mt-1 h-0.5 w-52 bg-gradient-to-r from-sky-500 to-transparent rounded-full" />
            <p className="text-sm text-gray-400 font-medium mt-2 tracking-wide">
              Registered applicant accounts and access management.
            </p>
          </div>
          <button
            onClick={() =>
              setActiveTab(activeTab === "create" ? "list" : "create")
            }
            className={`flex items-center gap-2 font-black text-sm px-5 py-3 rounded-xl transition-all whitespace-nowrap border-2 ${
              activeTab === "create"
                ? "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
            }`}
          >
            <UserPlus size={15} />
            <span>
              {activeTab === "create"
                ? "Back to Registry"
                : "Register Applicant"}
            </span>
            {activeTab !== "create" && <ChevronRight size={15} />}
          </button>
        </div>

        {/* ── CREATE FORM PANEL ── */}
        {activeTab === "create" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Form header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-black text-gray-900">
                  Register New Applicant
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  The new account will be assigned the{" "}
                  <strong>Applicant</strong> role and auto-confirmed.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center">
                  <UserPlus size={16} className="text-sky-600" />
                </div>
                <button
                  onClick={() => {
                    setActiveTab("list");
                    setForm({
                      full_name: "",
                      email: "",
                      phone: "",
                      address: "",
                      password: "",
                    });
                  }}
                  className="text-gray-300 hover:text-gray-500 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Form body */}
            <form
              onSubmit={handleCreate}
              className="px-6 py-5 flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    label: "Full Name",
                    name: "full_name",
                    type: "text",
                    placeholder: "Juan Dela Cruz",
                    required: true,
                  },
                  {
                    label: "Email",
                    name: "email",
                    type: "email",
                    placeholder: "applicant@example.com",
                    required: true,
                  },
                  {
                    label: "Phone",
                    name: "phone",
                    type: "tel",
                    placeholder: "09XXXXXXXXX",
                    required: false,
                  },
                  {
                    label: "Address",
                    name: "address",
                    type: "text",
                    placeholder: "Barangay, San Jose, Occ. Mindoro",
                    required: false,
                  },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                      {field.label}
                      {field.required && (
                        <span className="text-red-400 ml-0.5">*</span>
                      )}
                    </label>
                    <input
                      type={field.type}
                      value={form[field.name]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [field.name]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 transition"
                    />
                  </div>
                ))}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Min. 6 characters"
                    required
                    minLength={6}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 pr-10 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-gray-50 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Account will be auto-confirmed and ready for immediate login.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm py-3 rounded-xl transition shadow"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      Creating Account…
                    </span>
                  ) : (
                    "Create Applicant Account"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("list");
                    setForm({
                      full_name: "",
                      email: "",
                      phone: "",
                      address: "",
                      password: "",
                    });
                  }}
                  disabled={creating}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 font-bold text-sm py-3 rounded-xl border border-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── REGISTRY PANEL ── */}
        {activeTab === "list" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[320px] flex flex-col">
            {/* Controls bar */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-gray-300 text-lg flex-shrink-0">⌕</span>
                <input
                  type="text"
                  placeholder="Search applicants by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent min-w-0"
                />
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="text-[11px] font-bold text-gray-400 hover:text-gray-600 bg-gray-100 px-2 py-1 rounded-lg transition flex-shrink-0"
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    onClick={fetchApplicants}
                    className="text-gray-400 hover:text-sky-500 transition flex-shrink-0"
                    title="Refresh"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap flex-shrink-0">
                Registered Applicants:{" "}
                <span className="text-gray-700">{filtered.length}</span>
              </span>
            </div>

            {/* Body */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                  Syncing Registry…
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                <Users size={40} className="text-gray-200" />
                <p className="text-base font-black text-gray-600">
                  No Applicants Found
                </p>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  {search
                    ? `No results for "${search}"`
                    : "No applicants registered yet."}
                </p>
                {!search && (
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-1 text-sky-500 hover:text-sky-600 text-sm font-black uppercase tracking-wider transition"
                  >
                    + Register the first one
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {[
                        "#",
                        "Applicant",
                        "Contact",
                        "Address",
                        "Role",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((applicant, idx) => (
                      <tr
                        key={applicant.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        {/* # */}
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-300 font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        </td>

                        {/* Applicant */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={applicant.full_name} />
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {applicant.full_name || "—"}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
                                {applicant.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <p className="text-xs text-gray-500 font-mono">
                            {applicant.phone || (
                              <span className="text-gray-300">—</span>
                            )}
                          </p>
                        </td>

                        {/* Address */}
                        <td className="px-5 py-4">
                          <p
                            className="text-xs text-gray-400 max-w-[160px] truncate"
                            title={applicant.address}
                          >
                            {applicant.address || (
                              <span className="text-gray-300">—</span>
                            )}
                          </p>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <ShieldCheck size={10} /> Applicant
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEdit(applicant)}
                              className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition uppercase tracking-wide"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setRemoveTarget(applicant)}
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
            {!loading && applicants.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-gray-400">
                  Applicants can submit{" "}
                  <strong className="text-gray-600">
                    franchise applications
                  </strong>{" "}
                  once registered.
                </span>
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                  {filtered.length} / {applicants.length} records shown
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── PROTOCOL BANNER (dark) ── */}
        {activeTab === "list" && (
          <div className="bg-gray-900 rounded-2xl px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserCheck size={18} className="text-sky-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">
                  Registry Protocol
                </p>
                <p className="text-sm text-gray-300 leading-relaxed max-w-lg">
                  Registered applicants can access the franchise application
                  portal to submit new registrations and renewals. All account
                  actions are logged and visible in the Activity Logs.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("create")}
              className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-black text-xs px-5 py-3 rounded-xl transition uppercase tracking-wider whitespace-nowrap shadow"
            >
              Open Registration Panel
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════ */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-black text-gray-900">
                  Edit Applicant
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update applicant account information.
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
                  required: true,
                },
                {
                  label: "Phone",
                  key: "phone",
                  type: "tel",
                  placeholder: "09XXXXXXXXX",
                  required: false,
                },
                {
                  label: "Address",
                  key: "address",
                  type: "text",
                  placeholder: "Barangay, San Jose, Occ. Mindoro",
                  required: false,
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                    {field.label}
                    {field.required && (
                      <span className="text-red-400 ml-0.5">*</span>
                    )}
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
                    required={field.required}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm py-3 rounded-xl transition shadow"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  disabled={saving}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 font-bold text-sm py-3 rounded-xl border border-gray-200 transition"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-base font-black text-gray-900 mb-1">
                Delete Applicant?
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-bold text-gray-700">
                  {removeTarget.full_name}
                </span>
                's account will be permanently deleted.
              </p>
              <p className="text-xs text-red-400 mb-6">
                ⚠️ This action cannot be undone. All associated data will be
                lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm py-3 rounded-xl transition"
                >
                  {removing ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      Deleting…
                    </span>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
                <button
                  onClick={() => setRemoveTarget(null)}
                  disabled={removing}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 font-bold text-sm py-3 rounded-xl border border-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
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
