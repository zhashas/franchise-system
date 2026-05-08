import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";
import {
  Activity,
  Search,
  X,
  RefreshCw,
  Filter,
  Download,
  LogIn,
  LogOut,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  User,
  Trash2,
} from "lucide-react";

/* ── Constants ────────────────────────────────────────────────────────────── */
const ROLES = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "applicant", label: "Applicant" },
];

const ACTION_TYPES = [
  { value: "all", label: "All Events" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
];

const PAGE_SIZE = 20;

/* ── Action meta ──────────────────────────────────────────────────────────── */
const ACTION_META = {
  login: {
    icon: LogIn,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
  },
  logout: {
    icon: LogOut,
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
  },
};

const getActionMeta = (action) =>
  ACTION_META[action] || {
    icon: Activity,
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
  };

const getRoleBadge = (role) => {
  if (role === "admin")
    return "bg-orange-100 text-orange-700 border-orange-200";
  if (role === "staff")
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (role === "applicant") return "bg-sky-100 text-sky-700 border-sky-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
};

/* ── Formatters ───────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
const fmtRelative = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

/* ── Delete Confirm Modal ─────────────────────────────────────────────────── */
function DeleteConfirmModal({ count, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Delete Logs</p>
            <p className="text-xs text-gray-500 mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to permanently delete{" "}
            <span className="font-bold text-red-600">
              {count} {count === 1 ? "log" : "logs"}
            </span>
            ?
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Deleted logs cannot be recovered.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-60 flex items-center gap-2 shadow"
          >
            {deleting ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 size={12} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Log Row ──────────────────────────────────────────────────────────────── */
function LogRow({ log, expanded, onToggle, selected, onSelect, onDelete }) {
  const meta = getActionMeta(log.action);
  const Icon = meta.icon;
  const hasExtra =
    log.details || (log.metadata && Object.keys(log.metadata).length > 0);

  const actionLabel =
    log.action === "login"
      ? "Login"
      : log.action === "logout"
        ? "Logout"
        : log.action;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all mb-2 shadow-sm ${
        selected ? "border-red-300 ring-1 ring-red-200" : meta.border
      }`}
    >
      {/* Main row */}
      <div
        className={`flex items-center gap-3 px-4 py-3 ${selected ? "bg-red-50" : meta.bg}`}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 accent-red-500 cursor-pointer flex-shrink-0"
        />

        {/* Action icon — clicking expands details */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border ${meta.border} ${hasExtra ? "cursor-pointer" : ""}`}
          onClick={hasExtra ? onToggle : undefined}
        >
          <Icon size={15} className={meta.color} />
        </div>

        {/* User + action — clicking expands details */}
        <div
          className={`flex-1 min-w-0 ${hasExtra ? "cursor-pointer" : ""}`}
          onClick={hasExtra ? onToggle : undefined}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-800 truncate">
              {log.user_name || "—"}
            </p>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(log.role)}`}
            >
              {log.role || "—"}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}
            >
              {actionLabel}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
              <User size={10} className="text-gray-400" />
              {log.user_email || "—"}
            </p>
            {log.ip_address && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Globe size={10} />
                {log.ip_address}
              </p>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div
          className={`text-right flex-shrink-0 hidden sm:block ${hasExtra ? "cursor-pointer" : ""}`}
          onClick={hasExtra ? onToggle : undefined}
        >
          <p className="text-xs font-semibold text-gray-700">
            {fmtDate(log.created_at)}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
            <Clock size={10} /> {fmtTime(log.created_at)}
          </p>
          <p className="text-[10px] text-gray-300 mt-0.5">
            {fmtRelative(log.created_at)}
          </p>
        </div>

        {/* Expand chevron */}
        {hasExtra && (
          <div className="flex-shrink-0 ml-1 cursor-pointer" onClick={onToggle}>
            {expanded ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete this log"
          className="flex-shrink-0 ml-1 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Expanded details */}
      {expanded && hasExtra && (
        <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-3">
          {log.details && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                Details
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                {log.details}
              </p>
            </div>
          )}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                Metadata
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(log.metadata).map(([k, v]) => (
                  <div
                    key={k}
                    className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100"
                  >
                    <p className="text-[10px] text-gray-400 capitalize">
                      {k.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {String(v)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="sm:hidden text-xs text-gray-400">
            {fmtDate(log.created_at)} at {fmtTime(log.created_at)}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl mb-3">📋</p>
      <p className="text-gray-500 font-semibold text-sm">
        No login / logout logs found
      </p>
      {hasFilters ? (
        <>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting or clearing your filters.
          </p>
          <button
            onClick={onClear}
            className="mt-3 text-xs text-orange-500 hover:underline font-semibold"
          >
            ✕ Clear filters
          </button>
        </>
      ) : (
        <p className="text-xs text-gray-400 mt-1">
          Logs will appear here once users sign in or out.
          <br />
          Make sure{" "}
          <code className="bg-gray-100 px-1 rounded">logActivity()</code> is
          called in your login and logout handlers.
        </p>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    ids: [], // array of IDs to delete
    deleting: false,
    error: null,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const debounceRef = useRef(null);

  /* ── Filter handlers ── */
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 300);
  };
  const handleRoleChange = (v) => {
    setRoleFilter(v);
    setPage(0);
  };
  const handleActionChange = (v) => {
    setActionFilter(v);
    setPage(0);
  };
  const handleDateFrom = (v) => {
    setDateFrom(v);
    setPage(0);
  };
  const handleDateTo = (v) => {
    setDateTo(v);
    setPage(0);
  };
  const handleClearFilters = () => {
    setRoleFilter("all");
    setActionFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setDebouncedSearch("");
    setPage(0);
  };

  /* ── Selection helpers ── */
  const allOnPageSelected =
    logs.length > 0 && logs.every((l) => selectedIds.has(l.id));
  const someOnPageSelected =
    logs.some((l) => selectedIds.has(l.id)) && !allOnPageSelected;

  const handleSelectAll = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      logs.forEach((l) => (checked ? next.add(l.id) : next.delete(l.id)));
      return next;
    });
  };

  const handleSelectOne = (id, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  /* ── Open delete modal ── */
  const openDeleteModal = (ids) => {
    setDeleteModal({ open: true, ids, deleting: false, error: null });
  };

  /* ── Confirm delete ── */
  const handleConfirmDelete = async () => {
    const { ids } = deleteModal;
    setDeleteModal((prev) => ({ ...prev, deleting: true, error: null }));

    const { error } = await supabase
      .from("activity_logs")
      .delete()
      .in("id", ids);

    if (error) {
      setDeleteModal((prev) => ({
        ...prev,
        deleting: false,
        error: error.message,
      }));
      return;
    }

    // Success — close modal, clear selection, refresh
    setDeleteModal({ open: false, ids: [], deleting: false, error: null });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setRefreshKey((k) => k + 1);
  };

  /* ── Fetch ── */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userError || !user) {
        setFetchError("Your session has expired. Please refresh the page.");
        setLoading(false);
        return;
      }

      let query = supabase
        .from("activity_logs")
        .select("*", { count: "exact" })
        .in("action", ["login", "logout"])
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (roleFilter !== "all") query = query.eq("role", roleFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      if (dateFrom) query = query.gte("created_at", dateFrom + "T00:00:00");
      if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");
      if (debouncedSearch.trim())
        query = query.or(
          `user_name.ilike.%${debouncedSearch}%,user_email.ilike.%${debouncedSearch}%,ip_address.ilike.%${debouncedSearch}%`,
        );

      const { data, count, error } = await query;
      if (cancelled) return;

      if (error) {
        console.error("[AdminLogs] fetch error:", error.message);
        setFetchError(error.message);
        setLoading(false);
        return;
      }

      setFetchError(null);
      setLogs(data || []);
      setTotal(count || 0);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    roleFilter,
    actionFilter,
    dateFrom,
    dateTo,
    debouncedSearch,
    refreshKey,
  ]);

  /* ── Export CSV ── */
  const handleExport = async () => {
    setExporting(true);
    let query = supabase
      .from("activity_logs")
      .select("*")
      .in("action", ["login", "logout"])
      .order("created_at", { ascending: false })
      .limit(5000);

    if (roleFilter !== "all") query = query.eq("role", roleFilter);
    if (actionFilter !== "all") query = query.eq("action", actionFilter);
    if (dateFrom) query = query.gte("created_at", dateFrom + "T00:00:00");
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

    const { data } = await query;
    if (!data?.length) {
      setExporting(false);
      return;
    }

    const headers = [
      "Date",
      "Time",
      "User",
      "Email",
      "Role",
      "Action",
      "IP Address",
      "Details",
    ];
    const rows = data.map((l) => [
      fmtDate(l.created_at),
      fmtTime(l.created_at),
      l.user_name || "",
      l.user_email || "",
      l.role || "",
      l.action === "login" ? "Login" : "Logout",
      l.ip_address || "",
      l.details || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `login_logout_logs_${new Date().toISOString().split("T")[0]}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  /* ── Derived ── */
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFilterCount = [
    roleFilter !== "all",
    actionFilter !== "all",
    !!dateFrom,
    !!dateTo,
    !!search,
  ].filter(Boolean).length;

  const adminCount = logs.filter((l) => l.role === "admin").length;
  const staffCount = logs.filter((l) => l.role === "staff").length;
  const applicantCount = logs.filter((l) => l.role === "applicant").length;
  const loginCount = logs.filter((l) => l.action === "login").length;
  const logoutCount = logs.filter((l) => l.action === "logout").length;

  const selectedOnPage = logs.filter((l) => selectedIds.has(l.id));

  return (
    <AdminLayout>
      {/* Delete confirmation modal */}
      {deleteModal.open && (
        <DeleteConfirmModal
          count={deleteModal.ids.length}
          onConfirm={handleConfirmDelete}
          onCancel={() =>
            !deleteModal.deleting &&
            setDeleteModal({
              open: false,
              ids: [],
              deleting: false,
              error: null,
            })
          }
          deleting={deleteModal.deleting}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        {/* HEADER */}
        <div className="rounded-xl p-5 border bg-slate-50 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-slate-700 p-2.5 rounded-xl shadow">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Login / Logout Logs
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track sign-in and sign-out events across admin, staff, and
                  applicant accounts.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
              >
                <RefreshCw size={13} /> Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow"
              >
                <Download size={13} /> {exporting ? "Exporting…" : "Export CSV"}
              </button>
            </div>
          </div>
        </div>

        {/* FETCH ERROR BANNER */}
        {fetchError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm shadow-sm">
            <AlertTriangle
              size={16}
              className="flex-shrink-0 mt-0.5 text-red-500"
            />
            <div className="flex-1">
              <p className="font-semibold">Could not load activity logs</p>
              <p className="text-xs text-red-500 mt-0.5">{fetchError}</p>
            </div>
            <button
              onClick={() => {
                setFetchError(null);
                setRefreshKey((k) => k + 1);
              }}
              className="flex-shrink-0 text-xs font-semibold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* DELETE ERROR BANNER */}
        {deleteModal.error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm shadow-sm">
            <AlertTriangle
              size={16}
              className="flex-shrink-0 mt-0.5 text-red-500"
            />
            <div className="flex-1">
              <p className="font-semibold">Delete failed</p>
              <p className="text-xs text-red-500 mt-0.5">{deleteModal.error}</p>
            </div>
            <button
              onClick={() => setDeleteModal((p) => ({ ...p, error: null }))}
              className="flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            {
              label: "Total Events",
              value: total,
              bg: "bg-black",
              border: "border-slate-200",
              text: "text-white",
            },
            {
              label: "Logins",
              value: loginCount,
              bg: "bg-green-50",
              border: "border-green-200",
              text: "text-green-700",
            },
            {
              label: "Logouts",
              value: logoutCount,
              bg: "bg-gray-50",
              border: "border-gray-200",
              text: "text-gray-700",
            },
            {
              label: "Admin Events",
              value: adminCount,
              bg: "bg-orange-50",
              border: "border-orange-200",
              text: "text-orange-700",
            },
            {
              label: "Staff Events",
              value: staffCount,
              bg: "bg-purple-50",
              border: "border-purple-200",
              text: "text-purple-700",
            },
            {
              label: "Applicant Events",
              value: applicantCount,
              bg: "bg-sky-50",
              border: "border-sky-200",
              text: "text-sky-700",
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`rounded-xl border p-2 ${s.bg} ${s.border} shadow-sm`}
            >
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className={`text-xs mt-0.5 font-medium ${s.text} opacity-80`}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTER */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, or IP address…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition border ${
                showFilters || activeFilterCount > 0
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Filter size={12} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none ml-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Event Type
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => handleActionChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                >
                  {ACTION_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => handleDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => handleDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                />
              </div>

              {activeFilterCount > 0 && (
                <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-red-500 hover:underline font-semibold"
                  >
                    ✕ Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bulk action bar — visible only when rows are selected */}
          {selectedOnPage.length > 0 && (
            <div className="px-4 py-2.5 bg-red-50 border-b border-red-100 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-red-700">
                {selectedOnPage.length}{" "}
                {selectedOnPage.length === 1 ? "log" : "logs"} selected
              </p>
              <button
                onClick={() => openDeleteModal(selectedOnPage.map((l) => l.id))}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
              >
                <Trash2 size={12} /> Delete Selected
              </button>
            </div>
          )}

          {/* Log list */}
          <div className="p-4">
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">
                <RefreshCw
                  size={20}
                  className="animate-spin mx-auto mb-2 text-gray-300"
                />
                Loading logs…
              </div>
            ) : logs.length === 0 ? (
              <EmptyState
                hasFilters={activeFilterCount > 0}
                onClear={handleClearFilters}
              />
            ) : (
              <>
                {/* Select-all row */}
                <div className="flex items-center gap-3 px-1 pb-2 mb-1 border-b border-gray-100">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someOnPageSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-red-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400 font-medium select-none">
                    {allOnPageSelected
                      ? "Deselect all on this page"
                      : `Select all ${logs.length} on this page`}
                  </span>
                </div>

                {logs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    expanded={expandedId === log.id}
                    onToggle={() =>
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }
                    selected={selectedIds.has(log.id)}
                    onSelect={(checked) => handleSelectOne(log.id, checked)}
                    onDelete={() => openDeleteModal([log.id])}
                  />
                ))}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, total)} of{" "}
                <strong>{total}</strong> logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(p + 1, totalPages - 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
