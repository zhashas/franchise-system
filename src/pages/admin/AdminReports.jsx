// pages/admin/AdminReports.jsx
import { useEffect, useState, useMemo } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"

// ─── helpers ──────────────────────────────────────────────────────────────────
const todayStr  = () => new Date().toISOString().split("T")[0]
const toDateObj = (str) => new Date(str + "T00:00:00")
const diffDays  = (a, b) => Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000)
const fmtDate   = (str) => str
  ? toDateObj(str).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
  : "—"

const exportCSV = (rows) => {
  const headers = ["Name", "Email", "Contact #", "Plate #", "Franchise #", "Status", "Expiration Date", "Days Left", "Application Type"]
  const lines = [
    headers.join(","),
    ...rows.map(r => [
      `"${r.owner_name || ""}"`,
      `"${r.email || ""}"`,
      `"${r.contact_number || ""}"`,
      r.plate_number || "",
      r.franchise_number || "",
      r.status || "",
      r.expiration_date || "",
      r.daysLeft ?? "",
      r.application_type || "",
    ].join(","))
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = `franchise_report_${todayStr()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [franchises,    setFranchises]    = useState([])
  const [applications,  setApplications]  = useState([])
  const [loading,       setLoading]       = useState(true)
  const [activeFilter,  setActiveFilter]  = useState(null)   // null | "mtop" | "expiry30" | "expiry15"
  const [listFilter,    setListFilter]    = useState("all")
  const [search,        setSearch]        = useState("")
  const [sortBy,        setSortBy]        = useState("name")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: fr }, { data: apps }] = await Promise.all([
        supabase.from("franchises").select("*").order("franchise_number", { ascending: true }),
        supabase.from("applications").select("*").eq("status", "approved").order("submitted_at", { ascending: false }),
      ])
      setFranchises(fr || [])
      setApplications(apps || [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Enrich franchises with application data ────────────────────────────────
  const enriched = useMemo(() => {
    return franchises.map(f => {
      // Find latest approved application for this franchise
      const app = applications.find(a => a.franchise_id === f.id || a.franchise_number === f.franchise_number)
      const daysLeft = f.expiration_date ? diffDays(f.expiration_date, todayStr()) : null

      // Count how many active franchises this applicant owns
      const activeCount = franchises.filter(x => x.applicant_id === f.applicant_id && x.status === "active").length

      // Check MTOP due (within 30 days of year 1 or 2 anniversary)
      let mtopDueSoon = false
      if (f.date_issued) {
        const today = todayStr()
        for (const yearN of [1, 2]) {
          const ann = (() => { const d = toDateObj(f.date_issued); d.setFullYear(d.getFullYear() + yearN); return d.toISOString().split("T")[0] })()
          const diff = diffDays(ann, today)
          if (diff >= 0 && diff <= 30) mtopDueSoon = true
        }
      }

      return {
        ...f,
        daysLeft,
        activeCount,
        mtopDueSoon,
        email:          app?.email          || f.email          || "—",
        contact_number: app?.contact_number || f.contact_number || "—",
        application_type: app?.type         || "—",
      }
    })
  }, [franchises, applications])

  // ── Card counts ────────────────────────────────────────────────────────────
  const mtopCount    = enriched.filter(f => f.mtopDueSoon && f.status === "active").length
  const expiry30Count = enriched.filter(f => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30).length
  const expiry15Count = enriched.filter(f => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 15).length

  // ── Filtered + sorted rows ─────────────────────────────────────────────────
  const rows = useMemo(() => {
    let data = enriched

    // Card filter overrides list filter
    if (activeFilter === "mtop")    data = data.filter(f => f.mtopDueSoon && f.status === "active")
    else if (activeFilter === "expiry30") data = data.filter(f => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30)
    else if (activeFilter === "expiry15") data = data.filter(f => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 15)
    else {
      if (listFilter === "active")    data = data.filter(f => f.status === "active")
      if (listFilter === "expired")   data = data.filter(f => f.status === "expired")
      if (listFilter === "available") data = data.filter(f => f.status === "available")
      if (listFilter === "expiry30")  data = data.filter(f => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30)
      if (listFilter === "expiry15")  data = data.filter(f => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 15)
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(f =>
        f.owner_name?.toLowerCase().includes(q) ||
        f.franchise_number?.toLowerCase().includes(q) ||
        f.plate_number?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q)
      )
    }

    // Sort
    return [...data].sort((a, b) => {
      if (sortBy === "name")       return (a.owner_name || "").localeCompare(b.owner_name || "")
      if (sortBy === "expired")    return (a.expiration_date || "").localeCompare(b.expiration_date || "")
      if (sortBy === "expiry30")   return (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
      if (sortBy === "expiry15")   return (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
      if (sortBy === "active")     return (a.status === "active" ? -1 : 1)
      if (sortBy === "available")  return (a.status === "available" ? -1 : 1)
      return 0
    })
  }, [enriched, activeFilter, listFilter, search, sortBy])

  const statusBadge = (f) => {
    if (f.status === "available") return "bg-gray-100 text-gray-500"
    if (f.status === "expired")   return "bg-red-100 text-red-700"
    if (f.daysLeft !== null && f.daysLeft <= 15) return "bg-red-100 text-red-600 animate-pulse"
    if (f.daysLeft !== null && f.daysLeft <= 30) return "bg-orange-100 text-orange-700"
    return "bg-emerald-100 text-emerald-700"
  }

  const daysLeftBadge = (f) => {
    if (f.daysLeft === null) return "—"
    if (f.daysLeft <= 0)  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>
    if (f.daysLeft <= 15) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">{f.daysLeft}d</span>
    if (f.daysLeft <= 30) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{f.daysLeft}d</span>
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{f.daysLeft}d</span>
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 px-1">

        {/* ── HEADER ── */}
        <div className="rounded-xl px-6 py-5 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md">
          <p className="text-xs font-semibold text-orange-100 uppercase tracking-widest mb-0.5">Municipal Franchise Management System</p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Reports</h1>
          <p className="text-sm text-orange-100 mt-0.5">Franchise holder records, expiry tracking, and MTOP reminders.</p>
        </div>

        {/* ── 3 FILTER CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* MTOP */}
          <button
            onClick={() => setActiveFilter(f => f === "mtop" ? null : "mtop")}
            className={`rounded-xl border-2 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
              activeFilter === "mtop" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-300" : "border-blue-200 bg-blue-50/60 hover:border-blue-400"
            }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-sm text-gray-800">📋 Annual MTOP Sticker</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">Franchise holders with MTOP sticker payment due within 30 days of their annual anniversary.</p>
              </div>
              <span className={`text-4xl font-black tabular-nums ml-3 ${mtopCount > 0 ? "text-blue-500" : "text-gray-300"}`}>{mtopCount}</span>
            </div>
            {activeFilter === "mtop" && <p className="text-xs text-blue-600 font-semibold mt-2">✅ Filtering active — click to clear</p>}
          </button>

          {/* Expiry 30 */}
          <button
            onClick={() => setActiveFilter(f => f === "expiry30" ? null : "expiry30")}
            className={`rounded-xl border-2 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
              activeFilter === "expiry30" ? "border-orange-500 bg-orange-50 ring-2 ring-orange-300" : "border-orange-200 bg-orange-50/60 hover:border-orange-400"
            }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-sm text-gray-800">⚠️ Expiring Warning — 30 Days</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">Active franchises expiring within the next 30 days. Renewal action recommended.</p>
              </div>
              <span className={`text-4xl font-black tabular-nums ml-3 ${expiry30Count > 0 ? "text-orange-500" : "text-gray-300"}`}>{expiry30Count}</span>
            </div>
            {activeFilter === "expiry30" && <p className="text-xs text-orange-600 font-semibold mt-2">✅ Filtering active — click to clear</p>}
          </button>

          {/* Expiry 15 */}
          <button
            onClick={() => setActiveFilter(f => f === "expiry15" ? null : "expiry15")}
            className={`rounded-xl border-2 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
              activeFilter === "expiry15" ? "border-red-500 bg-red-50 ring-2 ring-red-300" : "border-red-200 bg-red-50/60 hover:border-red-400"
            }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-extrabold text-sm text-gray-800">🚨 Expiring Warning — 15 Days</p>
                <p className="text-xs text-gray-500 mt-1 leading-snug">Urgent — active franchises expiring within 15 days. Immediate renewal required.</p>
              </div>
              <span className={`text-4xl font-black tabular-nums ml-3 ${expiry15Count > 0 ? "text-red-500" : "text-gray-300"}`}>{expiry15Count}</span>
            </div>
            {activeFilter === "expiry15" && <p className="text-xs text-red-600 font-semibold mt-2">✅ Filtering active — click to clear</p>}
          </button>

        </div>

        {/* ── APPLICANT LIST ── */}
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">

          {/* Controls */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <h2 className="font-bold text-base text-gray-800">Franchise Holder List</h2>
              <span className="text-xs text-gray-400 italic ml-1">Approved applications only</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search name, plate, franchise…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 w-44"
              />

              {/* Dropdown filter */}
              <select
                value={activeFilter || listFilter}
                onChange={e => {
                  setActiveFilter(null)
                  setListFilter(e.target.value)
                }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="all">All Records</option>
                <option value="active">✅ Active</option>
                <option value="available">🔄 Available</option>
                <option value="expired">⛔ Expired</option>
                <option value="expiry30">⚠️ Expiring ≤30 Days</option>
                <option value="expiry15">🚨 Expiring ≤15 Days</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300">
                <option value="name">A–Z Name</option>
                <option value="expired">Sort: Expired</option>
                <option value="expiry30">Sort: Expiring ≤30d</option>
                <option value="expiry15">Sort: Expiring ≤15d</option>
                <option value="active">Sort: Active First</option>
                <option value="available">Sort: Available First</option>
              </select>

              <button
                onClick={() => exportCSV(rows)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm whitespace-nowrap">
                📥 CSV ({rows.length})
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-14 text-orange-400 font-semibold text-sm">Loading records…</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">No records match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Name", "Email", "Contact #", "Plate #", "Franchise #", "App. Type", "Active Slots", "Expiration", "Days Left", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f, i) => (
                    <tr key={f.id} className={`border-b border-gray-100 hover:bg-orange-50/40 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{f.owner_name || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{f.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{f.contact_number}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{f.plate_number || "—"}</td>
                      <td className="px-4 py-3 font-bold text-gray-800 font-mono text-xs">{f.franchise_number || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{f.application_type}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          f.activeCount >= 3 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {f.activeCount} / 3
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(f.expiration_date)}</td>
                      <td className="px-4 py-3 text-center">{daysLeftBadge(f)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge(f)}`}>
                          {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-400 flex-wrap gap-2">
            <span>One user may hold a maximum of <strong className="text-gray-600">3 active franchises</strong>. Slots shown as X / 3.</span>
            <span>{rows.length} record{rows.length !== 1 ? "s" : ""} shown</span>
          </div>

        </div>

      </div>
    </AdminLayout>
  )
}