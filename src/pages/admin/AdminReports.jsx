// pages/admin/AdminReports.jsx
import { useEffect, useState, useMemo } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"

// ─── helpers ─────────────────────────────────────────────────────────────────
const todayStr  = () => new Date().toISOString().split("T")[0]
const toDateObj = (str) => new Date(str + "T00:00:00")
const diffDays  = (a, b) => Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000)
const fmtDate   = (str) =>
  str
    ? toDateObj(str).toLocaleDateString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
      })
    : "—"

// ─── CSV export ───────────────────────────────────────────────────────────────
const exportCSV = (rows) => {
  const headers = [
    "Name", "Email", "Contact #", "Plate #", "Franchise #",
    "Application Type", "Active Slots", "Date Approved",
    "Expiration Date", "Days Left", "Status",
  ]
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        `"${r.owner_name        || ""}"`,
        `"${r.email             || ""}"`,
        `"${r.contact_number    || ""}"`,
        `"${r.plate_number      || ""}"`,
        `"${r.franchise_number  || ""}"`,
        `"${r.application_type  || ""}"`,
        r.activeCount ?? "",
        `"${r.date_issued       || ""}"`,
        `"${r.expiration_date   || ""}"`,
        r.daysLeft ?? "",
        `"${r.status            || ""}"`,
      ].join(",")
    ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url
  a.download = `franchise_report_${todayStr()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Find the best-matching application for a franchise row ───────────────────
// Apply.jsx stores data in applications.details (JSONB):
//   details.franchise_owner  → owner name
//   details.email            → email
//   details.contact_number   → contact
//   details.plate_no         → plate (franchise table stores as plate_number)
//   details.franchise_number → franchise # (renewals only; blank for new reg)
//   details.control_number   → e.g. SJ-2025-000001
//
// syncFranchiseRecord (AdminApplicationDetail) sets:
//   franchise.franchise_number = details.franchise_number
//                              || details.control_number
//                              || TRIC-xxxxxx
//   franchise.plate_number     = details.plate_no.toUpperCase()
//   franchise.applicant_id     = application.applicant_id
//
// So matching strategy (in priority order):
//   1. applicant_id matches AND details.franchise_number matches (renewals)
//   2. applicant_id matches AND details.control_number matches franchise_number (new reg)
//   3. applicant_id matches AND plate_no (uppercased) matches plate_number (fallback)
function findMatchingApp(franchise, applications, wantStatus) {
  const fno  = (franchise.franchise_number || "").toUpperCase()
  const fplt = (franchise.plate_number     || "").toUpperCase()
  const aid  = franchise.applicant_id

  const candidates = applications.filter((a) => {
    if (wantStatus && a.status !== wantStatus) return false
    if (aid && a.applicant_id !== aid)         return false
    const d    = a.details || {}
    const dfno = (d.franchise_number || "").toUpperCase()
    const dcno = (d.control_number   || "").toUpperCase()
    const dplt = (d.plate_no         || "").toUpperCase()

    return (
      (fno  && (dfno === fno || dcno === fno)) ||
      (fplt && dplt === fplt)
    )
  })

  if (!candidates.length) return null

  // Prefer the most recent one
  return candidates.sort(
    (a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)
  )[0]
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [franchises,   setFranchises]   = useState([])
  const [applications, setApplications] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeFilter, setActiveFilter] = useState(null)
  const [listFilter,   setListFilter]   = useState("all")
  const [search,       setSearch]       = useState("")
  const [sortBy,       setSortBy]       = useState("name")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: fr }, { data: apps }] = await Promise.all([
        supabase
          .from("franchises")
          .select("*")
          .order("franchise_number", { ascending: true }),
        supabase
          .from("applications")
          .select("id, applicant_id, type, status, details, submitted_at")
          .order("submitted_at", { ascending: false }),
      ])
      setFranchises(fr   || [])
      setApplications(apps || [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Enrich franchise rows with application data ───────────────────────────
  const enriched = useMemo(() => {
    return franchises.map((f) => {
      // Best approved application for this franchise
      const approvedApp = findMatchingApp(f, applications, "approved")

      // Fallback: any application (pending, rejected, etc.) for partial data
      const anyApp = approvedApp || findMatchingApp(f, applications, null)

      const details = approvedApp?.details || anyApp?.details || {}

      // ── Name ─────────────────────────────────────────────────────────────
      // Prefer application details → then franchise table's owner_name
      const ownerName = details.franchise_owner || f.owner_name || "—"

      // ── Contact info ──────────────────────────────────────────────────────
      const email          = details.email          || f.email          || "—"
      const contact_number = details.contact_number || f.contact_number || "—"

      // ── Plate # ───────────────────────────────────────────────────────────
      // franchise.plate_number is set from details.plate_no on approval
      const plateNumber = f.plate_number || (details.plate_no || "").toUpperCase() || "—"

      // ── Application type ──────────────────────────────────────────────────
      // application.type is "registration" or "renewal" (from Apply.jsx)
      const rawType     = approvedApp?.type || anyApp?.type || ""
      const appTypeLabel =
        rawType === "registration" ? "New Registration" :
        rawType === "renewal"      ? "Renewal"          :
        rawType                    ? rawType             : "—"

      // ── Days left ─────────────────────────────────────────────────────────
      const daysLeft = f.expiration_date
        ? diffDays(f.expiration_date, todayStr())
        : null

      // ── How many active franchises this applicant holds ───────────────────
      const activeCount = franchises.filter(
        (x) => x.applicant_id === f.applicant_id && x.status === "active"
      ).length

      // ── MTOP annual sticker check ─────────────────────────────────────────
      let mtopDueSoon = false
      if (f.date_issued) {
        const today = todayStr()
        for (const yearN of [1, 2]) {
          const ann = (() => {
            const d = toDateObj(f.date_issued)
            d.setFullYear(d.getFullYear() + yearN)
            return d.toISOString().split("T")[0]
          })()
          const diff = diffDays(ann, today)
          if (diff >= 0 && diff <= 30) mtopDueSoon = true
        }
      }

      return {
        ...f,
        owner_name:       ownerName,
        email,
        contact_number,
        plate_number:     plateNumber,
        application_type: appTypeLabel,
        daysLeft,
        activeCount,
        mtopDueSoon,
      }
    })
  }, [franchises, applications])

  // ── Summary card counts ───────────────────────────────────────────────────
  const mtopCount     = enriched.filter((f) => f.mtopDueSoon && f.status === "active").length
  const expiry30Count = enriched.filter((f) => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30).length
  const expiry15Count = enriched.filter((f) => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 15).length

  // ── Filtered + sorted rows ────────────────────────────────────────────────
  const rows = useMemo(() => {
    let data = enriched

    if (activeFilter === "mtop") {
      data = data.filter((f) => f.mtopDueSoon && f.status === "active")
    } else if (activeFilter === "expiry30") {
      data = data.filter((f) => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30)
    } else if (activeFilter === "expiry15") {
      data = data.filter((f) => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 15)
    } else {
      if (listFilter === "active")    data = data.filter((f) => f.status === "active")
      if (listFilter === "expired")   data = data.filter((f) => f.status === "expired")
      if (listFilter === "available") data = data.filter((f) => f.status === "available")
      if (listFilter === "expiry30")  data = data.filter((f) => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30)
      if (listFilter === "expiry15")  data = data.filter((f) => f.status === "active" && f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 15)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(
        (f) =>
          f.owner_name?.toLowerCase().includes(q)      ||
          f.franchise_number?.toLowerCase().includes(q) ||
          f.plate_number?.toLowerCase().includes(q)     ||
          f.email?.toLowerCase().includes(q)            ||
          f.contact_number?.toLowerCase().includes(q)
      )
    }

    return [...data].sort((a, b) => {
      if (sortBy === "name")      return (a.owner_name || "").localeCompare(b.owner_name || "")
      if (sortBy === "expiry")    return (a.expiration_date || "").localeCompare(b.expiration_date || "")
      if (sortBy === "daysLeft")  return (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
      if (sortBy === "active")    return a.status === "active"    ? -1 : 1
      if (sortBy === "available") return a.status === "available" ? -1 : 1
      return 0
    })
  }, [enriched, activeFilter, listFilter, search, sortBy])

  // ── Badge helpers ─────────────────────────────────────────────────────────
  const statusBadgeCls = (f) => {
    if (f.status === "available")                                    return "bg-gray-100 text-gray-500"
    if (f.status === "expired")                                      return "bg-red-100 text-red-700"
    if (f.daysLeft !== null && f.daysLeft <= 15)                     return "bg-red-100 text-red-600"
    if (f.daysLeft !== null && f.daysLeft <= 30)                     return "bg-orange-100 text-orange-700"
    return "bg-emerald-100 text-emerald-700"
  }

  const daysLeftBadge = (f) => {
    if (f.daysLeft === null)   return <span className="text-gray-300">—</span>
    if (f.daysLeft <= 0)       return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>
    if (f.daysLeft <= 15)      return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">{f.daysLeft}d</span>
    if (f.daysLeft <= 30)      return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{f.daysLeft}d</span>
    return                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{f.daysLeft}d</span>
  }

  const appTypeBadge = (label) => {
    if (!label || label === "—") return <span className="text-gray-300">—</span>
    const isNew = label === "New Registration"
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
        isNew ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
      }`}>
        {isNew ? "📋 New Reg." : "🔄 Renewal"}
      </span>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 px-1">

        {/* ── HEADER ── */}
        <div className="rounded-xl px-6 py-5 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md">
          <p className="text-xs font-semibold text-orange-100 uppercase tracking-widest mb-0.5">
            Municipal Franchise Management System
          </p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Reports</h1>
          <p className="text-sm text-orange-100 mt-0.5">
            Franchise holder records, expiry tracking, and MTOP reminders.
          </p>
        </div>

        {/* ── 3 FILTER CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              key: "mtop", count: mtopCount,
              icon: "📋", title: "Annual MTOP Sticker",
              desc: "Franchise holders with MTOP sticker payment due within 30 days of anniversary.",
              activeColor: "border-blue-500 bg-blue-50 ring-2 ring-blue-300",
              baseColor:   "border-blue-200 bg-blue-50/60 hover:border-blue-400",
              numColor:    "text-blue-500",
              activeLabel: "text-blue-600",
            },
            {
              key: "expiry30", count: expiry30Count,
              icon: "⚠️", title: "Expiring Warning — 30 Days",
              desc: "Active franchises expiring within the next 30 days. Renewal action recommended.",
              activeColor: "border-orange-500 bg-orange-50 ring-2 ring-orange-300",
              baseColor:   "border-orange-200 bg-orange-50/60 hover:border-orange-400",
              numColor:    "text-orange-500",
              activeLabel: "text-orange-600",
            },
            {
              key: "expiry15", count: expiry15Count,
              icon: "🚨", title: "Expiring Warning — 15 Days",
              desc: "Urgent — active franchises expiring within 15 days. Immediate renewal required.",
              activeColor: "border-red-500 bg-red-50 ring-2 ring-red-300",
              baseColor:   "border-red-200 bg-red-50/60 hover:border-red-400",
              numColor:    "text-red-500",
              activeLabel: "text-red-600",
            },
          ].map((card) => (
            <button
              key={card.key}
              onClick={() => setActiveFilter((f) => (f === card.key ? null : card.key))}
              className={`rounded-xl border-2 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                activeFilter === card.key ? card.activeColor : card.baseColor
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-extrabold text-sm text-gray-800">{card.icon} {card.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{card.desc}</p>
                </div>
                <span className={`text-4xl font-black tabular-nums ml-3 ${card.count > 0 ? card.numColor : "text-gray-300"}`}>
                  {card.count}
                </span>
              </div>
              {activeFilter === card.key && (
                <p className={`text-xs font-semibold mt-2 ${card.activeLabel}`}>
                  ✅ Filtering active — click to clear
                </p>
              )}
            </button>
          ))}
        </div>

        {/* ── FRANCHISE LIST ── */}
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">

          {/* Controls */}
          <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <h2 className="font-bold text-base text-gray-800">Franchise Holder Records</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search name, plate, franchise #…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300 w-48"
              />
              <select
                value={activeFilter || listFilter}
                onChange={(e) => {
                  setActiveFilter(null)
                  setListFilter(e.target.value)
                }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="all">All Records</option>
                <option value="active">✅ Active</option>
                <option value="available">🔄 Available</option>
                <option value="expired">⛔ Expired</option>
                <option value="expiry30">⚠️ Expiring ≤30 Days</option>
                <option value="expiry15">🚨 Expiring ≤15 Days</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="name">A–Z Name</option>
                <option value="expiry">Sort: Expiration Date</option>
                <option value="daysLeft">Sort: Days Left</option>
                <option value="active">Sort: Active First</option>
                <option value="available">Sort: Available First</option>
              </select>
              <button
                onClick={() => exportCSV(rows)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm whitespace-nowrap"
              >
                📥 CSV ({rows.length})
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-14 text-orange-400 font-semibold text-sm">
              Loading records…
            </div>
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
                    {[
                      "Name", "Email", "Contact #", "Plate #", "Franchise #",
                      "App. Type", "Active Slots", "Date Approved",
                      "Expiration", "Days Left", "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f, i) => (
                    <tr
                      key={f.id}
                      className={`border-b border-gray-100 hover:bg-orange-50/40 transition ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      {/* Name */}
                      <td className="px-3 py-3 font-semibold text-gray-800 whitespace-nowrap text-xs">
                        {f.owner_name}
                      </td>

                      {/* Email */}
                      <td className="px-3 py-3 text-gray-500 text-xs max-w-[150px] truncate" title={f.email}>
                        {f.email}
                      </td>

                      {/* Contact # */}
                      <td className="px-3 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">
                        {f.contact_number}
                      </td>

                      {/* Plate # */}
                      <td className="px-3 py-3 text-gray-600 text-xs font-mono whitespace-nowrap">
                        {f.plate_number || "—"}
                      </td>

                      {/* Franchise # */}
                      <td className="px-3 py-3 font-bold text-gray-800 font-mono text-xs whitespace-nowrap">
                        {f.franchise_number || "—"}
                      </td>

                      {/* App. Type */}
                      <td className="px-3 py-3 text-xs whitespace-nowrap">
                        {appTypeBadge(f.application_type)}
                      </td>

                      {/* Active Slots */}
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          f.activeCount >= 3
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {f.activeCount} / 3
                        </span>
                      </td>

                      {/* Date Approved */}
                      <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {fmtDate(f.date_issued)}
                      </td>

                      {/* Expiration */}
                      <td className="px-3 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {fmtDate(f.expiration_date)}
                      </td>

                      {/* Days Left */}
                      <td className="px-3 py-3 text-center">{daysLeftBadge(f)}</td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadgeCls(f)}`}>
                          {f.status
                            ? f.status.charAt(0).toUpperCase() + f.status.slice(1)
                            : "—"}
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
            <span>
              Max <strong className="text-gray-600">3 active franchises</strong> per applicant.
              Slots shown as X / 3.
            </span>
            <span>{rows.length} record{rows.length !== 1 ? "s" : ""} shown</span>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}