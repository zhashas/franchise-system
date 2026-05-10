// src/pages/admin/AdminReviewedApplications.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import {
  X,
  CheckCircle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

// ─── Confirm Action Modal ─────────────────────────────────────────────────────
function ConfirmActionModal({ app, action, onConfirm, onCancel, loading }) {
  const [adminRemarks, setAdminRemarks] = useState("");
  const isApprove = action === "approved";
  const staffLabel =
    app.staff_recommendation === "pass" ? "✅ PASS" : "❌ REJECT";
  const isOverride =
    (isApprove && app.staff_recommendation === "reject") ||
    (!isApprove && app.staff_recommendation === "pass");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${
          isApprove ? "border-green-500" : "border-red-500"
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-center gap-4 ${isApprove ? "bg-green-50" : "bg-red-50"}`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-3xl ${
              isApprove ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {isApprove ? "✅" : "❌"}
          </div>
          <div className="flex-1">
            <h2
              className={`text-base font-extrabold ${isApprove ? "text-green-800" : "text-red-800"}`}
            >
              {isApprove ? "Approve Application?" : "Reject Application?"}
            </h2>
            {isOverride && (
              <p className="text-xs text-orange-500 font-semibold mt-0.5">
                ⚠ Overriding staff recommendation
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Applicant</span>
              <span className="font-bold text-gray-900">
                {app.profiles?.full_name || "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Type</span>
              <span className="font-medium text-gray-700 capitalize">
                {app.type}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">
                Staff Recommendation
              </span>
              <span className="font-bold">{staffLabel}</span>
            </div>
          </div>

          {app.staff_remarks && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Staff Remarks
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {app.staff_remarks}
              </p>
            </div>
          )}

          {/* Admin remarks input */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
              Admin Remarks{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              placeholder="Add any notes or reasons for this decision…"
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={() => onConfirm(adminRemarks)}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition shadow disabled:opacity-60 text-white ${
              isApprove
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading
              ? "Processing…"
              : `Confirm ${isApprove ? "Approval" : "Rejection"}`}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Application Card ─────────────────────────────────────────────────────────
function AppCard({ app, onAction, navigate }) {
  const isPass = app.staff_recommendation === "pass";

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden transition hover:shadow-md ${
        isPass ? "border-green-200 bg-white" : "border-red-200 bg-white"
      }`}
    >
      {/* Card top accent */}
      <div className={`h-1 w-full ${isPass ? "bg-green-400" : "bg-red-400"}`} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">
              {app.profiles?.full_name || "—"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {app.type} application
            </p>
            {app.details?.plate_no && (
              <p className="text-xs text-gray-400 mt-0.5">
                🚗 {app.details.plate_no}
              </p>
            )}
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0 ${
              isPass
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {isPass ? "✅ PASS" : "❌ REJECT"}
          </span>
        </div>

        {/* Staff remarks preview */}
        {app.staff_remarks && (
          <div
            className={`rounded-lg p-3 text-xs leading-relaxed ${
              isPass ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            <span className="font-semibold">Remarks: </span>
            {app.staff_remarks.length > 100
              ? app.staff_remarks.slice(0, 100) + "…"
              : app.staff_remarks}
          </div>
        )}

        {/* Reviewer + date */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-[10px] flex-shrink-0">
            {(app.reviewer?.full_name || "S")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() || "")
              .join("")}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-gray-700">
              {app.reviewer?.full_name || "Staff"}
            </span>
            <span className="mx-1 text-gray-300">·</span>
            <span>{fmtDateTime(app.staff_reviewed_at)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-1.5 pt-1">
          {/* View full application */}
          <button
            onClick={() => navigate(`/admin/applications/${app.id}`)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 py-2 rounded-lg transition"
          >
            <ExternalLink size={13} />
            View Full Application
          </button>

          {/* Primary action */}
          {isPass ? (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onAction(app, "approved")}
                className="flex items-center justify-center gap-1 text-xs font-bold bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
              >
                <CheckCircle size={13} />
                Approve
              </button>
              <button
                onClick={() => onAction(app, "rejected")}
                className="flex items-center justify-center gap-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 py-2 rounded-lg transition"
              >
                <XCircle size={13} />
                Reject Anyway
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onAction(app, "rejected")}
                className="flex items-center justify-center gap-1 text-xs font-bold bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
              >
                <XCircle size={13} />
                Confirm Reject
              </button>
              <button
                onClick={() => onAction(app, "approved")}
                className="flex items-center justify-center gap-1 text-xs font-bold bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 py-2 rounded-lg transition"
              >
                <CheckCircle size={13} />
                Approve Anyway
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty Column State ───────────────────────────────────────────────────────
function EmptyState({ isPass }) {
  return (
    <div
      className={`rounded-xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 ${
        isPass
          ? "border-green-200 bg-green-50/50"
          : "border-red-200 bg-red-50/50"
      }`}
    >
      <div className="text-4xl">{isPass ? "✅" : "❌"}</div>
      <p
        className={`text-sm font-bold ${isPass ? "text-green-600" : "text-red-600"}`}
      >
        {isPass
          ? "No applications recommended for approval yet"
          : "No applications recommended for rejection yet"}
      </p>
      <p className="text-xs text-gray-400 text-center">
        Applications reviewed by staff will appear here
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminReviewedApplications() {
  const navigate = useNavigate();

  const [apps, setApps] = useState([]);
  const [staffList, setStaffList] = useState([]); // for filter dropdown
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [staffFilter, setStaffFilter] = useState("all");

  // Modal state
  const [confirmTarget, setConfirmTarget] = useState(null); // { app, action }
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // ── Fetch reviewed applications ────────────────────────────────────────────
  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          profiles!applications_applicant_id_fkey(full_name, email, phone),
          reviewer:reviewed_by_staff_id(full_name, id)
        `,
        )
        .not("staff_recommendation", "is", null)
        .eq("admin_processed", false)
        .order("staff_reviewed_at", { ascending: false });

      if (error) throw error;
      setApps(data || []);

      // Build staff list for filter
      const staffMap = {};
      (data || []).forEach((a) => {
        if (a.reviewer?.id) {
          staffMap[a.reviewer.id] = a.reviewer.full_name || "Staff";
        }
      });
      setStaffList(
        Object.entries(staffMap).map(([id, name]) => ({ id, name })),
      );
    } catch (err) {
      console.error("Failed to load reviewed applications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("reviewed-apps-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "applications" },
        () => fetchApps(),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchApps]);

  // ── Admin action: approve or reject ───────────────────────────────────────
  const handleAdminAction = async (adminRemarks) => {
    if (!confirmTarget) return;
    const { app, action } = confirmTarget;
    setProcessing(true);

    try {
      // 1. Update application status
      const { error: updateErr } = await supabase
        .from("applications")
        .update({
          status: action,
          admin_remarks: adminRemarks?.trim() || null,
          admin_processed: true,
        })
        .eq("id", app.id);

      if (updateErr) throw updateErr;

      // 2. Get admin user for notification sender
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const applicantName = app.profiles?.full_name || "Applicant";
      const actionLabel = action === "approved" ? "approved" : "rejected";

      // 3. Notify the applicant
      await supabase.from("notifications").insert({
        recipient_id: app.applicant_id,
        recipient_type: "applicant",
        sender_id: user.id,
        sender_type: "admin",
        application_id: app.id,
        notification_type:
          action === "approved"
            ? "application_approved"
            : "application_rejected",
        title:
          action === "approved"
            ? "🎉 Application Approved!"
            : "❌ Application Rejected",
        message:
          action === "approved"
            ? `Congratulations! Your franchise application has been approved by Admin.${adminRemarks ? ` Note: ${adminRemarks}` : ""}`
            : `Your franchise application has been rejected.${adminRemarks ? ` Reason: ${adminRemarks}` : " Please contact the office for more details."}`,
        dedup_key: `status_${app.id}_${action}`,
      });

      // 4. Notify the staff reviewer
      if (app.reviewed_by_staff_id) {
        await supabase.from("notifications").upsert(
          {
            recipient_id: app.reviewed_by_staff_id,
            recipient_type: "staff",
            sender_id: user.id,
            sender_type: "admin",
            application_id: app.id,
            notification_type: "staff_update",
            title: `Admin Decision: ${applicantName}`,
            message: `Admin has ${actionLabel} the application you reviewed for ${applicantName}.`,
            dedup_key: `admin_decision_${app.id}_${app.reviewed_by_staff_id}`,
          },
          { onConflict: "dedup_key", ignoreDuplicates: false },
        );
      }

      // 5. If approved, create franchise record (simplified — adjust to match your existing logic)
      if (action === "approved") {
        const d = app.details || {};
        if (d.plate_no) {
          // Generate franchise number (you may want to use a sequence or existing logic)
          const franchiseNumber = `FR-${Date.now().toString().slice(-8)}`;

          const today = new Date();
          const expiration = new Date(today);
          expiration.setFullYear(expiration.getFullYear() + 1);

          await supabase
            .from("franchises")
            .insert({
              franchise_number: franchiseNumber,
              plate_number: d.plate_no,
              owner_name: app.profiles?.full_name || "Unknown",
              date_issued: today.toISOString().split("T")[0],
              expiration_date: expiration.toISOString().split("T")[0],
              status: "active",
              applicant_id: app.applicant_id,
            })
            .select()
            .single();
        }
      }

      setConfirmTarget(null);
      setSuccessMsg(
        `Application ${action === "approved" ? "approved ✅" : "rejected ❌"} and applicant notified.`,
      );
      setTimeout(() => setSuccessMsg(null), 5000);
      fetchApps();
    } catch (err) {
      alert("Action failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filtered = apps.filter((a) => {
    if (staffFilter !== "all" && a.reviewer?.id !== staffFilter) return false;
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      a.profiles?.full_name?.toLowerCase().includes(q) ||
      a.details?.plate_no?.toLowerCase().includes(q) ||
      a.profiles?.email?.toLowerCase().includes(q)
    );
  });

  const passApps = filtered.filter((a) => a.staff_recommendation === "pass");
  const rejectApps = filtered.filter(
    (a) => a.staff_recommendation === "reject",
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Confirm Modal */}
      {confirmTarget && (
        <ConfirmActionModal
          app={confirmTarget.app}
          action={confirmTarget.action}
          loading={processing}
          onConfirm={handleAdminAction}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-green-200 shadow-2xl rounded-2xl px-5 py-4 flex items-center gap-3 max-w-sm">
          <div className="text-2xl">✅</div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">Done!</p>
            <p className="text-xs text-gray-500 mt-0.5">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-gray-300 hover:text-gray-500"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="rounded-xl p-5 border bg-white border-gray-200 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                📋 Staff Reviewed Applications
              </h1>
              <p className="text-sm mt-1 text-gray-500">
                Applications recommended by staff — pending your final approval
                decision.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-xs font-bold text-green-700">
                  {passApps.length} Pass
                </span>
              </div>
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 py-1.5">
                <XCircle size={14} className="text-red-500" />
                <span className="text-xs font-bold text-red-700">
                  {rejectApps.length} Reject
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, plate number, email…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ("")}
                className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-semibold hover:bg-gray-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Staff filter */}
          {staffList.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2 shadow-sm">
              <Filter size={14} className="text-gray-400" />
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="text-sm outline-none bg-transparent text-gray-700 cursor-pointer"
              >
                <option value="all">All Staff</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">
              Loading reviewed applications…
            </p>
          </div>
        ) : (
          /* Two-column layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ── PASS Column ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle size={18} className="text-green-500" />
                <h2 className="font-black text-green-800 text-sm uppercase tracking-wide">
                  ✅ Qualified Applications
                </h2>
                <span className="ml-auto bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                  {passApps.length}
                </span>
              </div>

              {passApps.length === 0 ? (
                <EmptyState isPass={true} />
              ) : (
                passApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    navigate={navigate}
                    onAction={(a, action) =>
                      setConfirmTarget({ app: a, action })
                    }
                  />
                ))
              )}
            </div>

            {/* ── REJECT Column ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <XCircle size={18} className="text-red-500" />
                <h2 className="font-black text-red-800 text-sm uppercase tracking-wide">
                  ❌ not Qualified Applications
                </h2>
                <span className="ml-auto bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                  {rejectApps.length}
                </span>
              </div>

              {rejectApps.length === 0 ? (
                <EmptyState isPass={false} />
              ) : (
                rejectApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    navigate={navigate}
                    onAction={(a, action) =>
                      setConfirmTarget({ app: a, action })
                    }
                  />
                ))
              )}
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && apps.length > 0 && (
          <p className="text-center text-sm text-gray-400 py-4">
            No results match your search or filter.
          </p>
        )}

        {!loading && (
          <p className="text-right text-xs text-gray-400">
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{apps.length}</strong> reviewed applications
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
