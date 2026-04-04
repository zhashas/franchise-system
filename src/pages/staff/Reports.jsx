import { useEffect, useState, useMemo } from "react"
import { supabase } from "../../lib/supabaseClient"
import StaffLayout from "../../components/StaffLayout"

// ─── helpers ──────────────────────────────────────────────────────────────────
const toDateObj  = (str) => new Date(str + "T00:00:00")
const diffDays   = (a, b) => Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000)
const todayStr   = () => new Date().toISOString().split("T")[0]
const fmtDate    = (str) => str ? toDateObj(str).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
const exportCSV = (rows) => {
  const headers = ["Franchise #", "Owner Name", "Email", "Contact #", "Plate #", "Date Issued", "Expiration Date", "Status", "Days Left", "Application Type", "Validity Note"]
  const lines = [
    headers.join(","),
    ...rows.map(r => [
      r.franchise_number,
      `"${r.owner_name || ""}"`,
      `"${r.email || ""}"`,
      r.contact || "",
      r.plate_number || "",
      r.date_issued || "",
      r.expiration_date || "",
      r.status,
      r.daysLeft ?? "",
      r.appType || "",
      r.validityNote || "",
    ].join(","))
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a"); a.href = url; a.download = `franchise_report_${todayStr()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function StaffReports() {
  const [franchises,   setFranchises]   = useState([])
  const [applications, setApplications] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filterCard,   setFilterCard]   = useState(null)   // "mtop" | "expiry30" | "expiry15" | null
  const [listFilter,   setListFilter]   = useState("all")  // dropdown
  const [sortAlpha,    setSortAlpha]    = useState(false)
  const [searchQ,      setSearchQ]      = useState("")



  const fetchAll = async () => {
    const [{ data: fr }, { data: apps }] = await Promise.all([
      supabase.from("franchises").select("*").order("franchise_number"),
      supabase.from("applications").select("*, profiles(full_name, email, phone)").eq("status", "approved"),
    ])
    setFranchises(fr || [])
    setApplications(apps || [])
    setLoading(false)
  }
useEffect(() => {
  const fetchData = async () => {
    await fetchAll()
  }
  fetchData()
}, [])
  // ── Enrich franchises with applicant info from applications ─────────────────
  const enriched = useMemo(() => {
    const today = todayStr()
    return franchises.map(f => {
      // Try to find matching approved application
      const matchedApp = applications.find(a =>
        (a.details?.franchise_number?.toUpperCase() === f.franchise_number?.toUpperCase()) ||
        (a.details?.plate_no?.toUpperCase() === f.plate_number?.toUpperCase())
      )
      const profile  = matchedApp?.profiles || {}
      const daysLeft = f.expiration_date ? diffDays(f.expiration_date, today) : null

      return {
        ...f,
        email:        profile.email     || f.email     || "",
        contact:      profile.phone     || f.contact   || "",
        appType:      matchedApp?.type  || "",
        validityNote: f.date_issued ? `Valid 3 years from ${f.date_issued}` : "",
        daysLeft,
      }
    })
  }, [franchises, applications])

  // ── Card counts ──────────────────────────────────────────────────────────────
  const mtopCount    = enriched.filter(f => {
    if (!f.date_issued || f.status !== "active") return false
    const today = todayStr()
    for (const yearN of [1, 2]) {
      const ann = (() => { const d = toDateObj(f.date_issued); d.setFullYear(d.getFullYear() + yearN); return d.toISOString().split("T")[0] })()
      const diff = diffDays(ann, today)
      if (diff >= 0 && diff <= 30) return true
    }
    return false
  }).length

  const expiry30Count = enriched.filter(f => f.daysLeft !== null && f.daysLeft > 0  && f.daysLeft <= 30 && f.status === "active").length
  const expiry15Count = enriched.filter(f => f.daysLeft !== null && f.daysLeft > 0  && f.daysLeft <= 15 && f.status === "active").length

  // ── Apply filters ────────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let rows = [...enriched]
    const today = todayStr()

    // Card filter overrides list filter
    if (filterCard === "mtop") {
      rows = rows.filter(f => {
        if (!f.date_issued || f.status !== "active") return false
        for (const yearN of [1, 2]) {
          const ann = (() => { const d = toDateObj(f.date_issued); d.setFullYear(d.getFullYear() + yearN); return d.toISOString().split("T")[0] })()
          const diff = diffDays(ann, today)
          if (diff >= 0 && diff <= 30) return true
        }
        return false
      })
    } else if (filterCard === "expiry30") {
      rows = rows.filter(f => f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30 && f.status === "active")
    } else if (filterCard === "expiry15") {
      rows = rows.filter(f => f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 15 && f.status === "active")
    } else {
      // List dropdown filter
      if (listFilter === "expired")     rows = rows.filter(f => f.status === "expired" || (f.daysLeft !== null && f.daysLeft <= 0))
      else if (listFilter === "expiry30") rows = rows.filter(f => f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 30 && f.status === "active")
      else if (listFilter === "expiry15") rows = rows.filter(f => f.daysLeft !== null && f.daysLeft > 0 && f.daysLeft <= 15 && f.status === "active")
      else if (listFilter === "active")   rows = rows.filter(f => f.status === "active")
      else if (listFilter === "available") rows = rows.filter(f => f.status === "available")
    }

    // Search
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      rows = rows.filter(f =>
        f.owner_name?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q) ||
        f.franchise_number?.toLowerCase().includes(q) ||
        f.plate_number?.toLowerCase().includes(q) ||
        f.contact?.toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortAlpha) rows = rows.sort((a, b) => (a.owner_name || "").localeCompare(b.owner_name || ""))

    return rows
  }, [enriched, filterCard, listFilter, searchQ, sortAlpha])

  // ── Status badge ──────────────────────────────────────────────────────────────
  const statusBadge = (f) => {
    if (f.status === "expired" || (f.daysLeft !== null && f.daysLeft <= 0)) return "bg-red-100 text-red-700"
    if (f.status === "active" && f.daysLeft !== null && f.daysLeft <= 15)   return "bg-red-100 text-red-700 animate-pulse"
    if (f.status === "active" && f.daysLeft !== null && f.daysLeft <= 30)   return "bg-orange-100 text-orange-700"
    if (f.status === "active")     return "bg-green-100 text-green-700"
    if (f.status === "available")  return "bg-gray-100 text-gray-600"
    return "bg-gray-100 text-gray-500"
  }

  const maxActive = 3
  const activeCountByOwner = useMemo(() => {
    const map = {}
    enriched.forEach(f => {
      if (f.status === "active" && f.owner_name) map[f.owner_name] = (map[f.owner_name] || 0) + 1
    })
    return map
  }, [enriched])

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="rounded-xl p-6 border bg-purple-50 border-purple-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">FRANCHISE REPORTS</h1>
            <p className="text-sm text-gray-600">View, filter, and export franchise records.</p>
          </div>
          <button onClick={() => exportCSV(visible)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition flex items-center gap-2">
            📥 Export CSV ({visible.length})
          </button>
        </div>

        {/* NOTICE FILTER CARDS (3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* MTOP Sticker Reminder */}
          <div onClick={() => setFilterCard(filterCard === "mtop" ? null : "mtop")}
            className={`p-5 rounded-xl border-2 cursor-pointer transition shadow-sm ${filterCard === "mtop" ? "border-blue-500 bg-blue-100 ring-2 ring-blue-400" : "border-blue-200 bg-blue-50 hover:bg-blue-100"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📋</span>
              <span className="text-3xl font-bold text-blue-600">{mtopCount}</span>
            </div>
            <p className="font-bold text-blue-700 text-sm">MTOP Sticker Reminder</p>
            <p className="text-xs text-blue-500 mt-1">Franchises with annual sticker payment due within 30 days.</p>
            {filterCard === "mtop" && <span className="inline-block mt-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">● Filtering active</span>}
          </div>

          {/* Expiry Warning 30 Days */}
          <div onClick={() => setFilterCard(filterCard === "expiry30" ? null : "expiry30")}
            className={`p-5 rounded-xl border-2 cursor-pointer transition shadow-sm ${filterCard === "expiry30" ? "border-orange-500 bg-orange-100 ring-2 ring-orange-400" : "border-orange-200 bg-orange-50 hover:bg-orange-100"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⚠️</span>
              <span className="text-3xl font-bold text-orange-600">{expiry30Count}</span>
            </div>
            <p className="font-bold text-orange-700 text-sm">Expiring in 30 Days</p>
            <p className="text-xs text-orange-500 mt-1">Active franchises expiring within the next 30 days.</p>
            {filterCard === "expiry30" && <span className="inline-block mt-2 text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">● Filtering active</span>}
          </div>

          {/* Expiry Warning 15 Days */}
          <div onClick={() => setFilterCard(filterCard === "expiry15" ? null : "expiry15")}
            className={`p-5 rounded-xl border-2 cursor-pointer transition shadow-sm ${filterCard === "expiry15" ? "border-red-500 bg-red-100 ring-2 ring-red-400" : "border-red-200 bg-red-50 hover:bg-red-100"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🚨</span>
              <span className="text-3xl font-bold text-red-600">{expiry15Count}</span>
            </div>
            <p className="font-bold text-red-700 text-sm">Expiring in 15 Days – Urgent</p>
            <p className="text-xs text-red-500 mt-1">Active franchises expiring within the next 15 days.</p>
            {filterCard === "expiry15" && <span className="inline-block mt-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">● Filtering active</span>}
          </div>

        </div>

        {/* SEARCH + FILTER CONTROLS */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">

          <input type="text" placeholder="Search name, email, plate#, franchise#…" value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />

          <select value={listFilter} onChange={e => { setListFilter(e.target.value); setFilterCard(null) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none">
            <option value="all">All Records</option>
            <option value="active">✅ Active</option>
            <option value="available">🟡 Available</option>
            <option value="expired">⛔ Expired</option>
            <option value="expiry30">⚠️ Expiring in 30 Days</option>
            <option value="expiry15">🚨 Expiring in 15 Days</option>
          </select>

          <button onClick={() => setSortAlpha(!sortAlpha)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition ${sortAlpha ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>
            🔤 A–Z {sortAlpha ? "✓" : ""}
          </button>

          {(filterCard || listFilter !== "all" || searchQ) && (
            <button onClick={() => { setFilterCard(null); setListFilter("all"); setSearchQ(""); setSortAlpha(false) }}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition">
              ✕ Clear Filters
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400 font-medium">{visible.length} record{visible.length !== 1 ? "s" : ""}</span>
        </div>

        {/* FRANCHISE LIST */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-gray-400 font-medium">No records match your filters.</p>
          </div>
        ) : (
          <fieldset className="border border-gray-300 rounded-xl p-1 bg-white shadow-sm">
            <legend className="px-3 text-sm font-bold text-gray-700 ml-4">📋 Franchise Records</legend>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Franchise #", "Owner Name", "Email", "Contact #", "Plate #", "Date Issued", "Expiration", "Days Left", "Status", "App Type", "Validity", "Active Count"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((f, i) => {
                    const activeCount = activeCountByOwner[f.owner_name] || 0
                    const overLimit   = activeCount >= maxActive
                    return (
                      <tr key={f.id} className={`border-b border-gray-100 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-orange-50`}>
                        <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">{f.franchise_number}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{f.owner_name || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{f.email || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{f.contact || "—"}</td>
                        <td className="px-4 py-3 text-gray-700 text-xs font-mono">{f.plate_number || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(f.date_issued)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(f.expiration_date)}</td>
                        <td className="px-4 py-3 text-center">
                          {f.daysLeft !== null ? (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.daysLeft <= 0 ? "bg-red-100 text-red-700" : f.daysLeft <= 15 ? "bg-red-100 text-red-700 animate-pulse" : f.daysLeft <= 30 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                              {f.daysLeft <= 0 ? "Expired" : `${f.daysLeft}d`}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge(f)}`}>
                            {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">{f.appType || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{f.validityNote || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${overLimit ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                            {activeCount}/{maxActive}
                          </span>
                          {overLimit && <p className="text-xs text-red-500 mt-0.5">Max reached</p>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </fieldset>
        )}

        {/* LEGEND */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700 mb-2">📌 Notes</p>
          <p>• <strong>App Type</strong> — whether the franchise came from a new registration or renewal application.</p>
          <p>• <strong>Validity</strong> — all franchises approved through the system are valid for 3 years from the date issued.</p>
          <p>• <strong>Active Count</strong> — a single user/owner may hold a maximum of 3 active franchises. Records exceeding this are flagged.</p>
          <p>• Data shown is from <strong>approved applications only</strong> (new registrations and renewals).</p>
        </div>

      </div>
    </StaffLayout>
  )
}