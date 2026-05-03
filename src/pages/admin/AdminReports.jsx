// pages/admin/AdminReports.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";

// ─── helpers ─────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const toDateObj = (str) => new Date(str + "T00:00:00");
const diffDays = (a, b) =>
  Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000);
const fmtDate = (str) =>
  str
    ? toDateObj(str).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

// ─── CSV export ───────────────────────────────────────────────────────────────
const exportCSV = (rows) => {
  const headers = [
    "Name",
    "Email",
    "Contact #",
    "Plate #",
    "Franchise #",
    "Application Type",
    "Active Slots",
    "Date Approved",
    "Expiration Date",
    "Days Left",
    "Status",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        `"${r.owner_name || ""}"`,
        `"${r.email || ""}"`,
        `"${r.contact_number || ""}"`,
        `"${r.plate_number || ""}"`,
        `"${r.franchise_number || ""}"`,
        `"${r.application_type || ""}"`,
        r.activeCount ?? "",
        `"${r.date_issued || ""}"`,
        `"${r.expiration_date || ""}"`,
        r.daysLeft ?? "",
        `"${r.status || ""}"`,
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `franchise_audit_${todayStr()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Find best-matching application ──────────────────────────────────────────
function findMatchingApp(franchise, applications, wantStatus) {
  const fno = (franchise.franchise_number || "").toUpperCase();
  const fplt = (franchise.plate_number || "").toUpperCase();
  const aid = franchise.applicant_id;
  const candidates = applications.filter((a) => {
    if (wantStatus && a.status !== wantStatus) return false;
    if (aid && a.applicant_id !== aid) return false;
    const d = a.details || {};
    const dfno = (d.franchise_number || "").toUpperCase();
    const dcno = (d.control_number || "").toUpperCase();
    const dplt = (d.plate_no || "").toUpperCase();
    return (fno && (dfno === fno || dcno === fno)) || (fplt && dplt === fplt);
  });
  if (!candidates.length) return null;
  return candidates.sort(
    (a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0),
  )[0];
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [franchises, setFranchises] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState(null);
  const [listFilter, setListFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: fr }, { data: apps }] = await Promise.all([
        supabase
          .from("franchises")
          .select("*")
          .order("franchise_number", { ascending: true }),
        supabase
          .from("applications")
          .select("id, applicant_id, type, status, details, submitted_at")
          .order("submitted_at", { ascending: false }),
      ]);
      setFranchises(fr || []);
      setApplications(apps || []);
      setLoading(false);
    };
    load();
  }, []);

  // ── Enrich ────────────────────────────────────────────────────────────────
  const enriched = useMemo(() => {
    return franchises.map((f) => {
      const approvedApp = findMatchingApp(f, applications, "approved");
      const anyApp = approvedApp || findMatchingApp(f, applications, null);
      const details = approvedApp?.details || anyApp?.details || {};
      const ownerName = details.franchise_owner || f.owner_name || "—";
      const email = details.email || f.email || "—";
      const contact_number = details.contact_number || f.contact_number || "—";
      const plateNumber =
        f.plate_number || (details.plate_no || "").toUpperCase() || "—";
      const rawType = approvedApp?.type || anyApp?.type || "";
      const appTypeLabel =
        rawType === "registration"
          ? "New Registration"
          : rawType === "renewal"
            ? "Renewal"
            : rawType || "—";
      const daysLeft = f.expiration_date
        ? diffDays(f.expiration_date, todayStr())
        : null;
      const activeCount = franchises.filter(
        (x) => x.applicant_id === f.applicant_id && x.status === "active",
      ).length;
      let mtopDueSoon = false;
      if (f.date_issued) {
        for (const yearN of [1, 2]) {
          const ann = (() => {
            const d = toDateObj(f.date_issued);
            d.setFullYear(d.getFullYear() + yearN);
            return d.toISOString().split("T")[0];
          })();
          const diff = diffDays(ann, todayStr());
          if (diff >= 0 && diff <= 30) mtopDueSoon = true;
        }
      }
      return {
        ...f,
        owner_name: ownerName,
        email,
        contact_number,
        plate_number: plateNumber,
        application_type: appTypeLabel,
        daysLeft,
        activeCount,
        mtopDueSoon,
      };
    });
  }, [franchises, applications]);

  // ── Counts ────────────────────────────────────────────────────────────────
  const mtopCount = enriched.filter(
    (f) => f.mtopDueSoon && f.status === "active",
  ).length;
  const expiry30Count = enriched.filter(
    (f) =>
      f.status === "active" &&
      f.daysLeft !== null &&
      f.daysLeft > 0 &&
      f.daysLeft <= 30,
  ).length;
  const expiry15Count = enriched.filter(
    (f) =>
      f.status === "active" &&
      f.daysLeft !== null &&
      f.daysLeft > 0 &&
      f.daysLeft <= 15,
  ).length;

  // ── Filtered + sorted rows ────────────────────────────────────────────────
  const rows = useMemo(() => {
    let data = enriched;
    if (alertFilter === "mtop")
      data = data.filter((f) => f.mtopDueSoon && f.status === "active");
    else if (alertFilter === "expiry30")
      data = data.filter(
        (f) =>
          f.status === "active" &&
          f.daysLeft !== null &&
          f.daysLeft > 0 &&
          f.daysLeft <= 30,
      );
    else if (alertFilter === "expiry15")
      data = data.filter(
        (f) =>
          f.status === "active" &&
          f.daysLeft !== null &&
          f.daysLeft > 0 &&
          f.daysLeft <= 15,
      );
    else {
      if (listFilter === "active")
        data = data.filter((f) => f.status === "active");
      if (listFilter === "expired")
        data = data.filter((f) => f.status === "expired");
      if (listFilter === "available")
        data = data.filter((f) => f.status === "available");
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (f) =>
          f.owner_name?.toLowerCase().includes(q) ||
          f.franchise_number?.toLowerCase().includes(q) ||
          f.plate_number?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.contact_number?.toLowerCase().includes(q),
      );
    }
    return [...data].sort((a, b) => {
      if (sortBy === "name")
        return (a.owner_name || "").localeCompare(b.owner_name || "");
      if (sortBy === "expiry")
        return (a.expiration_date || "").localeCompare(b.expiration_date || "");
      if (sortBy === "daysLeft")
        return (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999);
      return 0;
    });
  }, [enriched, alertFilter, listFilter, search, sortBy]);

  // ── Badge helpers ─────────────────────────────────────────────────────────
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
    const isNew = label === "New Registration";
    return (
      <span
        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${isNew ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}
      >
        {isNew ? "📋 New Reg." : "🔄 Renewal"}
      </span>
    );
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
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              <span className="text-gray-900">FRANCHISE </span>
              <span className="text-orange-500">AUDIT.</span>
            </h1>
            <div className="mt-1 h-0.5 w-44 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
            <p className="text-sm text-gray-400 font-medium mt-2 tracking-wide">
              Comprehensive ledger of all registered units and statuses.
            </p>
          </div>
          <button
            onClick={() => exportCSV(rows)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-black text-sm px-5 py-3 rounded-xl shadow-md transition-all whitespace-nowrap"
          >
            <span>↓</span>
            <span>Export Ledger</span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">
              {rows.length}
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
                  setAlertFilter((f) => (f === chip.key ? null : chip.key))
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                  alertFilter === chip.key
                    ? "bg-white text-gray-900 shadow"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
                <span
                  className={`tabular-nums font-black ${
                    alertFilter === chip.key
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
            {alertFilter && (
              <button
                onClick={() => setAlertFilter(null)}
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
                  setAlertFilter(null);
                  setListFilter(key);
                }}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                  listFilter === key && !alertFilter
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[320px] flex flex-col">
          {/* Controls bar */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-gray-300 text-lg flex-shrink-0">⌕</span>
              <input
                type="text"
                placeholder="Search by name, plate, franchise #, email…"
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
            <div className="flex items-center gap-3 flex-shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-gray-400 bg-white"
              >
                <option value="name">Sort: A–Z</option>
                <option value="expiry">Sort: Expiry Date</option>
                <option value="daysLeft">Sort: Days Left</option>
              </select>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                {rows.length} {rows.length === 1 ? "Entry" : "Entries"} Found
              </span>
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                Processing Ledger…
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <p className="text-4xl">📋</p>
              <p className="text-base font-black text-gray-600">
                No Entries Found
              </p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                {search
                  ? `No results for "${search}"`
                  : "No records match your current filter."}
              </p>
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
                  {rows.map((f) => (
                    <tr
                      key={f.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* IDENTITY */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {f.owner_name}
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
                        <div className="mt-1">
                          {appTypeBadge(f.application_type)}
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td className="px-5 py-4">
                        <p
                          className="text-xs text-gray-500 max-w-[160px] truncate"
                          title={f.email}
                        >
                          {f.email}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          {f.contact_number}
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
                            className={`text-[10px] font-bold mt-1 ${f.daysLeft <= 15 ? "text-red-400" : f.daysLeft <= 30 ? "text-orange-400" : "text-gray-400"}`}
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
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${f.activeCount >= 3 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                        >
                          {f.activeCount} / 3
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && franchises.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs text-gray-400">
                Max{" "}
                <strong className="text-gray-600">3 active franchises</strong>{" "}
                per applicant · Slots shown as X / 3
              </span>
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                {rows.length} / {franchises.length} records shown
              </span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
