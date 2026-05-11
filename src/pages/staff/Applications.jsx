// src/pages/staff/StaffApplications.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import StaffLayout from "../../components/StaffLayout";
import { FileText, Search, Eye, CheckCircle, XCircle } from "lucide-react";

export default function StaffApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // ── Fetch all applications ────────────────────────────────────────────────
  const fetchApplications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          profiles!applications_applicant_id_fkey (
            full_name,
            email,
            phone
          ),
          reviewer:reviewed_by_staff_id (
            full_name
          )
        `,
        )
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("[StaffApplications] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ── Realtime: watch ALL applications ─────────────────────────────────────
  useEffect(() => {
    let channel = null;
    let isMounted = true;

    const channelName = `staff-applications-${Date.now()}`;

    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
        },
        (payload) => {
          if (!isMounted) return;

          if (payload.eventType === "INSERT") {
            // Re-fetch to get joined profiles data
            fetchApplications();
          } else if (payload.eventType === "UPDATE") {
            setApplications((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? { ...a, ...payload.new } : a,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setApplications((prev) =>
              prev.filter((a) => a.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("[StaffApplications] Realtime channel error");
        }
      });

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel).catch(console.error);
        channel = null;
      }
    };
  }, [fetchApplications]);

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-600 border-red-200",
      under_review: "bg-blue-100 text-blue-700 border-blue-200",
      for_release: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return map[status] ?? "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  // ── Filter tabs ───────────────────────────────────────────────────────────
  const filterTabs = [
    { key: "all", label: "ALL" },
    { key: "pending", label: "PENDING" },
    { key: "under_review", label: "UNDER REVIEW" },
    { key: "approved", label: "APPROVED" },
    { key: "rejected", label: "REJECTED" },
    { key: "for_release", label: "FOR RELEASE" },
  ];

  // ── Derived filtered list ─────────────────────────────────────────────────
  const filtered = applications
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        a.profiles?.full_name?.toLowerCase().includes(q) ||
        a.profiles?.email?.toLowerCase().includes(q) ||
        a.profiles?.phone?.toLowerCase().includes(q) ||
        a.details?.plate_no?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q)
      );
    });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              <span className="text-gray-900">APPLICATION</span>
              <span className="text-orange-400">REVIEW.</span>
            </h1>
            <div className="mt-1 h-0.5 w-56 bg-gradient-to-r from-orange-400 to-transparent rounded-full" />
            <p className="text-sm text-gray-400 font-medium mt-2 tracking-wide">
              Review and evaluate incoming franchise requests.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm w-64">
              <Search size={14} className="text-gray-300 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search identity or plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-300 hover:text-gray-500 transition"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-wrap">
              {filterTabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === key
                      ? "bg-orange-500 text-white shadow"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            {
              label: "Total",
              value: applications.length,
              color: "text-gray-800",
              dot: "bg-gray-400",
            },
            {
              label: "Pending",
              value: applications.filter((a) => a.status === "pending").length,
              color: "text-yellow-600",
              dot: "bg-yellow-400",
            },
            {
              label: "In Review",
              value: applications.filter((a) => a.status === "under_review")
                .length,
              color: "text-blue-600",
              dot: "bg-blue-400",
            },
            {
              label: "Approved",
              value: applications.filter((a) => a.status === "approved").length,
              color: "text-green-600",
              dot: "bg-green-400",
            },
            {
              label: "Rejected",
              value: applications.filter((a) => a.status === "rejected").length,
              color: "text-red-600",
              dot: "bg-red-400",
            },
            {
              label: "For Release",
              value: applications.filter((a) => a.status === "for_release")
                .length,
              color: "text-purple-600",
              dot: "bg-purple-400",
            },
          ].map(({ label, value, color, dot }) => (
            <div
              key={label}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm text-center"
            >
              <div className={`text-2xl font-black tabular-nums ${color}`}>
                {value}
              </div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          {/* Panel header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  loading ? "bg-orange-400 animate-pulse" : "bg-green-400"
                }`}
              />
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.18em]">
                {filter === "all"
                  ? "All Applications"
                  : filter.replace(/_/g, " ")}
              </p>
            </div>
            <span className="text-[10px] text-gray-300 font-mono">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                Loading repository…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <FileText size={28} className="text-gray-300" />
              </div>
              <p className="text-base font-black text-gray-600">
                No Applications Found
              </p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : filter !== "all"
                    ? "No applications match this filter."
                    : "No applications submitted yet."}
              </p>
              {(searchQuery || filter !== "all") && (
                <button
                  onClick={() => {
                    setFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-[11px] font-bold text-orange-500 hover:text-orange-600 uppercase tracking-widest transition mt-1"
                >
                  ← Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/staff/applications/${app.id}`)}
                  className="flex items-start gap-4 px-6 py-5 cursor-pointer hover:bg-orange-50/30 transition-colors group"
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-orange-50 transition-colors">
                    <FileText
                      size={16}
                      className="text-gray-400 group-hover:text-orange-500 transition-colors"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-black text-gray-900">
                        {app.profiles?.full_name || "Unknown Applicant"}
                      </p>

                      {/* Status Badge */}
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusBadge(app.status)}`}
                      >
                        {app.status.replace(/_/g, " ")}
                      </span>

                      {/* Type Badge */}
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                        {app.type}
                      </span>

                      {/* ✅ Staff Recommendation Badge */}
                      {app.staff_recommendation && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            app.staff_recommendation === "pass"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {app.staff_recommendation === "pass" ? (
                            <CheckCircle size={10} />
                          ) : (
                            <XCircle size={10} />
                          )}
                          {app.staff_recommendation.toUpperCase()}
                        </span>
                      )}

                      {/* ✅ Admin Processed Badge */}
                      {app.admin_processed && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                          ✓ ADMIN PROCESSED
                        </span>
                      )}

                      {/* ID Badge */}
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                        #{app.id.slice(-6)}
                      </span>
                    </div>

                    {/* Details Row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400">
                      {app.profiles?.email && (
                        <span>✉ {app.profiles.email}</span>
                      )}
                      {app.profiles?.phone && (
                        <span>📞 {app.profiles.phone}</span>
                      )}
                      {app.details?.plate_no && (
                        <span>🚗 {app.details.plate_no}</span>
                      )}
                      <span>
                        🗓{" "}
                        {new Date(
                          app.submitted_at || app.created_at,
                        ).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>

                      {/* ✅ Reviewer Info */}
                      {app.reviewer?.full_name && (
                        <span className="text-orange-500 font-medium">
                          👤 Reviewed by: {app.reviewer.full_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/staff/applications/${app.id}`)}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition shadow-sm"
                    >
                      <Eye size={12} />
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {!loading && applications.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                {filtered.length} / {applications.length} displayed
              </span>
              <button
                onClick={fetchApplications}
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
