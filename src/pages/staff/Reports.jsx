// src/pages/staff/StaffReports.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import StaffLayout from "../../components/StaffLayout";
import { FileText, Search } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDateObj = (str) => new Date(str + "T00:00:00");
const diffDays = (a, b) =>
  Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000);
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = (str) =>
  str
    ? toDateObj(str).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
const exportCSV = (rows) => {
  const headers = [
    "Franchise #",
    "Owner Name",
    "Email",
    "Contact #",
    "Plate #",
    "Date Issued",
    "Expiration Date",
    "Status",
    "Days Left",
    "Application Type",
    "Validity Note",
    "Active Count",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
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
        r.activeCount || "",
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `franchise_report_${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function StaffReports() {
  const [franchises, setFranchises] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCard, setFilterCard] = useState(null);
  const [listFilter, setListFilter] = useState("all");
  const [sortAlpha, setSortAlpha] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [{ data: fr }, { data: apps }] = await Promise.all([
          supabase.from("franchises").select("*").order("franchise_number"),
          supabase
            .from("applications")
            .select("*, profiles(full_name, email, phone)")
            .eq("status", "approved"),
        ]);

        if (!cancelled) {
          setFranchises(fr || []);
          setApplications(apps || []);
          setLoading(false);
        }
      } catch (error) {
        console.error("[StaffReports] Fetch error:", error);
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Enrich franchises with applicant info from applications ────────────────
  const enriched = useMemo(() => {
    const today = todayStr();
    return franchises.map((f) => {
      const matchedApp = applications.find(
        (a) =>
          a.details?.franchise_number?.toUpperCase() ===
            f.franchise_number?.toUpperCase() ||
          a.details?.plate_no?.toUpperCase() === f.plate_number?.toUpperCase(),
      );
      const profile = matchedApp?.profiles || {};
      const daysLeft = f.expiration_date
        ? diffDays(f.expiration_date, today)
        : null;

      // MTOP sticker check
      let mtopDueSoon = false;
      if (f.date_issued && f.status === "active") {
        for (const yearN of [1, 2]) {
          const ann = (() => {
            const d = toDateObj(f.date_issued);
            d.setFullYear(d.getFullYear() + yearN);
            return d.toISOString().split("T")[0];
          })();
          const diff = diffDays(ann, today);
          if (diff >= 0 && diff <= 30) mtopDueSoon = true;
        }
      }

      return {
        ...f,
        email: profile.email || f.email || "",
        contact: profile.phone || f.contact || "",
        appType: matchedApp?.type || "",
        validityNote: f.date_issued
          ? `Valid 3 years from ${f.date_issued}`
          : "",
        daysLeft,
        mtopDueSoon,
      };
    });
  }, [franchises, applications]);

  // ── Card counts ───────────────────────────────────────────────────────────
  const mtopCount = enriched.filter((f) => f.mtopDueSoon).length;
  const expiry30Count = enriched.filter(
    (f) =>
      f.daysLeft !== null &&
      f.daysLeft > 0 &&
      f.daysLeft <= 30 &&
      f.status === "active",
  ).length;
  const expiry15Count = enriched.filter(
    (f) =>
      f.daysLeft !== null &&
      f.daysLeft > 0 &&
      f.daysLeft <= 15 &&
      f.status === "active",
  ).length;

  // ── Apply filters ─────────────────────────────────────────────────────────
  const visible = useMemo(() => {
    let rows = [...enriched];

    // Card filter overrides list filter
    if (filterCard === "mtop") {
      rows = rows.filter((f) => f.mtopDueSoon);
    } else if (filterCard === "expiry30") {
      rows = rows.filter(
        (f) =>
          f.daysLeft !== null &&
          f.daysLeft > 0 &&
          f.daysLeft <= 30 &&
          f.status === "active",
      );
    } else if (filterCard === "expiry15") {
      rows = rows.filter(
        (f) =>
          f.daysLeft !== null &&
          f.daysLeft > 0 &&
          f.daysLeft <= 15 &&
          f.status === "active",
      );
    } else {
      // List dropdown filter
      if (listFilter === "expired")
        rows = rows.filter(
          (f) =>
            f.status === "expired" || (f.daysLeft !== null && f.daysLeft <= 0),
        );
      else if (listFilter === "expiry30")
        rows = rows.filter(
          (f) =>
            f.daysLeft !== null &&
            f.daysLeft > 0 &&
            f.daysLeft <= 30 &&
            f.status === "active",
        );
      else if (listFilter === "expiry15")
        rows = rows.filter(
          (f) =>
            f.daysLeft !== null &&
            f.daysLeft > 0 &&
            f.daysLeft <= 15 &&
            f.status === "active",
        );
      else if (listFilter === "active")
        rows = rows.filter((f) => f.status === "active");
      else if (listFilter === "available")
        rows = rows.filter((f) => f.status === "available");
    }

    // Search
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      rows = rows.filter(
        (f) =>
          f.owner_name?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.franchise_number?.toLowerCase().includes(q) ||
          f.plate_number?.toLowerCase().includes(q) ||
          f.contact?.toLowerCase().includes(q),
      );
    }

    // Sort
    if (sortAlpha)
      rows = rows.sort((a, b) =>
        (a.owner_name || "").localeCompare(b.owner_name || ""),
      );

    return rows;
  }, [enriched, filterCard, listFilter, searchQ, sortAlpha]);

  // ── Status badge ──────────────────────────────────────────────────────────
  const complianceCls = (f) => {
    if (f.status === "available") return "bg-gray-100 text-gray-500";
    if (f.status === "expired" || (f.daysLeft !== null && f.daysLeft <= 0))
      return "bg-red-100 text-red-700";
    if (f.daysLeft !== null && f.daysLeft <= 15)
      return "bg-red-100 text-red-600 animate-pulse";
    if (f.daysLeft !== null && f.daysLeft <= 30)
      return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
  };

  const complianceLabel = (f) => {
    if (f.status === "available") return "Unassigned";
    if (f.status === "expired" || (f.daysLeft !== null && f.daysLeft <= 0))
      return "Lapsed";
    if (f.daysLeft !== null && f.daysLeft <= 15) return "Critical";
    if (f.daysLeft !== null && f.daysLeft <= 30) return "Warning";
    return "Compliant";
  };

  const appTypeBadge = (label) => {
    if (!label || label === "—")
      return <span className="text-gray-300">—</span>;
    const isNew = label === "registration";
    return (
      <span
        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
          isNew
            ? "bg-blue-100 text-blue-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {isNew ? "📋 New Reg." : "🔄 Renewal"}
      </span>
    );
  };

  // ── Active count per owner ────────────────────────────────────────────────
  const maxActive = 3;
  const activeCountByOwner = useMemo(() => {
    const map = {};
    enriched.forEach((f) => {
      if (f.status === "active" && f.owner_name)
        map[f.owner_name] = (map[f.owner_name] || 0) + 1;
    });
    return map;
  }, [enriched]);

  // ── Refresh handler ───────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [{ data: fr }, { data: apps }] = await Promise.all([
        supabase.from("franchises").select("*").order("franchise_number"),
        supabase
          .from("applications")
          .select("*, profiles(full_name, email, phone)")
          .eq("status", "approved"),
      ]);
      setFranchises(fr || []);
      setApplications(apps || []);
    } catch (error) {
      console.error("[StaffReports] Refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_TABS = [
    { key: "all", label: "ALL" },
    { key: "active", label: "ACTIVE" },
    { key: "expired", label: "EXPIRED" },
    { key: "available", label: "AVAILABLE" },
  ];

  const ALERT_CHIPS = [
    { key: "mtop", icon: "📋", label: "MTOP Due", count: mtopCount },
    { key: "expiry30", icon: "⚠️", label: "≤ 30 Days", count: expiry30Count },
    { key: "expiry15", icon: "🚨", label: "≤ 15 Days", count: expiry15Count },
  ];

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              <span className="text-gray-900">FRANCHISE</span>
              <span className="text-orange-400">REPORTS.</span>
            </h1>
            <div className="mt-1 h-0.5 w-56 bg-gradient-to-r from-orange-400 to-transparent rounded-full" />
            <p className="text-sm text-gray-400 font-medium mt-2 tracking-wide">
              Monitor franchise statuses, expiry dates, and compliance alerts.
            </p>
          </div>
          <button
            onClick={() => exportCSV(visible)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-3 rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            <span>↓</span>
            <span>Export Report</span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">
              {visible.length}
            </span>
          </button>
        </div>

        {/* ── DARK BANNER — alerts + status tabs ── */}
        <div className="bg-gray-900 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          {/* Alert chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {ALERT_CHIPS.map((chip) => (
              <button
                key={chip.key}
                onClick={() =>
                  setFilterCard((f) => (f === chip.key ? null : chip.key))
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  filterCard === chip.key
                    ? "bg-white text-gray-900 shadow"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
                <span
                  className={`tabular-nums font-black ${
                    filterCard === chip.key
                      ? "text-orange-500"
                      : chip.count > 0
                        ? "text-orange-400"
                        : "text-gray-600"
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            ))}
            {filterCard && (
              <button
                onClick={() => setFilterCard(null)}
                className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gray-800 text-gray-500 hover:text-white transition"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl flex-shrink-0">
            {STATUS_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setFilterCard(null);
                  setListFilter(key);
                }}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                  listFilter === key && !filterCard
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── LEDGER PANEL ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {/* Controls bar */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search size={14} className="text-gray-300 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name, email, plate#, franchise#…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent min-w-0"
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ("")}
                  className="text-[11px] font-bold text-gray-400 hover:text-gray-600 bg-gray-100 px-2 py-1 rounded-lg transition flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setSortAlpha(!sortAlpha)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                  sortAlpha
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                🔤 A–Z {sortAlpha ? "✓" : ""}
              </button>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                {visible.length} {visible.length === 1 ? "Entry" : "Entries"}{" "}
                Found
              </span>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                Loading Reports…
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FileText size={28} className="text-gray-300" />
              </div>
              <p className="text-base font-black text-gray-600">
                No Records Found
              </p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                {searchQ
                  ? `No results for "${searchQ}"`
                  : "No records match your current filter."}
              </p>
              {(filterCard || listFilter !== "all" || searchQ) && (
                <button
                  onClick={() => {
                    setFilterCard(null);
                    setListFilter("all");
                    setSearchQ("");
                    setSortAlpha(false);
                  }}
                  className="text-[11px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest transition mt-1"
                >
                  ← Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Identity",
                      "Tag Index",
                      "Contact",
                      "Compliance",
                      "Lifecycle",
                      "Slots",
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
                  {visible.map((f, i) => {
                    const activeCount = activeCountByOwner[f.owner_name] || 0;
                    const overLimit = activeCount >= maxActive;
                    return (
                      <tr
                        key={f.id}
                        className={`transition-colors ${
                          i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } hover:bg-orange-50/30`}
                      >
                        {/* IDENTITY */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                            {f.owner_name || "—"}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {f.plate_number || "—"}
                          </p>
                        </td>

                        {/* TAG INDEX */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-gray-800 font-mono whitespace-nowrap">
                            {f.franchise_number || "—"}
                          </p>
                          <div className="mt-1">{appTypeBadge(f.appType)}</div>
                        </td>

                        {/* CONTACT */}
                        <td className="px-5 py-4">
                          <p
                            className="text-xs text-gray-500 max-w-[160px] truncate"
                            title={f.email}
                          >
                            {f.email || "—"}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {f.contact || "—"}
                          </p>
                        </td>

                        {/* COMPLIANCE */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${complianceCls(f)}`}
                          >
                            {complianceLabel(f)}
                          </span>
                          {f.daysLeft !== null && f.daysLeft > 0 && (
                            <p
                              className={`text-[10px] font-bold mt-1 ${
                                f.daysLeft <= 15
                                  ? "text-red-400"
                                  : f.daysLeft <= 30
                                    ? "text-orange-400"
                                    : "text-gray-400"
                              }`}
                            >
                              {f.daysLeft}d remaining
                            </p>
                          )}
                        </td>

                        {/* LIFECYCLE */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-xs text-gray-400">
                            {fmtDate(f.date_issued)}
                          </p>
                          <p className="text-[10px] text-gray-300 my-0.5">↓</p>
                          <p className="text-xs font-bold text-gray-700">
                            {fmtDate(f.expiration_date)}
                          </p>
                        </td>

                        {/* SLOTS */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              overLimit
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {activeCount} / {maxActive}
                          </span>
                          {overLimit && (
                            <p className="text-xs text-red-500 mt-0.5 font-medium">
                              Max reached
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && franchises.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs text-gray-400 space-y-1">
                <p>
                  <strong className="text-gray-600">
                    Max 3 active franchises
                  </strong>{" "}
                  per owner · Slots shown as X / 3
                </p>
                <p>
                  <strong className="text-gray-600">MTOP sticker</strong> annual
                  payment due within 30 days
                </p>
              </div>
              <button
                onClick={handleRefresh}
                className="text-[10px] font-bold text-gray-400 hover:text-orange-500 transition uppercase tracking-widest"
              >
                ↻ Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
