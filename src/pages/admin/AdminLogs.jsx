import { useEffect, useState, useRef } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"
import {
  Activity, Search, X, RefreshCw, Filter, Download,
  LogIn, LogOut, FileText, Calendar, Settings, UserPlus,
  ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Clock,
} from "lucide-react"

/* ── Constants ───────────────────────────────────────────────────────────── */
const ROLES = [
  { value: "all",       label: "All Roles"  },
  { value: "admin",     label: "Admin"      },
  { value: "staff",     label: "Staff"      },
  { value: "applicant", label: "Applicant"  },
]

const ACTION_TYPES = [
  { value: "all",                   label: "All Actions"          },
  { value: "login",                 label: "Login"                },
  { value: "logout",                label: "Logout"               },
  { value: "application_submitted", label: "Application Submitted"},
  { value: "application_updated",   label: "Application Updated"  },
  { value: "appointment_created",   label: "Appointment Created"  },
  { value: "appointment_updated",   label: "Appointment Updated"  },
  { value: "profile_updated",       label: "Profile Updated"      },
  { value: "password_changed",      label: "Password Changed"     },
  { value: "staff_promoted",        label: "Staff Promoted"       },
  { value: "staff_removed",         label: "Staff Removed"        },
  { value: "applicant_created",     label: "Applicant Created"    },
  { value: "applicant_deleted",     label: "Applicant Deleted"    },
  { value: "document_uploaded",     label: "Document Uploaded"    },
  { value: "status_changed",        label: "Status Changed"       },
]

const PAGE_SIZE = 20

