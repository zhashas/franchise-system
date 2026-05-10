// src/pages/staff/StaffApplicationDetail.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import StaffLayout from "../../components/StaffLayout";
import {
  X,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Image,
  ExternalLink,
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

const statusColor = (s) => {
  if (s === "approved") return "bg-green-100 text-green-700 border-green-200";
  if (s === "rejected") return "bg-red-100 text-red-700 border-red-200";
  if (s === "under_review") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "for_release")
    return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
};

// ── Known detail keys to display in order ────────────────────────────────────
const VEHICLE_KEYS = [
  { key: "franchise_owner", label: "Owner Name" },
  { key: "address", label: "Address" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "civil_status", label: "Civil Status" },
  { key: "nationality", label: "Nationality" },
  { key: "contact_number", label: "Contact Number" },
  { key: "email", label: "Email" },
  { key: "make", label: "Make / Brand" },
  { key: "color", label: "Color" },
  { key: "motor_no", label: "Engine Number" },
  { key: "chassis_no", label: "Chassis Number" },
  { key: "plate_no", label: "Plate Number" },
  { key: "classification", label: "Classification" },
  { key: "franchise_number", label: "Franchise Number" },
  { key: "control_number", label: "Control Number" },
  { key: "franchise_expiration", label: "Franchise Expiration" },
  { key: "franchise_status", label: "Franchise Status" },
  { key: "remarks", label: "Remarks" },
];

// Keys to skip entirely (handled separately or irrelevant to display)
const SKIP_KEYS = new Set([
  "documents",
  "old_owner",
  "place_of_birth",
  "franchise_status",
]);

