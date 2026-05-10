// src/pages/staff/Applications.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import StaffLayout from "../../components/StaffLayout";

export default function StaffApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const navigate = useNavigate();

  // ── Fetch (memoised so realtime can call it too) ──────────────────────────
  const fetchApplications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          profiles!applications_applicant_id_fkey(full_name, email, phone),
          reviewer:reviewed_by_staff_id(full_name)
        `,
        )
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("[StaffApplications] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("staff-applications-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // Enrich new row with profile before adding
            fetchApplications();
          } else if (payload.eventType === "UPDATE") {
            setApplications((prev) =>
              prev.map((a) =>
                a.id === payload.new.id
                  ? { ...a, ...payload.new } // merge updated fields, keep joined data
                  : a,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setApplications((prev) =>
              prev.filter((a) => a.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchApplications]);

  const statusColor = (status) => {
    if (status === "approved")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
    if (status === "under_review")
      return "bg-blue-100 text-blue-700 border-blue-200";
    if (status === "for_release")
      return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  const stats = [
    { key: "all", label: "Total", value: applications.length },
    {
      key: "pending",
      label: "Pending",
      value: applications.filter((a) => a.status === "pending").length,
    },
    {
      key: "under_review",
      label: "Under Review",
      value: applications.filter((a) => a.status === "under_review").length,
    },
    {
      key: "approved",
      label: "Approved",
      value: applications.filter((a) => a.status === "approved").length,
    },
    {
      key: "rejected",
      label: "Rejected",
      value: applications.filter((a) => a.status === "rejected").length,
    },
    {
      key: "for_release",
      label: "For Release",
      value: applications.filter((a) => a.status === "for_release").length,
    },
  ];

  const STAT_STYLES = {
    all: { color: "#374151", bg: "#F3F4F6", border: "#D1D5DB" },
    pending: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    under_review: { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
    approved: { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
    rejected: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
    for_release: { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  };

  const filtered = applications
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => {
      if (!searchQ.trim()) return true;
      const q = searchQ.toLowerCase();
      return (
        a.profiles?.full_name?.toLowerCase().includes(q) ||
        a.profiles?.email?.toLowerCase().includes(q) ||
        a.details?.plate_no?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q)
      );
    });

  return (
    <StaffLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* HEADER */}
        <div className="rounded-xl p-5 border bg-orange-50 border-orange-200">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                📋 Applications
              </h1>
              <p className="text-sm mt-1 text-gray-500">
                Review all submitted franchise applications. Updates in
                real-time.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-1.5 rounded-full font-semibold">
              👁️ View Only — Status changes require Admin
            </span>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {stats.map((stat) => {
            const style = STAT_STYLES[stat.key];
            return (
              <div
                key={stat.key}
                onClick={() => setFilter(stat.key)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  filter === stat.key
                    ? "ring-2 ring-offset-1 ring-orange-400 scale-[1.02]"
                    : "hover:scale-[1.01]"
                }`}
                style={{ background: style.bg, borderColor: style.border }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: style.color }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs mt-1 font-semibold"
                  style={{ color: style.color }}
                >
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* SEARCH */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <span className="text-lg text-gray-400">⌕</span>
          <input
            type="text"
            placeholder="Search by name, email, plate number, type…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ("")}
              className="text-xs bg-gray-100 px-3 py-1 rounded text-gray-500 font-semibold hover:bg-gray-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* LIST */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-16 text-sm text-gray-400">
              <p className="text-3xl mb-2 animate-pulse">⏳</p>
              Loading applications…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-3xl mb-2">📄</p>
              <p className="text-gray-400 text-sm">No applications found</p>
            </div>
          ) : (
            filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => navigate(`/staff/applications/${app.id}`)}
                className="group border border-gray-200 rounded-xl p-4 bg-white hover:bg-orange-50 hover:border-orange-200 transition cursor-pointer shadow-sm"
              >
                <div className="flex justify-between gap-4 items-center">
                  {/* LEFT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-gray-900">
                        {app.profiles?.full_name || "Unknown"}
                      </p>
                      <span
                        className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border ${statusColor(app.status)}`}
                      >
                        {app.status.replace(/_/g, " ")}
                      </span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium capitalize">
                        {app.type}
                      </span>

                      {/* ── Show staff review badge ── */}
                      {app.staff_recommendation && (
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-bold border ${
                            app.staff_recommendation === "pass"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {app.staff_recommendation === "pass"
                            ? "✅ Reviewed: Pass"
                            : "❌ Reviewed: Reject"}
                        </span>
                      )}

                      {/* ── Show admin processed badge ── */}
                      {app.admin_processed && (
                        <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-gray-100 text-gray-500 border border-gray-200">
                          ✔ Admin Processed
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                      <span>📧 {app.profiles?.email || "—"}</span>
                      <span>📞 {app.profiles?.phone || "—"}</span>
                      <span>🚗 {app.details?.plate_no || "—"}</span>
                      <span>
                        🗓{" "}
                        {new Date(
                          app.submitted_at || app.created_at,
                        ).toLocaleDateString("en-PH")}
                      </span>
                      {app.reviewer?.full_name && (
                        <span>👤 Reviewed by: {app.reviewer.full_name}</span>
                      )}
                    </div>
                  </div>

                  {/* VIEW BUTTON */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/staff/applications/${app.id}`)}
                      className="px-4 py-1.5 text-xs font-bold rounded-lg bg-orange-400 hover:bg-orange-500 text-white transition"
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && (
          <p className="text-right text-xs text-gray-400">
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{applications.length}</strong> applications
          </p>
        )}
      </div>
    </StaffLayout>
  );
}