/* ── Action icon + color ─────────────────────────────────────────────────── */
const ACTION_META = {
  login:                 { icon: LogIn,        color: "text-green-600",  bg: "bg-green-50",   border: "border-green-200",  badge: "bg-green-100 text-green-700"   },
  logout:                { icon: LogOut,       color: "text-gray-500",   bg: "bg-gray-50",    border: "border-gray-200",   badge: "bg-gray-100 text-gray-600"     },
  application_submitted: { icon: FileText,     color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   badge: "bg-blue-100 text-blue-700"     },
  application_updated:   { icon: FileText,     color: "text-indigo-600", bg: "bg-indigo-50",  border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
  appointment_created:   { icon: Calendar,     color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
  appointment_updated:   { icon: Calendar,     color: "text-purple-500", bg: "bg-purple-50",  border: "border-purple-200", badge: "bg-purple-100 text-purple-700" },
  profile_updated:       { icon: Settings,     color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200",  badge: "bg-amber-100 text-amber-700"   },
  password_changed:      { icon: ShieldCheck,  color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
  staff_promoted:        { icon: UserPlus,     color: "text-teal-600",   bg: "bg-teal-50",    border: "border-teal-200",   badge: "bg-teal-100 text-teal-700"     },
  staff_removed:         { icon: AlertTriangle,color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200",    badge: "bg-red-100 text-red-700"       },
  applicant_created:     { icon: UserPlus,     color: "text-sky-600",    bg: "bg-sky-50",     border: "border-sky-200",    badge: "bg-sky-100 text-sky-700"       },
  applicant_deleted:     { icon: AlertTriangle,color: "text-red-500",    bg: "bg-red-50",     border: "border-red-200",    badge: "bg-red-100 text-red-700"       },
  document_uploaded:     { icon: FileText,     color: "text-violet-600", bg: "bg-violet-50",  border: "border-violet-200", badge: "bg-violet-100 text-violet-700" },
  status_changed:        { icon: Activity,     color: "text-rose-600",   bg: "bg-rose-50",    border: "border-rose-200",   badge: "bg-rose-100 text-rose-700"     },
}

const getActionMeta = (action) =>
  ACTION_META[action] || { icon: Activity, color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-600" }

const getRoleBadge = (role) => {
  if (role === "admin")     return "bg-orange-100 text-orange-700 border border-orange-200"
  if (role === "staff")     return "bg-purple-100 text-purple-700 border border-purple-200"
  if (role === "applicant") return "bg-sky-100 text-sky-700 border border-sky-200"
  return "bg-gray-100 text-gray-600"
}

/* ── Format helpers ──────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })

const fmtRelative = (d) => {
  const diff = Math.floor((new Date() - new Date(d)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const actionLabel = (action) =>
  ACTION_TYPES.find(a => a.value === action)?.label || action?.replace(/_/g, " ") || "—"

/* ── Log Row ─────────────────────────────────────────────────────────────── */
function LogRow({ log, expanded, onToggle }) {
  const meta     = getActionMeta(log.action)
  const Icon     = meta.icon
  const hasExtra = log.details || (log.metadata && Object.keys(log.metadata).length > 0)

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${meta.border} mb-2`}>
      <div
        className={`flex items-center gap-3 px-4 py-3 ${meta.bg} ${hasExtra ? "cursor-pointer hover:opacity-90" : ""}`}
        onClick={hasExtra ? onToggle : undefined}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white shadow-sm ${meta.border} border`}>
          <Icon size={14} className={meta.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-800 truncate">{log.user_name || "—"}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRoleBadge(log.role)}`}>
              {log.role}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>
              {actionLabel(log.action)}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{log.user_email}</p>
        </div>

        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-xs font-semibold text-gray-700">{fmtDate(log.created_at)}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-0.5">
            <Clock size={10} /> {fmtTime(log.created_at)}
          </p>
          <p className="text-[10px] text-gray-300 mt-0.5">{fmtRelative(log.created_at)}</p>
        </div>

        {hasExtra && (
          <div className="flex-shrink-0 ml-1">
            {expanded
              ? <ChevronUp size={14} className="text-gray-400" />
              : <ChevronDown size={14} className="text-gray-400" />
            }
          </div>
        )}
      </div>

      {expanded && hasExtra && (
        <div className="px-4 py-3 bg-white border-t border-gray-100 space-y-2">
          {log.details && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Details</p>
              <p className="text-xs text-gray-700 leading-relaxed">{log.details}</p>
            </div>
          )}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Metadata</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(log.metadata).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <p className="text-[10px] text-gray-400 capitalize">{k.replace(/_/g, " ")}</p>
                    <p className="text-xs font-semibold text-gray-700 truncate">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="sm:hidden text-xs text-gray-400">
            {fmtDate(log.created_at)} at {fmtTime(log.created_at)}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Component ──*/
export default function AdminLogs() {
  const [logs,         setLogs]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(0)
  const [expandedId,   setExpandedId]   = useState(null)
  const [exporting,    setExporting]    = useState(false)

  // Filter state
  const [search,       setSearch]       = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [roleFilter,   setRoleFilter]   = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [dateFrom,     setDateFrom]     = useState("")
  const [dateTo,       setDateTo]       = useState("")
  const [showFilters,  setShowFilters]  = useState(false)

  // Debounce search — only updates debouncedSearch, no page reset here
  const debounceRef = useRef(null)
  const handleSearchChange = (value) => {
    setSearch(value)
    setPage(0)                          // reset page in the event handler
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  // Filter change handlers — all reset page directly, no effect needed
  const handleRoleChange   = (v) => { setRoleFilter(v);   setPage(0) }
  const handleActionChange = (v) => { setActionFilter(v); setPage(0) }
  const handleDateFrom     = (v) => { setDateFrom(v);     setPage(0) }
  const handleDateTo       = (v) => { setDateTo(v);       setPage(0) }
  const handleClearFilters = () => {
    setRoleFilter("all"); setActionFilter("all")
    setDateFrom(""); setDateTo("")
    setSearch(""); setDebouncedSearch("")
    setPage(0)
  }

const [refreshKey, setRefreshKey] = useState(0)

/* ── Single fetch effect ─── */
useEffect(() => {
  let cancelled = false

  ;(async () => {
    setLoading(true)
    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (roleFilter   !== "all")      query = query.eq("role",    roleFilter)
    if (actionFilter !== "all")      query = query.eq("action",  actionFilter)
    if (dateFrom)                    query = query.gte("created_at", dateFrom + "T00:00:00")
    if (dateTo)                      query = query.lte("created_at", dateTo   + "T23:59:59")
    if (debouncedSearch.trim()) {
      query = query.or(
        `user_name.ilike.%${debouncedSearch}%,user_email.ilike.%${debouncedSearch}%,details.ilike.%${debouncedSearch}%`
      )
    }

    const { data, count } = await query
    if (cancelled) return
    setLogs(data || [])
    setTotal(count || 0)
    setLoading(false)
  })()

  return () => { cancelled = true }
}, [page, roleFilter, actionFilter, dateFrom, dateTo, debouncedSearch, refreshKey])

const triggerRefresh = () => setRefreshKey(k => k + 1)

  /* ── Export CSV ───*/
  const handleExport = async () => {
    setExporting(true)
    let query = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000)

    if (roleFilter   !== "all") query = query.eq("role",   roleFilter)
    if (actionFilter !== "all") query = query.eq("action", actionFilter)
    if (dateFrom)               query = query.gte("created_at", dateFrom + "T00:00:00")
    if (dateTo)                 query = query.lte("created_at", dateTo   + "T23:59:59")

    const { data } = await query
    if (!data?.length) { setExporting(false); return }

    const headers = ["Date", "Time", "User", "Email", "Role", "Action", "Details"]
    const rows = data.map(l => [
      fmtDate(l.created_at),
      fmtTime(l.created_at),
      l.user_name,
      l.user_email,
      l.role,
      actionLabel(l.action),
      l.details || "",
    ])

    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `activity_logs_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  /* ── Derived values ────────────────────────────────────────────────────── */
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const activeFilterCount = [
    roleFilter !== "all", actionFilter !== "all", !!dateFrom, !!dateTo, !!search,
  ].filter(Boolean).length

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* HEADER */}
        <div className="rounded-xl p-6 border bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-slate-700 p-2.5 rounded-xl">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">ACTIVITY LOGS</h1>
                <p className="text-sm text-gray-600 mt-0.5">Track all system events across admin, staff, and applicant accounts.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={triggerRefresh}
                className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-3 py-2.5 rounded-xl transition"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow"
              >
                <Download size={14} /> {exporting ? "Exporting…" : "Export CSV"}
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Logs",       value: total,                                           bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-700"  },
            { label: "Admin Events",     value: logs.filter(l => l.role === "admin").length,     bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
            { label: "Staff Events",     value: logs.filter(l => l.role === "staff").length,     bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
            { label: "Applicant Events", value: logs.filter(l => l.role === "applicant").length, bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-700"    },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
              <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
              <p className={`text-xs mt-0.5 font-medium ${s.text}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTER BAR */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, or details…"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="flex-1 text-sm outline-none placeholder-gray-400"
            />
            {search && (
              <button onClick={() => handleSearchChange("")} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition border ${
                showFilters || activeFilterCount > 0
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Filter size={12} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="px-4 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                <select
                  value={roleFilter}
                  onChange={e => handleRoleChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={e => handleActionChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                >
                  {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => handleDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => handleDateTo(e.target.value)}
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

          {/* Log list */}
          <div className="p-4">
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-gray-300" />
                Loading activity logs…
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-gray-400 text-sm">No activity logs found.</p>
                {activeFilterCount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
                )}
              </div>
            ) : (
              logs.map(log => (
                <LogRow
                  key={log.id}
                  log={log}
                  expanded={expandedId === log.id}
                  onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 0))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-500 font-medium">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
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
  )
}