// ─── Document Viewer ──────────────────────────────────────────────────────────
function DocumentViewer({ documents }) {
  const [preview, setPreview] = useState(null);

  if (!documents || Object.keys(documents).length === 0) return null;

  const DOC_LABELS = {
    or_latest: "Official Receipt (LTO)",
    cr: "Certificate of Registration",
    cedula: "Cedula",
    police_clearance: "Police Clearance",
    barangay_residency: "Barangay Residency",
    voters_cert: "Voter's Certification",
    stencil_motor: "Stencil Motor",
    tricycle_condition: "Tricycle Condition",
    left_signal: "Left Signal Light",
    right_signal: "Right Signal Light",
    head_light: "Head Light",
    tail_light: "Tail Light",
    ilaw_sidecar: "Ilaw Sidecar",
    basurahan_sidecar: "Basurahan Sidecar",
    garage_condition: "Garage Condition",
    garage_photo: "Garage with Tricycle",
    owner_photo: "Owner Photo",
  };

  const entries = Object.entries(documents).filter(([, v]) => v);

  return (
    <>
      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-gray-800 text-sm">{preview.label}</p>
              <div className="flex items-center gap-2">
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-500 hover:underline font-semibold"
                >
                  <ExternalLink size={13} /> Open
                </a>
                <button
                  onClick={() => setPreview(null)}
                  className="text-gray-400 hover:text-gray-700 ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-gray-50">
              {preview.isImage ? (
                <img
                  src={preview.url}
                  alt={preview.label}
                  className="max-w-full max-h-[60vh] object-contain rounded-xl"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    PDF — Cannot preview inline
                  </p>
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition"
                  >
                    Open PDF →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map(([key, url]) => {
          const label = DOC_LABELS[key] || key.replace(/_/g, " ");
          const isImage =
            /\.(jpg|jpeg|png|webp|gif)$/i.test(url) ||
            url.includes("image") ||
            !url.includes(".pdf");

          return (
            <button
              key={key}
              onClick={() => setPreview({ url, label, isImage })}
              className="group relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 hover:shadow-md transition-all text-left"
            >
              {isImage ? (
                <div className="h-24 bg-gray-100 overflow-hidden">
                  <img
                    src={url}
                    alt={label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div
                    className="hidden w-full h-full items-center justify-center"
                    style={{ display: "none" }}
                  >
                    <Image size={24} className="text-gray-300" />
                  </div>
                </div>
              ) : (
                <div className="h-24 bg-blue-50 flex items-center justify-center">
                  <FileText size={28} className="text-blue-300" />
                </div>
              )}
              <div className="p-2">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide leading-tight">
                  {label}
                </p>
                <p className="text-[9px] text-orange-500 font-semibold mt-0.5">
                  Click to preview
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({
  recommendation,
  applicantName,
  remarks,
  onConfirm,
  onCancel,
  loading,
}) {
  const isPass = recommendation === "pass";
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${
          isPass ? "border-green-500" : "border-red-500"
        }`}
      >
        <div
          className={`px-6 py-5 flex items-center gap-4 ${
            isPass ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-3xl ${
              isPass ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {isPass ? "✅" : "❌"}
          </div>
          <div className="flex-1">
            <h2
              className={`text-base font-extrabold ${
                isPass ? "text-green-800" : "text-red-800"
              }`}
            >
              {isPass ? "Recommend for Approval?" : "Recommend for Rejection?"}
            </h2>
            <p
              className={`text-xs mt-0.5 ${
                isPass ? "text-green-600" : "text-red-500"
              }`}
            >
              Your recommendation will be sent to Admin
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Applicant</span>
              <span className="font-bold text-gray-900">{applicantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Recommendation</span>
              <span
                className={`font-bold ${
                  isPass ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPass ? "✅ PASS" : "❌ REJECT"}
              </span>
            </div>
          </div>

          {remarks && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Your Remarks
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{remarks}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <AlertTriangle size={12} />
              <span>Important:</span>
            </div>
            <p>• This recommendation cannot be changed after submission</p>
            <p>• Admin will make the final approval/rejection decision</p>
            <p>• The application status will NOT change immediately</p>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition shadow disabled:opacity-60 text-white ${
              isPass
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {loading
              ? "Submitting…"
              : `Confirm ${isPass ? "Pass" : "Reject"} Recommendation`}
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

// ─── Success Toast ─────────────────────────────────────────────────────────────
function SuccessToast({ onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 bg-white border border-green-200 shadow-2xl rounded-2xl px-5 py-4 flex items-start gap-3 max-w-sm animate-in slide-in-from-right">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-xl">
        ✅
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-900 text-sm">Recommendation Sent!</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          Your recommendation has been sent to Admin for final decision.
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-300 hover:text-gray-500 mt-0.5"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ─── Detail Row ────────────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] break-words">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
          {title}
        </p>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StaffApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [remarks, setRemarks] = useState("");
  const [pendingRec, setPendingRec] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ── Fetch application ──────────────────────────────────────────────────────
  const loadApp = useCallback(
    async (cancelled = { current: false }) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled.current) setStaffId(user?.id || null);

        const { data, error } = await supabase
          .from("applications")
          .select(
            `
            *,
            profiles!applications_applicant_id_fkey(full_name, email, phone),
            reviewer:profiles!applications_reviewed_by_staff_id_fkey(full_name)
            `,
          )
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!cancelled.current) setApp(data);
      } catch (err) {
        if (!cancelled.current) setError(err.message);
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const cancelled = { current: false };
    loadApp(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [loadApp]);

  // ── Submit recommendation ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!pendingRec || !staffId) return;
    setSubmitting(true);

    try {
      // 1. Update application with staff recommendation
      const { error: updateErr } = await supabase
        .from("applications")
        .update({
          staff_recommendation: pendingRec,
          staff_remarks: remarks.trim() || null,
          reviewed_by_staff_id: staffId,
          staff_reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // 2. Get staff name for notification
      const { data: staffProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", staffId)
        .single();

      const staffName = staffProfile?.full_name || "Staff";
      const applicantName = app.profiles?.full_name || "Applicant";
      const recLabel = pendingRec === "pass" ? "PASS ✅" : "REJECT ❌";

      // 3. Notify all admins
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const notifRows = admins.map((admin) => ({
          recipient_id: admin.id,
          recipient_type: "admin",
          sender_id: staffId,
          sender_type: "staff",
          application_id: id,
          notification_type: "staff_review",
          title: `📋 Staff Review: ${applicantName}`,
          message: `${staffName} recommends ${recLabel} for ${applicantName}'s application.${
            remarks.trim() ? ` Remarks: "${remarks.trim()}"` : ""
          }`,
          dedup_key: `staff_review_${id}_${staffId}_${admin.id}`,
        }));

        const { error: notifErr } = await supabase
          .from("notifications")
          .upsert(notifRows, {
            onConflict: "dedup_key",
            ignoreDuplicates: false,
          });

        if (notifErr) console.warn("Notification upsert:", notifErr.message);
      }

      // 4. Refresh
      const cancelled = { current: false };
      await loadApp(cancelled);
      setPendingRec(null);
      setRemarks("");
      setShowToast(true);
    } catch (err) {
      alert("Failed to submit recommendation: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const alreadyReviewed = !!app?.staff_recommendation;
  const reviewedByMe = alreadyReviewed && app?.reviewed_by_staff_id === staffId;

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading application…</p>
        </div>
      </StaffLayout>
    );
  }

  if (error || !app) {
    return (
      <StaffLayout>
        <div className="text-center py-24">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-500 text-sm">{error || "Not found"}</p>
          <button
            onClick={() => navigate("/staff/applications")}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold"
          >
            ← Back
          </button>
        </div>
      </StaffLayout>
    );
  }

  const d = app.details || {};
  const documents = d.documents || {};

  return (
    <StaffLayout>
      {pendingRec && (
        <ConfirmModal
          recommendation={pendingRec}
          applicantName={app.profiles?.full_name || "Applicant"}
          remarks={remarks}
          loading={submitting}
          onConfirm={handleSubmit}
          onCancel={() => setPendingRec(null)}
        />
      )}
      {showToast && <SuccessToast onClose={() => setShowToast(false)} />}

      <div className="max-w-3xl mx-auto space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate("/staff/applications")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 font-semibold transition"
        >
          <ChevronLeft size={16} /> Back to Applications
        </button>

        {/* Header */}
        <div className="rounded-xl p-5 border bg-orange-50 border-orange-200">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {app.profiles?.full_name || "Unknown Applicant"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {app.profiles?.email}
                {app.profiles?.phone && ` · ${app.profiles.phone}`}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border ${statusColor(app.status)}`}
                >
                  {app.status?.replace(/_/g, " ")}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium capitalize">
                  {app.type}
                </span>
                {d.franchise_number && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-bold">
                    {d.franchise_number}
                  </span>
                )}
                {d.control_number && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-bold">
                    {d.control_number}
                  </span>
                )}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-3 py-1.5 rounded-full font-semibold">
              👁️ View Only — Status changes require Admin
            </span>
          </div>
        </div>

        {/* Already reviewed banner */}
        {alreadyReviewed && (
          <div
            className={`rounded-xl p-4 border flex items-start gap-3 ${
              app.staff_recommendation === "pass"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="text-2xl">
              {app.staff_recommendation === "pass" ? "✅" : "❌"}
            </div>
            <div>
              <p
                className={`font-bold text-sm ${
                  app.staff_recommendation === "pass"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {reviewedByMe
                  ? "You reviewed this application"
                  : `Reviewed by ${app.reviewer?.full_name || "Staff"}`}{" "}
                — {fmtDateTime(app.staff_reviewed_at)}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  app.staff_recommendation === "pass"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                Recommendation:{" "}
                <strong>{app.staff_recommendation?.toUpperCase()}</strong>
                {app.staff_remarks && ` — "${app.staff_remarks}"`}
              </p>
              {app.admin_processed && (
                <p className="text-xs mt-1 text-gray-500 font-semibold">
                  ✔ Admin has processed this recommendation
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Personal Info ── */}
        <SectionCard title="Applicant Information">
          <DetailRow label="Full Name" value={app.profiles?.full_name} />
          <DetailRow label="Email" value={app.profiles?.email} />
          <DetailRow label="Phone" value={app.profiles?.phone} />
          <DetailRow
            label="Type"
            value={
              app.type
                ? app.type.charAt(0).toUpperCase() + app.type.slice(1)
                : "—"
            }
          />
          <DetailRow label="Status" value={app.status?.replace(/_/g, " ")} />
          <DetailRow
            label="Submitted"
            value={fmtDateTime(app.submitted_at || app.created_at)}
          />
        </SectionCard>

        {/* ── Vehicle & Franchise Details ── */}
        {Object.keys(d).length > 0 && (
          <SectionCard title="Vehicle / Franchise Details">
            {VEHICLE_KEYS.filter(
              ({ key }) => d[key] && !SKIP_KEYS.has(key),
            ).map(({ key, label }) => (
              <DetailRow key={key} label={label} value={String(d[key])} />
            ))}
          </SectionCard>
        )}

        {/* ── Uploaded Documents ── */}
        {Object.keys(documents).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                Uploaded Documents & Photos
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Click any document to preview
              </p>
            </div>
            <div className="p-5">
              <DocumentViewer documents={documents} />
            </div>
          </div>
        )}

        {/* ── Admin Remarks ── */}
        {app.admin_remarks && (
          <SectionCard title="Admin Remarks">
            <div className="py-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {app.admin_remarks}
              </p>
            </div>
          </SectionCard>
        )}

        {/* ── Staff Review Section ── */}
        {!alreadyReviewed && (
          <div className="bg-white border-2 border-orange-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-orange-100 bg-orange-50">
              <p className="text-xs font-black text-orange-600 uppercase tracking-widest">
                📝 Staff Review
              </p>
              <p className="text-xs text-orange-500 mt-1">
                ⚠️ Your recommendation will be sent to Admin for final decision.
                You cannot change application status directly.
              </p>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                  Review Remarks{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add notes about your review — document validity, concerns, observations…"
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPendingRec("pass")}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-sm"
                >
                  <CheckCircle size={16} />
                  Recommend Approval
                </button>
                <button
                  onClick={() => setPendingRec("reject")}
                  className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition shadow-sm"
                >
                  <XCircle size={16} />
                  Recommend Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Awaiting admin decision */}
        {alreadyReviewed && !app.admin_processed && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center gap-3">
            <Clock size={20} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-700">
                Awaiting Admin Decision
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your recommendation has been submitted. Admin will review and
                make the final decision.
              </p>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
