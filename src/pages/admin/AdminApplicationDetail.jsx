// src/pages/admin/AdminApplicationDetail.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";
import {
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Eye,
  ArrowLeft,
} from "lucide-react";

// ─── Helper Components ───────────────────────────────────────────────────────
const Section = ({ icon, title, children }) => (
  <div className="mb-8">
    <h2 className="text-xs font-bold text-gray-700 mb-4 pb-2 border-b-2 border-orange-200 uppercase tracking-widest flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
    {children}
  </div>
);

const Field = ({ label, value, span = "" }) => (
  <div className={span}>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
      {label}
    </p>
    <p className="text-sm font-medium text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 min-h-[36px]">
      {value || <span className="text-gray-400 italic">—</span>}
    </p>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-300",
      icon: "⏳",
    },
    under_review: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      border: "border-blue-300",
      icon: "🔍",
    },
    approved: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-300",
      icon: "✅",
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
      icon: "❌",
    },
    for_release: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      border: "border-purple-300",
      icon: "📤",
    },
    released: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-300",
      icon: "✓",
    },
  };
  const s = map[status] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    icon: "❓",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${s.bg} ${s.text} ${s.border}`}
    >
      {s.icon} {status?.replace(/_/g, " ").toUpperCase()}
    </span>
  );
};

const ImageModal = ({ src, label, onClose }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="relative max-w-4xl w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute -top-10 right-0 text-white text-sm font-bold bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg"
      >
        ✕ Close
      </button>
      <p className="text-white text-xs font-semibold mb-2 text-center uppercase tracking-wide">
        {label}
      </p>
      <img
        src={src}
        alt={label}
        className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
      />
    </div>
  </div>
);

const DocCard = ({ label, url }) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (!url)
    return (
      <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-xs text-center px-2">
        <span className="text-2xl mb-1">📄</span>
        <span className="font-medium text-gray-500 text-xs mb-1">{label}</span>
        <span className="italic">Not uploaded</span>
      </div>
    );

  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
  const isPdf = /\.pdf(\?|$)/i.test(url);

  return (
    <>
      {modalOpen && isImage && (
        <ImageModal
          src={url}
          label={label}
          onClose={() => setModalOpen(false)}
        />
      )}
      <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition bg-white">
        <div
          className="relative h-36 bg-gray-100 flex items-center justify-center cursor-pointer group"
          onClick={() => isImage && setModalOpen(true)}
        >
          {isImage ? (
            <>
              <img
                src={url}
                alt={label}
                className="w-full h-full object-cover group-hover:opacity-90 transition"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="hidden absolute inset-0 flex-col items-center justify-center text-gray-400 text-xs">
                <span className="text-3xl">🖼️</span>
                <span>Image unavailable</span>
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white font-bold text-xs bg-black bg-opacity-60 px-3 py-1.5 rounded-full transition">
                  🔍 Click to enlarge
                </span>
              </div>
            </>
          ) : isPdf ? (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl">📑</span>
              <span className="text-xs mt-1">PDF Document</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl">📄</span>
              <span className="text-xs mt-1">File</span>
            </div>
          )}
        </div>
        <div className="px-3 py-2 bg-white border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-600 leading-tight mb-1 line-clamp-2">
            {label}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            🔗 Open / Download
          </a>
        </div>
      </div>
    </>
  );
};

// ─── Notification Templates ─────────────────────────────────────────────────
const STATUS_NOTIF = {
  under_review: {
    title: "Application Under Review 🔍",
    message:
      "Your franchise application is now being reviewed by the admin. You will be notified of the result shortly.",
    type: "status_under_review",
  },
  approved: {
    title: "Application Approved ✅",
    message: "Congratulations! Your franchise application has been approved.",
    type: "status_approved",
  },
  rejected: {
    title: "Application Rejected ❌",
    message:
      "We regret to inform you that your franchise application has been rejected.",
    type: "status_rejected",
  },
  for_release: {
    title: "Franchise Ready for Release 📤",
    message:
      "Your franchise documents are ready for release. Please visit the Municipal Hall during office hours to claim your franchise permit.",
    type: "status_for_release",
  },
  released: {
    title: "Franchise Released ✓",
    message:
      "Your franchise permit has been successfully released. Please keep it safe and ensure compliance with all regulations.",
    type: "status_released",
  },
};

const addYears = (dateStr, years) => {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
};

const todayStr = () => new Date().toISOString().split("T")[0];

// ─── Insert Notification ───────────────────────────────────────────────────
// FIX: dedup_key no longer includes Date.now() — it is now a stable
//      application+type key so the DB UNIQUE INDEX actually prevents
//      duplicates.  If the same notification already exists we treat it
//      as a success (idempotent).  Also accepts senderId so the admin's
//      identity is recorded.
async function insertNotification({
  recipientId,
  recipientType,
  senderId, // ← admin user id
  senderType,
  applicationId,
  notificationType,
  title,
  message,
}) {
  // Stable dedup key: one notification per application per status transition
  const dedupKey = `${applicationId}_${notificationType}`;

  const payload = {
    recipient_id: recipientId, // FK → profiles
    recipient_type: recipientType, // 'applicant'
    sender_id: senderId ?? null, // FK → profiles (admin)
    sender_type: senderType, // 'admin'
    application_id: applicationId, // FK → applications
    notification_type: notificationType,
    title,
    message,
    is_read: false,
    dedup_key: dedupKey,
  };

  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation → notification already sent for this transition
    // Treat as success so the admin doesn't see a false warning.
    if (error.code === "23505") {
      console.info(
        `[insertNotification] Duplicate suppressed for key: ${dedupKey}`,
      );
      return { success: true, duplicate: true };
    }
    console.error("[insertNotification] Failed:", error);
    return { success: false, error };
  }

  console.log("[insertNotification] Inserted notification:", data?.id);
  return { success: true, id: data?.id };
}

// ─── Status Flow Logic ─────────────────────────────────────────────────────
const STATUS_FLOW = {
  pending: {
    allowedNext: ["under_review", "rejected"],
    locked: false,
    description: "Initial application state - awaiting review",
  },
  under_review: {
    allowedNext: ["approved", "rejected"],
    locked: false,
    description: "Application is being reviewed by admin",
  },
  approved: {
    allowedNext: ["for_release"],
    locked: true,
    description:
      "Approved - franchise record created, can only move to release",
  },
  rejected: {
    allowedNext: [],
    locked: true,
    description: "Final state - application rejected, cannot be changed",
  },
  for_release: {
    allowedNext: ["released"],
    locked: true,
    description: "Documents ready for pickup at Municipal Hall",
  },
  released: {
    allowedNext: [],
    locked: true,
    description: "Final state - permit has been claimed by applicant",
  },
};

const canTransitionTo = (currentStatus, targetStatus) => {
  const flow = STATUS_FLOW[currentStatus];
  if (!flow) return false;
  return flow.allowedNext.includes(targetStatus);
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function AdminApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [showRemarkBox, setShowRemarkBox] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [notifWarning, setNotifWarning] = useState("");
  const [releaseDate, setReleaseDate] = useState(todayStr());
  const [releasedTo, setReleasedTo] = useState("");

  // FIX: capture admin user id so it can be stored as sender_id in notifications
  const adminIdRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) adminIdRef.current = user.id;
      fetchApplication();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchApplication = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select(`*, profiles!applications_applicant_id_fkey(full_name, email)`)
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      setApp(data);
      setAdminRemarks(data.admin_remarks || "");
      setReleasedTo(
        data.details?.franchise_owner || data.profiles?.full_name || "",
      );
    } catch (err) {
      setError("Failed to load application: " + err.message);
    }
    setLoading(false);
  };

  const initiateStatusChange = (newStatus) => {
    setError("");
    setSuccessMsg("");
    setNotifWarning("");

    if (!canTransitionTo(app.status, newStatus)) {
      setError(
        `Cannot change from "${app.status}" to "${newStatus}". Invalid status transition.`,
      );
      return;
    }

    setPendingStatus(newStatus);
    setShowRemarkBox(true);
  };

  // ─── Sync Franchise Record ────────────────────────────────────────────────
  const syncFranchiseRecord = async (application) => {
    const d = application.details || {};
    const isRenewal = application.type === "renewal";
    const today = todayStr();
    const newExpiry = addYears(today, 3);

    const plateNumber = (d.plate_no || "").toUpperCase();
    const ownerName =
      d.franchise_owner || application.profiles?.full_name || "";

    // Guard: plate_number is NOT NULL in schema
    if (!plateNumber) {
      console.warn(
        "[syncFranchiseRecord] Skipped: plate_number is empty in application details.",
      );
      return { skipped: true };
    }

    const payload = {
      owner_name: ownerName,
      plate_number: plateNumber,
      date_issued: today,
      expiration_date: newExpiry,
      status: "active",
      applicant_id: application.applicant_id,
    };

    if (isRenewal && d.franchise_number) {
      // Update existing franchise by franchise_number
      const { error: upErr } = await supabase
        .from("franchises")
        .update(payload)
        .eq("franchise_number", d.franchise_number.toUpperCase());

      if (upErr) {
        console.warn("Franchise update failed, trying insert:", upErr.message);
        // Fallback: insert if the record doesn't exist yet
        const { error: insErr } = await supabase.from("franchises").insert([
          {
            ...payload,
            franchise_number: d.franchise_number.toUpperCase(),
          },
        ]);
        if (insErr) {
          console.error("Franchise insert fallback error:", insErr.message);
          return { error: insErr };
        }
      }
    } else {
      // New registration: upsert franchise record
      const franchiseNumber = (
        d.franchise_number ||
        d.control_number ||
        `TRIC-${Date.now().toString().slice(-6)}`
      ).toUpperCase();

      const { error: upsErr } = await supabase
        .from("franchises")
        .upsert([{ ...payload, franchise_number: franchiseNumber }], {
          onConflict: "franchise_number",
        });

      if (upsErr) {
        // If conflict is on plate_number try updating instead
        if (upsErr.code === "23505") {
          const { error: upByPlate } = await supabase
            .from("franchises")
            .update({ ...payload, franchise_number: franchiseNumber })
            .eq("plate_number", plateNumber);
          if (upByPlate) {
            console.error(
              "Franchise update-by-plate error:",
              upByPlate.message,
            );
            return { error: upByPlate };
          }
        } else {
          console.error("Franchise upsert error:", upsErr.message);
          return { error: upsErr };
        }
      }
    }

    return { success: true };
  };

  // ─── Confirm Status Change ────────────────────────────────────────────────
  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    setStatusUpdating(true);
    setError("");
    setNotifWarning("");

    try {
      const updatePayload = {
        status: pendingStatus,
        admin_remarks: adminRemarks,
      };

      // Add release metadata if marking as released
      if (pendingStatus === "released") {
        updatePayload.release_date = releaseDate;
        updatePayload.released_to = releasedTo;
      }

      // 1. Update application status
      const { error: updateError } = await supabase
        .from("applications")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Sync franchise record if approved
      if (pendingStatus === "approved") {
        const syncResult = await syncFranchiseRecord(app);
        if (syncResult?.error) {
          setNotifWarning(
            `⚠️ Application approved but franchise record could not be created/updated: ${syncResult.error.message}. Please create it manually in the Franchises panel.`,
          );
        }
      }

      // 3. Update franchise record when marking as released
      if (pendingStatus === "released") {
        const d = app.details || {};
        const franchiseNumber = (
          d.franchise_number ||
          d.control_number ||
          ""
        ).toUpperCase();

        if (franchiseNumber) {
          await supabase
            .from("franchises")
            .update({
              status: "active",
              release_date: releaseDate,
              released_to: releasedTo,
            })
            .eq("franchise_number", franchiseNumber);
        }
      }

      // 4. Build & insert notification
      const template = STATUS_NOTIF[pendingStatus];
      if (template && app?.applicant_id) {
        const extraNote = adminRemarks.trim()
          ? ` Admin note: "${adminRemarks.trim()}"`
          : "";

        let finalMessage = template.message + extraNote;

        // Customise message per status
        if (pendingStatus === "approved") {
          const expiry = addYears(todayStr(), 3);
          finalMessage =
            `Congratulations! Your franchise application has been approved. ` +
            `Your franchise is now active and valid until ${new Date(
              expiry,
            ).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}.` +
            (extraNote || "");
        } else if (pendingStatus === "for_release") {
          finalMessage =
            `Your franchise documents are ready for release. Please visit the Municipal Hall, ` +
            `San Jose, Occidental Mindoro during office hours (8:00 AM - 5:00 PM, Monday to Friday) ` +
            `to claim your franchise permit. Please bring a valid ID.` +
            (extraNote || "");
        } else if (pendingStatus === "released") {
          finalMessage =
            `Your franchise permit has been successfully released on ${new Date(
              releaseDate,
            ).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}. ` +
            `Please keep it safe and ensure compliance with all regulations. Thank you for your cooperation.` +
            (extraNote || "");
        }

        // FIX: pass senderId (admin's user id) and use stable dedup_key
        const result = await insertNotification({
          recipientId: app.applicant_id,
          recipientType: "applicant",
          senderId: adminIdRef.current, // ← admin user id now recorded
          senderType: "admin",
          applicationId: id,
          notificationType: template.type,
          title: template.title,
          message: finalMessage,
        });

        if (!result.success) {
          setNotifWarning(
            `⚠️ Status was updated but the notification could not be sent: ` +
              `${result.error?.message || "unknown error"}. ` +
              `The applicant may not be aware of this change. Please notify them manually.`,
          );
        }
        // result.duplicate === true → already notified, silently ignore
      }

      // 5. Update local state to reflect changes immediately
      setApp((prev) => ({
        ...prev,
        status: pendingStatus,
        admin_remarks: adminRemarks,
        release_date:
          pendingStatus === "released" ? releaseDate : prev.release_date,
        released_to:
          pendingStatus === "released" ? releasedTo : prev.released_to,
      }));
      setShowRemarkBox(false);
      setPendingStatus("");

      let extra = "";
      if (pendingStatus === "approved") {
        extra = ` Franchise expires ${addYears(todayStr(), 3)}.`;
      } else if (pendingStatus === "for_release") {
        extra = ` Documents ready for applicant pickup.`;
      } else if (pendingStatus === "released") {
        extra = ` Released on ${new Date(releaseDate).toLocaleDateString("en-PH")}.`;
      }

      setSuccessMsg(
        `✅ Status updated to "${pendingStatus.replace(/_/g, " ")}" and applicant notified.${extra}`,
      );
    } catch (err) {
      setError("Status update failed: " + err.message);
    }
    setStatusUpdating(false);
  };

  // ── Loading / Error States ─────────────────────────────────────────────────
  if (loading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-orange-500 font-semibold text-sm gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <span>Loading application details…</span>
        </div>
      </AdminLayout>
    );

  if (error && !app)
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto mt-10 bg-red-50 border border-red-300 text-red-700 p-6 rounded-xl text-sm">
          <p className="font-bold mb-1 flex items-center gap-2">
            <XCircle size={18} /> Error
          </p>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
        </div>
      </AdminLayout>
    );

  if (!app) return null;

  const d = app.details || {};
  const docs = d.documents || {};
  const isRenewal = app.type === "renewal";
  const profile = app.profiles || {};
  const currentFlow = STATUS_FLOW[app.status] || {};

  const officialDocs = [
    { label: "Latest O.R. (Official Receipt) – LTO", key: "or_latest" },
    { label: "Certificate of Registration (C.R.) – LTO", key: "cr" },
    { label: "Cedula (Updated)", key: "cedula" },
    { label: "Police Clearance", key: "police_clearance" },
    { label: "Barangay Residency (Updated)", key: "barangay_residency" },
    { label: "Voter's Certification – COMELEC", key: "voters_cert" },
    { label: "Stencil ng Motor (Engine / Chassis)", key: "stencil_motor" },
  ];

  const tricyclePhotos = [
    { label: "Tricycle Condition (Overall)", key: "tricycle_condition" },
    { label: "Left Signal Light", key: "left_signal" },
    { label: "Right Signal Light", key: "right_signal" },
    { label: "Head Light", key: "head_light" },
    { label: "Tail Light", key: "tail_light" },
    { label: "Ilaw sa Loob ng Sidecar", key: "ilaw_sidecar" },
    { label: "Basurahan sa Loob ng Sidecar", key: "basurahan_sidecar" },
  ];

  const garagePhotos = [
    { label: "Garage Condition (Overall)", key: "garage_condition" },
    { label: "Garage / Garahe (with vehicle)", key: "garage_photo" },
  ];

  const statusButtons = [
    {
      status: "under_review",
      label: "Mark Under Review",
      color: "bg-blue-500 hover:bg-blue-600",
      icon: <Clock size={16} />,
      description: "Move to review phase",
    },
    {
      status: "approved",
      label: "Approve Application",
      color: "bg-green-500 hover:bg-green-600",
      icon: <CheckCircle2 size={16} />,
      description: "Approve & create franchise",
    },
    {
      status: "rejected",
      label: "Reject Application",
      color: "bg-red-500 hover:bg-red-600",
      icon: <XCircle size={16} />,
      description: "Final rejection",
    },
    {
      status: "for_release",
      label: "Mark For Release",
      color: "bg-purple-500 hover:bg-purple-600",
      icon: <Package size={16} />,
      description: "Documents ready for pickup",
    },
    {
      status: "released",
      label: "Mark as Released",
      color: "bg-gray-700 hover:bg-gray-800",
      icon: <CheckCircle2 size={16} />,
      description: "Permit has been claimed",
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition"
        >
          <ArrowLeft size={16} /> Back to Applications
        </button>

        <div className="bg-white rounded-2xl shadow-md border-t-4 border-orange-500 p-8">
          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-4 border-orange-200 overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {docs.owner_photo ? (
                  <img
                    src={docs.owner_photo}
                    alt="Owner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-gray-300">👤</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-blue-900">
                  {d.franchise_owner || profile.full_name || "—"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isRenewal ? "🔄 Franchise Renewal" : "📋 New Registration"} ·
                  Control No: <strong>{d.control_number || "—"}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Submitted:{" "}
                  {new Date(app.created_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={app.status} />
                {currentFlow.locked && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                    <Lock size={12} /> Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                App ID:{" "}
                <span className="font-mono text-gray-500">{app.id}</span>
              </p>
            </div>
          </div>

          {/* ── Personal Information ── */}
          <Section icon="👤" title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field
                label="Full Name / Franchise Owner"
                value={d.franchise_owner}
                span="lg:col-span-2"
              />
              <Field label="Control Number" value={d.control_number} />
              <Field label="Contact Number" value={d.contact_number} />
              <Field label="Email Address" value={d.email || profile.email} />
              <Field
                label="Address"
                value={d.address}
                span="sm:col-span-2 lg:col-span-3"
              />
              <Field label="Date of Birth" value={d.date_of_birth} />
              <Field label="Place of Birth" value={d.place_of_birth} />
              <Field label="Civil Status" value={d.civil_status} />
              <Field label="Nationality" value={d.nationality} />
            </div>
            {isRenewal && (
              <div className="mt-5 pt-4 border-t border-dashed border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-3">
                  🔄 Renewal-Specific Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field
                    label="Old Owner (if transferred)"
                    value={d.old_owner}
                  />
                  <Field label="Franchise Status" value={d.franchise_status} />
                  <Field label="Franchise Number" value={d.franchise_number} />
                  <Field
                    label="Franchise Expiration"
                    value={d.franchise_expiration}
                  />
                </div>
              </div>
            )}
          </Section>

          {/* ── Motorcycle Information ── */}
          <Section icon="🏍️" title="Motorcycle Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Make (Brand)" value={d.make} span="sm:col-span-2" />
              <Field label="Color" value={d.color} />
              <Field label="Motor / Engine Number" value={d.motor_no} />
              <Field label="Chassis Number" value={d.chassis_no} />
              <Field label="Plate Number" value={d.plate_no} />
              <Field label="Classification" value={d.classification} />
            </div>
          </Section>

          {/* ── Documents ── */}
          <Section icon="📎" title="Uploaded Documents & Photos">
            <p className="text-xs text-gray-400 italic mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              📌 Click any image to enlarge. Use "Open / Download" to view the
              original file.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {officialDocs.map((doc) => (
                <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />
              ))}
            </div>
          </Section>

          <Section icon="🔧" title="Tricycle Condition Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tricyclePhotos.map((doc) => (
                <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />
              ))}
            </div>
          </Section>

          <Section icon="🏠" title="Garage Condition Photos">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {garagePhotos.map((doc) => (
                <DocCard key={doc.key} label={doc.label} url={docs[doc.key]} />
              ))}
            </div>
          </Section>

          {d.remarks && (
            <Section icon="📝" title="Applicant Remarks / Notes">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line">
                {d.remarks}
              </div>
            </Section>
          )}

          {app.admin_remarks && (
            <Section icon="🗒️" title="Admin Remarks (Previous)">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800 whitespace-pre-line">
                {app.admin_remarks}
              </div>
            </Section>
          )}

          {/* Release Information */}
          {app.status === "released" && (
            <Section icon="✓" title="Release Information">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Release Date"
                    value={
                      app.release_date
                        ? new Date(app.release_date).toLocaleDateString("en-PH")
                        : "—"
                    }
                  />
                  <Field label="Released To" value={app.released_to || "—"} />
                </div>
              </div>
            </Section>
          )}

          {/* ── Admin Actions ── */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              ⚙️ Admin Actions
            </p>

            {successMsg && (
              <div className="bg-green-50 border border-green-300 text-green-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {notifWarning && (
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-xl px-4 py-3 mb-4">
                {notifWarning}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Status Flow Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-xs text-blue-700">
              <p className="font-bold mb-2 flex items-center gap-1">
                <Eye size={14} /> Status Flow Information
              </p>
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Current Status:</span>{" "}
                  {currentFlow.description}
                </div>
                {currentFlow.allowedNext &&
                  currentFlow.allowedNext.length > 0 && (
                    <div>
                      <span className="font-semibold">Available Actions:</span>{" "}
                      {currentFlow.allowedNext
                        .map((s) => s.replace(/_/g, " "))
                        .join(", ")}
                    </div>
                  )}
                {currentFlow.locked && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Lock size={12} />
                    <span className="font-semibold">
                      This status is locked and can only transition to specific
                      states.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contextual Guidelines */}
            {canTransitionTo(app.status, "approved") && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-xs text-green-700">
                <p className="font-bold mb-1">✅ Approval Auto-Actions</p>
                <ul className="list-disc list-inside space-y-0.5 text-green-600">
                  <li>
                    Approving automatically <strong>creates or updates</strong>{" "}
                    the franchise record.
                  </li>
                  <li>
                    Franchise validity is set to <strong>3 years</strong> from
                    today.
                  </li>
                  <li>
                    For renewals, the existing record is <strong>reset</strong>{" "}
                    to a new 3-year term.
                  </li>
                  <li>
                    The applicant receives an{" "}
                    <strong>approval notification</strong> with their expiry
                    date.
                  </li>
                  <li>
                    After approval, you can mark it as{" "}
                    <strong>"For Release"</strong> when documents are ready.
                  </li>
                </ul>
              </div>
            )}

            {canTransitionTo(app.status, "for_release") && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-5 text-xs text-purple-700">
                <p className="font-bold mb-1">📤 For Release Guidelines</p>
                <ul className="list-disc list-inside space-y-0.5 text-purple-600">
                  <li>
                    Mark as "For Release" when all documents are{" "}
                    <strong>prepared and ready for pickup</strong>.
                  </li>
                  <li>
                    Applicant will be notified to visit the Municipal Hall.
                  </li>
                  <li>
                    After the applicant claims the permit, mark it as{" "}
                    <strong>"Released"</strong>.
                  </li>
                </ul>
              </div>
            )}

            {/* Remark Box */}
            {showRemarkBox && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  {pendingStatus === "released"
                    ? "Release Details"
                    : "Add a remark"}{" "}
                  before confirming{" "}
                  <span className="capitalize text-orange-600 font-bold">
                    {pendingStatus?.replace(/_/g, " ")}
                  </span>
                  :
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  This information will be included in the notification sent to
                  the applicant.
                </p>

                {pendingStatus === "released" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Release Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        max={todayStr()}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Released To <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={releasedTo}
                        onChange={(e) => setReleasedTo(e.target.value)}
                        placeholder="Name of person who claimed"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                )}

                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder={
                    pendingStatus === "released"
                      ? "Optional release notes…"
                      : "Optional admin remarks / reason…"
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-3"
                />

                <div className="flex gap-3">
                  <button
                    onClick={confirmStatusChange}
                    disabled={
                      statusUpdating ||
                      (pendingStatus === "released" &&
                        (!releaseDate || !releasedTo))
                    }
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {statusUpdating ? (
                      <>⏳ Updating…</>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Confirm —{" "}
                        {pendingStatus?.replace(/_/g, " ").toUpperCase()}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowRemarkBox(false);
                      setPendingStatus("");
                      setReleaseDate(todayStr());
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {statusButtons.map((btn) => {
                const canTransition = canTransitionTo(app.status, btn.status);
                const isCurrent = app.status === btn.status;
                const isDisabled =
                  !canTransition ||
                  isCurrent ||
                  statusUpdating ||
                  showRemarkBox;

                return (
                  <button
                    key={btn.status}
                    onClick={() => initiateStatusChange(btn.status)}
                    disabled={isDisabled}
                    title={
                      !canTransition && !isCurrent
                        ? `Cannot transition from ${app.status} to ${btn.status}`
                        : btn.description
                    }
                    className={`${btn.color} text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2`}
                  >
                    {btn.icon}
                    {btn.label}
                    {isCurrent && (
                      <span className="ml-1 text-xs font-normal opacity-75">
                        (current)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">
                <strong>Current Status:</strong>{" "}
                <StatusBadge status={app.status} />
              </p>
              <p className="text-xs text-gray-400">
                {currentFlow.description || "Status information unavailable"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
