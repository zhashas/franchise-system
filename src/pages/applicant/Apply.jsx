// src/pages/applicant/Apply.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import ApplicantLayout from "../../components/ApplicantLayout";
import { notifyAdmin } from "../../lib/notifications";
import {
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Car,
  Upload,
  Camera,
  Home,
  RefreshCw,
  X,
  ArrowLeft,
  GripVertical,
  ChevronRight,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ─── VALIDATION HELPERS ───────────────────────────────────────────────────────
const PH_MOBILE_RE = /^(\+?63|0)9\d{9}$/;

function validateContactNumber(raw) {
  const v = raw.replace(/[\s\-().]/g, "");
  if (!v) return "Contact number is required.";
  if (!PH_MOBILE_RE.test(v))
    return "Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).";
  return null;
}

const ALNUM_RE = /^[A-Z0-9]+$/;

function validateEngineNumber(raw) {
  const v = raw.trim().toUpperCase();
  if (!v) return "Engine number is required.";
  if (!/^[A-Z0-9\s]+$/.test(raw.trim())) {
    const bad = raw.trim().match(/[^A-Z0-9a-z\s]/);
    if (bad)
      return `Engine number contains invalid character "${bad[0]}". Only A–Z and 0–9 are allowed.`;
    return "Engine number must contain only letters and numbers.";
  }
  if (!ALNUM_RE.test(v))
    return "Engine number must contain only letters (A–Z) and numbers (0–9). No spaces or special characters.";
  if (v.length < 6) return "Engine number is too short (minimum 6 characters).";
  if (v.length > 20)
    return "Engine number is too long (maximum 20 characters).";
  return null;
}

function validateChassisNumber(raw) {
  const v = raw.trim().toUpperCase();
  if (!v) return "Chassis number is required.";
  if (!/^[A-Z0-9\s]+$/.test(raw.trim())) {
    const bad = raw.trim().match(/[^A-Z0-9a-z\s]/);
    if (bad)
      return `Chassis number contains invalid character "${bad[0]}". Only A–Z and 0–9 are allowed.`;
    return "Chassis number must contain only letters and numbers.";
  }
  if (!ALNUM_RE.test(v))
    return "Chassis number must contain only letters (A–Z) and numbers (0–9). No spaces or special characters.";
  if (v.length < 10)
    return "Chassis number is too short (minimum 10 characters).";
  if (v.length > 25)
    return "Chassis number is too long (maximum 25 characters).";
  return null;
}

// ─── FRANCHISE SLOT NUMBER ────────────────────────────────────────────────────
async function getNextFranchiseSlot() {
  try {
    const { data } = await supabase
      .from("franchises")
      .select("franchise_number")
      .order("franchise_number", { ascending: false })
      .limit(1);
    let nextNum = 1;
    if (data && data.length > 0) {
      const raw = data[0].franchise_number || "";
      const match = String(raw).match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    if (nextNum > 5200) throw new Error("All 5200 franchise slots are taken.");
    return `SJ-${String(nextNum).padStart(4, "0")}`;
  } catch (err) {
    console.error("[Franchise Slot]", err);
    return `SJ-${String(Date.now()).slice(-4)}`;
  }
}

// ─── CONTROL NUMBER ───────────────────────────────────────────────────────────
async function generateControlNumber() {
  const year = new Date().getFullYear();
  const prefix = `CN-${year}-`;
  try {
    const { data } = await supabase
      .from("applications")
      .select("details")
      .order("submitted_at", { ascending: false })
      .limit(200);
    let maxSeq = 0;
    if (data) {
      for (const row of data) {
        const cn = row.details?.control_number || "";
        if (cn.startsWith(prefix)) {
          const seq = parseInt(cn.replace(prefix, ""), 10);
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      }
    }
    return `${prefix}${String(maxSeq + 1).padStart(6, "0")}`;
  } catch {
    return `${prefix}${String(Date.now()).slice(-6)}`;
  }
}

// ─── DROPDOWN DATA ────────────────────────────────────────────────────────────
const MAKES = [
  "RUSI",
  "HONDA",
  "KAWASAKI",
  "YAMAHA",
  "SUZUKI",
  "SYM",
  "KYMCO",
  "TVS",
  "SKYGO",
  "RACAL",
];
const COLORS = [
  "Red",
  "Blue",
  "Black",
  "White",
  "Silver",
  "Gray",
  "Green",
  "Yellow",
  "Orange",
  "Brown",
];
const CIVIL_STATUS = ["Single", "Married", "Widowed", "Separated"];
const CLASSIFICATION = [
  { value: "for_hire", label: "For Hire" },
  { value: "not_for_hire", label: "Not for Hire" },
];

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────
function getStatusSteps(app) {
  if (!app) return [];
  const s = app.status;
  const steps = [
    {
      key: "submitted",
      label: "Submitted",
      desc: "Application received",
      icon: "📤",
      done: true,
      active: s === "pending",
    },
    {
      key: "under_review",
      label: "Under Review",
      desc: "Documents being verified",
      icon: "🔍",
      done: [
        "under_review",
        "approved",
        "rejected",
        "for_release",
        "released",
      ].includes(s),
      active: s === "under_review",
    },
    {
      key: "decision",
      label:
        s === "rejected"
          ? "Rejected"
          : ["approved", "for_release", "released"].includes(s)
            ? "Approved"
            : "Pending Decision",
      desc:
        s === "approved"
          ? "Franchise approved!"
          : s === "rejected"
            ? "Application declined"
            : s === "for_release"
              ? "Ready for release"
              : s === "released"
                ? "Permit released"
                : "Awaiting decision",
      icon: ["approved", "for_release", "released"].includes(s)
        ? "✅"
        : s === "rejected"
          ? "❌"
          : "⏳",
      done: ["approved", "rejected", "for_release", "released"].includes(s),
      active: ["approved", "for_release", "released"].includes(s),
      isRejected: s === "rejected",
    },
    {
      key: "release",
      label: s === "released" ? "Released" : "For Release",
      desc: s === "released" ? "Permit claimed" : "Ready to claim",
      icon: s === "released" ? "✓" : "🏛️",
      done: s === "released",
      active: s === "for_release" || s === "released",
      skip: !["for_release", "released"].includes(s),
    },
  ];
  return steps.filter((step) => !step.skip);
}

const statusColor = (status) => {
  const colors = {
    approved: "bg-green-100 text-green-700 border-green-300",
    rejected: "bg-red-100 text-red-700 border-red-300",
    under_review: "bg-blue-100 text-blue-700 border-blue-300",
    for_release: "bg-purple-100 text-purple-700 border-purple-300",
    released: "bg-gray-100 text-gray-700 border-gray-300",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700 border-gray-300";
};

// ─── STATUS BANNER ────────────────────────────────────────────────────────────
function StatusBanner({ status, releaseDate }) {
  if (status === "approved") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-700 font-medium flex items-start gap-2">
        <span className="text-lg flex-shrink-0">✅</span>
        <div>
          <p className="font-bold mb-1">Congratulations!</p>
          <p>
            Your franchise application has been approved. Wait for the "For
            Release" notification.
          </p>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700 font-medium flex items-start gap-2">
        <span className="text-lg flex-shrink-0">❌</span>
        <div>
          <p className="font-bold mb-1">Application Declined</p>
          <p>
            Check your notifications for details. You may contact the office or
            submit a new application.
          </p>
        </div>
      </div>
    );
  }
  if (status === "for_release") {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-700 font-medium flex items-start gap-2">
        <span className="text-lg flex-shrink-0">🏛️</span>
        <div>
          <p className="font-bold mb-1">Ready for Release!</p>
          <p>
            Visit the Municipal Hall (8AM–5PM, Mon–Fri) to claim your permit.
            Bring a valid ID.
          </p>
        </div>
      </div>
    );
  }
  if (status === "released") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 font-medium flex items-start gap-2">
        <span className="text-lg flex-shrink-0">✓</span>
        <div>
          <p className="font-bold mb-1">Permit Released</p>
          <p>
            Released on{" "}
            {releaseDate
              ? new Date(releaseDate).toLocaleDateString("en-PH")
              : "N/A"}
            . Ensure compliance with regulations.
          </p>
        </div>
      </div>
    );
  }
  if (status === "under_review") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 font-medium flex items-start gap-2">
        <span className="text-lg flex-shrink-0">🔍</span>
        <div>
          <p className="font-bold mb-1">Under Review</p>
          <p>
            Our team is verifying your documents. You may be contacted for an
            appointment or additional details.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

// ─── APPLICATION SLOT CARD ────────────────────────────────────────────────────
function ApplicationSlotCard({ slotNumber, app, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Empty slot
  if (!app) {
    return (
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden">
        <div className="px-6 py-5 flex items-center gap-4">
          {/* Slot number badge */}
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-black text-slate-400">
              {slotNumber}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-400">
              Application Slot {slotNumber}
            </p>
            <p className="text-xs text-slate-300 mt-0.5">
              Available — no application submitted
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-wide">
            Empty
          </span>
        </div>
      </div>
    );
  }

  const steps = getStatusSteps(app);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card Header — clickable to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center gap-4 hover:bg-slate-100 transition-colors text-left"
      >
        {/* Slot number badge */}
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-sm font-black text-white">{slotNumber}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-800 capitalize">
              {app.type} Application
            </h3>
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border",
                statusColor(app.status),
              )}
            >
              {app.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
            <Clock size={10} />
            Submitted{" "}
            {new Date(app.created_at).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {app.details?.control_number && (
              <> · CN: {app.details.control_number}</>
            )}
            {app.details?.franchise_number && (
              <> · Franchise #: {app.details.franchise_number}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {expanded ? (
            <ChevronUp size={18} className="text-slate-400" />
          ) : (
            <ChevronDown size={18} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Expandable Body */}
      {expanded && (
        <div className="px-6 py-8 space-y-6">
          {/* Progress Steps */}
          <div>
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <TrendingUp size={12} />
              Application Progress
            </h4>
            <div className="flex items-start justify-between">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const circleCls = !step.done
                  ? "bg-slate-100 text-slate-400 border-2 border-slate-200"
                  : step.isRejected
                    ? "bg-rose-500 text-white shadow-sm"
                    : "bg-blue-600 text-white shadow-sm";
                const lineCls =
                  step.done && !step.isRejected
                    ? "bg-blue-400"
                    : "bg-slate-200";
                const labelCls = !step.done
                  ? "text-slate-400"
                  : step.isRejected
                    ? "text-rose-600"
                    : "text-slate-800";

                return (
                  <div
                    key={step.key}
                    className="flex-1 flex flex-col items-center relative"
                  >
                    {!isLast && (
                      <div
                        className={cn(
                          "absolute top-5 left-1/2 w-full h-1 z-0",
                          lineCls,
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center z-10 text-base flex-shrink-0 transition font-bold",
                        circleCls,
                        step.active ? "ring-4 ring-offset-2 ring-blue-300" : "",
                      )}
                    >
                      {step.done && !step.isRejected ? "✓" : step.icon}
                    </div>
                    <p
                      className={cn(
                        "text-xs font-bold mt-3 text-center leading-tight",
                        labelCls,
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Banner */}
          <StatusBanner status={app.status} releaseDate={app.release_date} />

          {/* Application Details Grid */}
          {app.details && (
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3">
                Application Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Owner", value: app.details.franchise_owner },
                  { label: "Make", value: app.details.make },
                  { label: "Color", value: app.details.color },
                  { label: "Plate No.", value: app.details.plate_no },
                  { label: "Engine No.", value: app.details.motor_no },
                  { label: "Chassis No.", value: app.details.chassis_no },
                ]
                  .filter((d) => d.value)
                  .map((d) => (
                    <div
                      key={d.label}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-100"
                    >
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                        {d.label}
                      </p>
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {d.value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── APPROVED NOTIFICATION CARD ───────────────────────────────────────────────
function ApprovedNotifCard({ notif, onClose, onNavigate }) {
  if (!notif) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-emerald-500 animate-in zoom-in-95">
        <div className="bg-emerald-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-emerald-800 uppercase tracking-wide">
              Application Approved!
            </h2>
            <p className="text-xs text-emerald-600 mt-0.5">
              Your franchise has been approved by the admin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">
              Notification Details
            </p>
            <p className="font-bold text-slate-800 text-sm">{notif.title}</p>
            <p className="text-slate-600 text-xs leading-relaxed mt-1">
              {notif.message}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                Status
              </p>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wide">
                Approved ✓
              </span>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                Date
              </p>
              <p className="text-xs font-bold text-blue-700">
                {new Date(notif.created_at).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
            <p className="font-black mb-1 uppercase tracking-wide">
              📋 Next Steps:
            </p>
            <p>• Visit the Municipal Hall – Business Permits Office</p>
            <p>• Bring a valid ID and any required documents</p>
            <p>• Claim your official Franchise Permit</p>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onNavigate}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition shadow"
          >
            View My Franchises →
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── IMAGE PREVIEW CARD ───────────────────────────────────────────────────────
function ImagePreviewCard({ file, onClose, onFileChange, fileKey }) {
  const inputRef = useRef();
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-bold text-slate-700 truncate">
            {file.name}
          </p>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>
        <img
          src={URL.createObjectURL(file)}
          alt="preview"
          className="w-full max-h-80 object-contain rounded-xl border border-slate-200"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition shadow"
          >
            ✅ Okay
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition shadow"
          >
            🔄 Replace
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            onFileChange(e, fileKey);
            onClose();
          }}
        />
      </div>
    </div>
  );
}

// ─── FILE UPLOAD BOX ──────────────────────────────────────────────────────────
function FileUploadBox({
  label,
  fileKey,
  files,
  onFileChange,
  hasError,
  required = true,
  accept = ".pdf,.jpg,.jpeg,.png",
}) {
  const [preview, setPreview] = useState(false);
  const file = files[fileKey];
  const isImage = file && file.type?.startsWith("image/");

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-600 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div
        className={cn(
          "flex items-center gap-3 p-4 bg-white border rounded-xl hover:border-blue-400 group transition-all cursor-pointer shadow-sm",
          file
            ? "border-blue-400 bg-blue-50/30"
            : hasError
              ? "border-rose-400 bg-rose-50"
              : "border-slate-200",
        )}
        onClick={
          file && isImage
            ? (e) => {
                e.preventDefault();
                setPreview(true);
              }
            : undefined
        }
      >
        <GripVertical size={16} className="text-slate-300" />
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload
              size={18}
              className={
                file
                  ? "text-blue-500"
                  : hasError
                    ? "text-rose-400"
                    : "text-slate-300"
              }
            />
            <span className="text-sm text-slate-600 truncate max-w-[200px]">
              {file ? file.name : "Click to upload"}
            </span>
          </div>
          {!file && (
            <label className="text-xs font-bold text-blue-500 uppercase tracking-widest hover:text-blue-700 cursor-pointer">
              Browse
              <input
                type="file"
                name={fileKey}
                accept={accept}
                onChange={onFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {preview && file && isImage && (
        <ImagePreviewCard
          file={file}
          onClose={() => setPreview(false)}
          fileKey={fileKey}
          onFileChange={(e, key) =>
            onFileChange({ target: { name: key, files: e.target.files } })
          }
        />
      )}

      {file && (
        <label className="mt-1 text-xs text-blue-500 underline cursor-pointer font-semibold block">
          {isImage ? "Click to preview / replace" : "Replace file"}
          <input
            type="file"
            name={fileKey}
            accept={accept}
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      )}

      {hasError && !file && (
        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> This field is required
        </p>
      )}
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  const IconComponent = icon;
  return (
    <div className="flex items-center gap-3 mb-6">
      {IconComponent && (
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
          <IconComponent size={20} className="text-slate-600" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
  );
}

// ─── STEP BAR ─────────────────────────────────────────────────────────────────
function StepBar({ step, total, labels }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              i < step ? "bg-blue-600" : "bg-slate-200",
            )}
          />
        ))}
        <span className="ml-2 text-xs text-slate-400 whitespace-nowrap font-bold">
          Step {step}/{total}
        </span>
      </div>
      {labels && (
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">
          {labels[step - 1]}
        </p>
      )}
    </div>
  );
}

// ─── FRANCHISE PICKER (RENEWAL) ───────────────────────────────────────────────
function FranchisePicker({ franchises, selected, onSelect }) {
  const today = new Date();
  const eligible = franchises.filter((f) => {
    if (f.status !== "active" || !f.expiration_date) return false;
    const daysLeft = Math.round(
      (new Date(f.expiration_date + "T00:00:00") - today) / 86_400_000,
    );
    return daysLeft <= 30;
  });

  if (eligible.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl p-5 text-sm shadow-sm">
        <p className="font-black mb-1 text-xs uppercase tracking-wide">
          ⚠️ No Franchises Eligible for Renewal
        </p>
        <p className="text-xs">
          You can only renew a franchise within 30 days of its expiration date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {eligible.map((f) => {
        const daysLeft = Math.round(
          (new Date(f.expiration_date + "T00:00:00") - today) / 86_400_000,
        );
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(f)}
            className={cn(
              "w-full text-left p-5 rounded-xl border-2 transition-all shadow-sm hover:shadow-md",
              selected?.id === f.id
                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300"
                : "border-slate-200 hover:border-emerald-300 bg-white",
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-sm text-slate-800 uppercase tracking-wide">
                  Franchise # {f.franchise_number || "—"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Plate: {f.plate_number || "—"} · Expires: {f.expiration_date}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide",
                  daysLeft <= 15
                    ? "bg-rose-100 text-rose-700"
                    : "bg-orange-100 text-orange-700",
                )}
              >
                {daysLeft}d left
              </span>
            </div>
            {selected?.id === f.id && (
              <p className="text-xs text-emerald-600 font-black mt-2 flex items-center gap-1 uppercase tracking-wide">
                <CheckCircle size={12} /> Selected
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── WARNING POPUP ────────────────────────────────────────────────────────────
function WarningPopup({ messages, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-rose-500 animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={28} className="text-rose-500" />
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Duplicate Records Found
            </h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest">
              Please review the issues below
            </p>
          </div>
        </div>
        <div className="space-y-2 mb-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs font-medium"
            >
              {m}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition shadow"
        >
          Understood — Fix & Resubmit
        </button>
      </div>
    </div>
  );
}

// ─── INPUT FIELD ──────────────────────────────────────────────────────────────
function InputField({
  label,
  name,
  type = "text",
  value,
  placeholder,
  required = false,
  hasError = false,
  errorMsg = null,
  onChange,
  onBlur,
  ...rest
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-600 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          "w-full border rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-300 transition shadow-sm",
          hasError ? "border-rose-400 bg-rose-50" : "border-slate-200",
        )}
        {...rest}
      />
      {errorMsg && (
        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {errorMsg}
        </p>
      )}
    </div>
  );
}

// ─── SELECT FIELD ─────────────────────────────────────────────────────────────
function SelectField({
  label,
  name,
  value,
  options,
  required = false,
  hasError = false,
  onChange,
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-600 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full border rounded-xl px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm",
          hasError ? "border-rose-400 bg-rose-50" : "border-slate-200",
        )}
      >
        <option value="">-- Select --</option>
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ),
        )}
      </select>
      {hasError && !value && (
        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> This field is required
        </p>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Apply() {
  const navigate = useNavigate();

  const [appType, setAppType] = useState("");
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;
  const STEP_LABELS = [
    "Personal & Vehicle Info",
    "Required Documents",
    "Vehicle & Garage Photos",
  ];

  const [myFranchises, setMyFranchises] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [approvedNotif, setApprovedNotif] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const emptyForm = useMemo(
    () => ({
      franchise_owner: "",
      address: "",
      date_of_birth: "",
      place_of_birth: "",
      civil_status: "",
      nationality: "Filipino",
      email: "",
      contact_number: "",
      old_owner: "",
      franchise_status: "",
      franchise_number: "",
      franchise_expiration: "",
      make: "",
      color: "",
      motor_no: "",
      chassis_no: "",
      plate_no: "",
      classification: "",
      remarks: "",
    }),
    [],
  );

  const emptyFiles = useMemo(
    () => ({
      or_latest: null,
      cr: null,
      cedula: null,
      police_clearance: null,
      barangay_residency: null,
      voters_cert: null,
      stencil_motor: null,
      tricycle_condition: null,
      left_signal: null,
      right_signal: null,
      head_light: null,
      tail_light: null,
      ilaw_sidecar: null,
      basurahan_sidecar: null,
      garage_condition: null,
      garage_photo: null,
      owner_photo: null,
    }),
    [],
  );

  const [formData, setFormData] = useState(emptyForm);
  const [files, setFiles] = useState(emptyFiles);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedControlNumber, setSubmittedControlNumber] = useState("");
  const [submittedFranchiseNumber, setSubmittedFranchiseNumber] = useState("");
  const [error, setError] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [duplicateAlerts, setDuplicateAlerts] = useState([]);
  const [showDupPopup, setShowDupPopup] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [inlineErrors, setInlineErrors] = useState({});

  const topRef = useRef(null);
  const errorRef = useRef(null);

  // ── Fetch user's applications ─────────────────────────────────────────────
  const fetchMyApplications = async () => {
    setLoadingApps(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("applications")
        .select("*")
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: true });
      setMyApplications(data ?? []);
    } catch (err) {
      console.error("[Apply] fetchMyApplications:", err);
    }
    setLoadingApps(false);
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  // ── Check approved notif on mount ─────────────────────────────────────────
  useEffect(() => {
    const checkApprovedNotif = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("is_read", false)
        .or("notification_type.eq.status_approved,title.ilike.%approved%")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) setApprovedNotif(data[0]);
    };
    checkApprovedNotif();
  }, []);

  // ── Load franchises for renewal ───────────────────────────────────────────
  useEffect(() => {
    if (appType !== "renewal") return;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("franchises")
        .select("*")
        .eq("applicant_id", user.id)
        .order("franchise_number");
      setMyFranchises(data || []);
    })();
  }, [appType]);

  // ── Auto-fill from selected franchise ────────────────────────────────────
  useEffect(() => {
    if (!selectedFranchise) return;
    setFormData((prev) => ({
      ...prev,
      franchise_number: selectedFranchise.franchise_number || "",
      franchise_expiration: selectedFranchise.expiration_date || "",
      franchise_status: selectedFranchise.status || "",
      plate_no: selectedFranchise.plate_number || prev.plate_no,
    }));
  }, [selectedFranchise]);

  // ── Reset on type change ──────────────────────────────────────────────────
  useEffect(() => {
    if (!appType) return;
    checkApplicantEligibility();
    setStep(1);
    setSelectedFranchise(null);
    setFormData(emptyForm);
    setFiles(emptyFiles);
    setError("");
    setFieldErrors({});
    setInlineErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appType]);

  const checkApplicantEligibility = async () => {
    setCheckingStatus(true);
    setBlockReason("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: pending } = await supabase
        .from("applications")
        .select("id,status,type")
        .eq("applicant_id", user.id)
        .in("status", ["pending", "under_review"])
        .limit(1);
      if (pending?.length > 0) {
        setBlockReason(
          `You already have a ${pending[0].type} application being processed (status: ${pending[0].status}).`,
        );
        setCheckingStatus(false);
        return;
      }
      const { data: approved } = await supabase
        .from("applications")
        .select("id")
        .eq("applicant_id", user.id)
        .eq("status", "approved");
      if (approved?.length >= 3)
        setBlockReason(
          "You have reached the maximum limit of 3 approved franchises.",
        );
    } catch (err) {
      console.error(err);
    }
    setCheckingStatus(false);
  };

  // ── Input handlers ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitized = value;
    if (name === "motor_no" || name === "chassis_no") {
      sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    }
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
    setFieldErrors((prev) => ({ ...prev, [name]: false }));
    setInlineErrors((prev) => ({ ...prev, [name]: null }));
    setError("");
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === "motor_no") {
      const err = validateEngineNumber(value);
      if (err) setInlineErrors((prev) => ({ ...prev, motor_no: err }));
    }
    if (name === "chassis_no") {
      const err = validateChassisNumber(value);
      if (err) setInlineErrors((prev) => ({ ...prev, chassis_no: err }));
    }
    if (name === "contact_number") {
      const err = validateContactNumber(value);
      if (err) setInlineErrors((prev) => ({ ...prev, contact_number: err }));
    }
  };

  const handleFileChange = (e) => {
    setFiles((prev) => ({ ...prev, [e.target.name]: e.target.files[0] }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: false }));
    setError("");
  };

  const handleReset = () => {
    setFormData(emptyForm);
    setFiles(emptyFiles);
    setError("");
    setSuccess(false);
    setDuplicateAlerts([]);
    setStep(1);
    setSelectedFranchise(null);
    setFieldErrors({});
    setInlineErrors({});
  };

  // ── Step validations ──────────────────────────────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    const inline = {};
    if (!formData.franchise_owner.trim()) errs.franchise_owner = true;
    if (!formData.address.trim()) errs.address = true;
    if (!formData.date_of_birth) errs.date_of_birth = true;
    if (!formData.civil_status) errs.civil_status = true;
    const contactErr = validateContactNumber(formData.contact_number);
    if (contactErr) {
      errs.contact_number = true;
      inline.contact_number = contactErr;
    }
    if (!formData.make) errs.make = true;
    if (!formData.color) errs.color = true;
    const engineErr = validateEngineNumber(formData.motor_no);
    if (engineErr) {
      errs.motor_no = true;
      inline.motor_no = engineErr;
    }
    const chassisErr = validateChassisNumber(formData.chassis_no);
    if (chassisErr) {
      errs.chassis_no = true;
      inline.chassis_no = chassisErr;
    }
    if (!formData.plate_no.trim()) errs.plate_no = true;
    if (appType === "renewal" && !selectedFranchise)
      errs.selectedFranchise = true;
    setFieldErrors(errs);
    setInlineErrors(inline);
    if (Object.keys(errs).length > 0) {
      setError("⚠️ Please fix all necessary requirements.");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const errs = {};
    if (appType === "registration" && !files.stencil_motor)
      errs.stencil_motor = true;
    if (!files.or_latest) errs.or_latest = true;
    if (!files.cr) errs.cr = true;
    if (!files.cedula) errs.cedula = true;
    if (!files.police_clearance) errs.police_clearance = true;
    if (!files.barangay_residency) errs.barangay_residency = true;
    if (!files.voters_cert) errs.voters_cert = true;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("⚠️ Please upload all required documents.");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const errs = {};
    if (!files.tricycle_condition) errs.tricycle_condition = true;
    if (!files.garage_condition) errs.garage_condition = true;
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError("⚠️ Required condition photos are missing.");
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const goNext = () => {
    setError("");
    let valid = true;
    if (step === 1) valid = validateStep1();
    if (step === 2) valid = validateStep2();
    if (!valid) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Duplicate checks ──────────────────────────────────────────────────────
  const checkDuplicates = async () => {
    const alerts = [];
    const motorNorm = formData.motor_no.trim().toUpperCase();
    const chassisNorm = formData.chassis_no.trim().toUpperCase();
    const plateNorm = formData.plate_no.trim().toUpperCase();
    for (const check of [
      { jsonKey: "motor_no", value: motorNorm, label: "Engine/Motor Number" },
      { jsonKey: "chassis_no", value: chassisNorm, label: "Chassis Number" },
      { jsonKey: "plate_no", value: plateNorm, label: "Plate Number" },
    ]) {
      if (!check.value) continue;
      const { data } = await supabase
        .from("applications")
        .select("id")
        .eq("status", "approved")
        .contains("details", { [check.jsonKey]: check.value })
        .limit(1);
      if (data?.length > 0) {
        alerts.push(
          `${check.label} "${check.value}" is already registered in an approved franchise.`,
        );
      }
    }
    return alerts;
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const { error: e } = await supabase.storage
      .from("franchise-documents")
      .upload(path, file, { upsert: true });
    if (e) return null;
    return supabase.storage.from("franchise-documents").getPublicUrl(path).data
      .publicUrl;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDuplicateAlerts([]);

    const step1Valid = validateStep1();
    const step2Valid = validateStep2();
    const step3Valid = validateStep3();

    if (!step1Valid) {
      setStep(1);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!step2Valid) {
      setStep(2);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!step3Valid) {
      setStep(3);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (blockReason) return;

    setLoading(true);
    try {
      const engineErr = validateEngineNumber(formData.motor_no);
      const chassisErr = validateChassisNumber(formData.chassis_no);
      const contactErr = validateContactNumber(formData.contact_number);
      if (engineErr || chassisErr || contactErr) {
        setInlineErrors({
          motor_no: engineErr,
          chassis_no: chassisErr,
          contact_number: contactErr,
        });
        setStep(1);
        setError("⚠️ Please fix validation errors before submitting.");
        setLoading(false);
        return;
      }

      const dupes = await checkDuplicates();
      if (dupes.length > 0) {
        setDuplicateAlerts(dupes);
        setShowDupPopup(true);
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user.id;
      const ts = Date.now();

      const controlNumber = await generateControlNumber();
      const franchiseSlot =
        appType === "renewal" && selectedFranchise?.franchise_number
          ? selectedFranchise.franchise_number
          : await getNextFranchiseSlot();

      const normalizedMotor = formData.motor_no.trim().toUpperCase();
      const normalizedChassis = formData.chassis_no.trim().toUpperCase();

      const urls = {};
      const fileMap = {
        or_latest: `${uid}/or_latest_${ts}`,
        cr: `${uid}/cr_${ts}`,
        cedula: `${uid}/cedula_${ts}`,
        police_clearance: `${uid}/police_clearance_${ts}`,
        barangay_residency: `${uid}/barangay_residency_${ts}`,
        voters_cert: `${uid}/voters_cert_${ts}`,
        stencil_motor: `${uid}/stencil_motor_${ts}`,
        tricycle_condition: `${uid}/tricycle_condition_${ts}`,
        left_signal: `${uid}/left_signal_${ts}`,
        right_signal: `${uid}/right_signal_${ts}`,
        head_light: `${uid}/head_light_${ts}`,
        tail_light: `${uid}/tail_light_${ts}`,
        ilaw_sidecar: `${uid}/ilaw_sidecar_${ts}`,
        basurahan_sidecar: `${uid}/basurahan_sidecar_${ts}`,
        garage_condition: `${uid}/garage_condition_${ts}`,
        garage_photo: `${uid}/garage_photo_${ts}`,
        owner_photo: `${uid}/owner_photo_${ts}`,
      };
      for (const [key, path] of Object.entries(fileMap)) {
        if (files[key]) urls[key] = await uploadFile(files[key], path);
      }

      const details = {
        ...formData,
        motor_no: normalizedMotor,
        chassis_no: normalizedChassis,
        control_number: controlNumber,
        franchise_number: franchiseSlot,
        ...(appType === "renewal" && selectedFranchise
          ? { franchise_number: selectedFranchise.franchise_number }
          : {}),
        documents: urls,
      };

      const { data: newApp, error: insertError } = await supabase
        .from("applications")
        .insert({
          applicant_id: uid,
          type: appType,
          status: "pending",
          details,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (newApp) {
        await notifyAdmin({
          senderId: uid,
          title:
            appType === "registration"
              ? "New Franchise Application"
              : "Franchise Renewal Submitted",
          message: `${formData.franchise_owner} submitted a ${appType} application. Franchise #: ${franchiseSlot}`,
          applicationId: newApp.id,
          notificationType: "application_submitted",
        });
      }

      setSubmittedControlNumber(controlNumber);
      setSubmittedFranchiseNumber(franchiseSlot);
      setSuccess(true);
      // Refresh applications list after successful submit
      await fetchMyApplications();
    } catch (err) {
      setError("❌ " + err.message);
    }
    setLoading(false);
  };

  const isRenewal = appType === "renewal";
  const isRegistration = appType === "registration";

  // ── Build 3 fixed slots ───────────────────────────────────────────────────
  const MAX_SLOTS = 3;
  const slots = Array.from(
    { length: MAX_SLOTS },
    (_, i) => myApplications[i] ?? null,
  );
  const usedSlots = myApplications.length;
  const canApply = usedSlots < MAX_SLOTS;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ApplicantLayout>
      {approvedNotif && (
        <ApprovedNotifCard
          notif={approvedNotif}
          onClose={async () => {
            await supabase
              .from("notifications")
              .update({ is_read: true })
              .eq("id", approvedNotif.id);
            setApprovedNotif(null);
          }}
          onNavigate={() => {
            setApprovedNotif(null);
            navigate("/applicant/dashboard");
          }}
        />
      )}

      <div className="space-y-8 animate-in">
        <div className="max-w-8xl mx-auto" ref={topRef}>
          {/* ── PAGE HEADER ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
                {appType
                  ? appType === "registration"
                    ? "New Registration"
                    : "Renewal Application"
                  : "Application Portal"}
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-1">
                {appType
                  ? "Complete all required information to submit your application."
                  : "Manage and track all your franchise applications below."}
              </p>
            </div>
            {appType && (
              <button
                onClick={() => {
                  if (step > 1) {
                    goBack();
                  } else {
                    setAppType("");
                    setStep(1);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-all"
              >
                <ArrowLeft size={16} />
                {step > 1 ? "Previous Step" : "Back to Applications"}
              </button>
            )}
          </div>

          {/* ── APPLICATION SLOTS TRACKER (shown when not filling form) ── */}
          {!appType && (
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
              {/* ── LEFT COLUMN: Application Status Tracker ── */}
              <div className="bg-white rounded-2xl border border-blue-500 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
                    <TrendingUp size={14} />
                    Application Status Tracker
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {usedSlots}/{MAX_SLOTS} slots used
                    </span>
                    <div className="flex gap-1">
                      {slots.map((s, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-6 h-2 rounded-full transition-all",
                            s ? "bg-blue-500" : "bg-slate-200",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Slot capacity info */}
                <div className="px-6 py-4 flex items-center gap-4 border-b border-slate-100 bg-white">
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Available
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    {canApply ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg uppercase tracking-wide">
                        {MAX_SLOTS - usedSlots} slot
                        {MAX_SLOTS - usedSlots !== 1 ? "s" : ""} available
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg uppercase tracking-wide">
                        Max slots reached
                      </span>
                    )}
                  </div>
                </div>

                {/* The 3 slot cards */}
                <div className="p-6 space-y-4">
                  {loadingApps ? (
                    <div className="flex items-center justify-center py-8 gap-3">
                      <div className="w-6 h-6 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-xs text-slate-400 font-medium">
                        Loading applications…
                      </p>
                    </div>
                  ) : (
                    slots.map((app, i) => (
                      <ApplicationSlotCard
                        key={i}
                        slotNumber={i + 1}
                        app={app}
                        defaultExpanded={false}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* ── RIGHT COLUMN: Start New Application + Requirements ── */}
              <div className="space-y-4">
                {/* Application Type Selection */}
                {canApply && !blockReason && !checkingStatus && (
                  <div className="bg-white rounded-2xl border border-blue-500 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
                        <FileText size={14} />
                        Start New Application — Slot {usedSlots + 1}
                      </h2>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setAppType("registration")}
                        className="p-4 text-left border-2 border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all group bg-white"
                      >
                        <div className="flex flex-col items-start gap-3">
                          <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform flex-shrink-0">
                            <FileText size={22} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-slate-900 mb-0.5 leading-tight">
                              New Registration
                            </h3>
                            <p className="text-xs text-slate-500 leading-snug">
                              Register a brand new tricycle franchise.
                            </p>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-300 group-hover:text-blue-500 transition-colors self-end"
                          />
                        </div>
                      </button>

                      <button
                        onClick={() => setAppType("renewal")}
                        className="p-4 text-left border-2 border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all group bg-white"
                      >
                        <div className="flex flex-col items-start gap-3">
                          <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform flex-shrink-0">
                            <RefreshCw size={22} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-slate-900 mb-0.5 leading-tight">
                              Renewal Application
                            </h3>
                            <p className="text-xs text-slate-500 leading-snug">
                              Renew an existing franchise permit.
                            </p>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-300 group-hover:text-emerald-500 transition-colors self-end"
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Max slots reached message */}
                {!canApply && (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-3">
                    <AlertCircle
                      size={20}
                      className="text-amber-500 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-amber-800 text-sm mb-1">
                        Maximum Applications Reached
                      </p>
                      <p className="text-xs text-amber-700">
                        You have used all 3 application slots. You cannot submit
                        a new application unless one of your existing
                        applications is resolved or released.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── What to Prepare Card ── */}
                <div className="bg-white rounded-2xl border border-blue-500 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
                      <CheckCircle size={13} className="text-slate-400" />
                      What to Prepare
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Documents */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                        <FileText size={10} /> Required Documents
                      </p>
                      <ul className="space-y-1.5">
                        {[
                          "Latest OR / CR",
                          "Cedula",
                          "Police Clearance",
                          "Barangay Residency",
                          "Voter's Certification",
                        ].map((doc) => (
                          <li
                            key={doc}
                            className="flex items-center gap-2 text-xs text-slate-600"
                          >
                            <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 block" />
                            </span>
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Photos */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                        <Camera size={10} /> Required Photos
                      </p>
                      <ul className="space-y-1.5">
                        {[
                          "Tricycle overall condition",
                          "Left & right signal lights",
                          "Garage condition",
                        ].map((photo) => (
                          <li
                            key={photo}
                            className="flex items-center gap-2 text-xs text-slate-600"
                          >
                            <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
                            </span>
                            {photo}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Office hours */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Clock size={10} /> Office Hours
                      </p>
                      <p className="text-xs font-bold text-slate-700">
                        Mon – Fri &nbsp;·&nbsp; 8:00 AM – 5:00 PM
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Municipal Hall, Business Permits Office
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ALERTS ── */}
          {appType && checkingStatus && (
            <div className="bg-blue-50 border border-blue-300 text-blue-700 p-4 rounded-xl mb-6 text-xs font-bold flex items-center gap-2 uppercase tracking-wide shadow-sm">
              <RefreshCw size={14} className="animate-spin" /> Checking
              eligibility…
            </div>
          )}

          {appType && blockReason && !checkingStatus && (
            <div className="bg-yellow-50 border-2 border-yellow-400 text-yellow-800 p-5 rounded-xl mb-6 text-sm flex items-start gap-3 shadow-sm">
              <AlertCircle size={24} className="flex-shrink-0" />
              <div>
                <p className="font-black mb-1 uppercase tracking-wide text-xs">
                  Application Currently in Progress
                </p>
                <p className="text-xs">{blockReason}</p>
              </div>
            </div>
          )}

          {appType && error && (
            <div
              ref={errorRef}
              className="bg-rose-50 border border-rose-400 text-rose-600 p-4 rounded-xl mb-6 text-sm flex items-start gap-2 shadow-sm"
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="font-bold text-xs">{error}</span>
            </div>
          )}

          {showDupPopup && duplicateAlerts.length > 0 && (
            <WarningPopup
              messages={duplicateAlerts}
              onClose={() => setShowDupPopup(false)}
            />
          )}

          {/* ── FORM ── */}
          {appType && !blockReason && !checkingStatus && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <StepBar step={step} total={TOTAL_STEPS} labels={STEP_LABELS} />

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Section {step}:{" "}
                    {step === 1
                      ? "Personal & Vehicle Info"
                      : step === 2
                        ? "Required Documents"
                        : "Vehicle & Garage Photos"}
                  </h3>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 w-8 rounded-full transition-all",
                          i === step ? "bg-blue-600" : "bg-slate-200",
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-8 md:p-12 space-y-8">
                  {/* ── STEP 1 ── */}
                  {step === 1 && (
                    <div className="space-y-8">
                      {isRenewal && (
                        <div>
                          <SectionHeader
                            icon={RefreshCw}
                            title="Select Franchise to Renew"
                          />
                          <FranchisePicker
                            franchises={myFranchises}
                            selected={selectedFranchise}
                            onSelect={setSelectedFranchise}
                          />
                          {fieldErrors.selectedFranchise && (
                            <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                              <AlertCircle size={11} /> Please select a
                              franchise to renew.
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <SectionHeader
                          icon={User}
                          title="Personal Information"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <InputField
                              label="Full Name"
                              name="franchise_owner"
                              value={formData.franchise_owner}
                              placeholder="Owner's Full Name"
                              required
                              hasError={!!fieldErrors.franchise_owner}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <InputField
                              label="Home Address"
                              name="address"
                              value={formData.address}
                              placeholder="Barangay, San Jose, Occ. Mindoro"
                              required
                              hasError={!!fieldErrors.address}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </div>
                          <InputField
                            label="Date of Birth"
                            name="date_of_birth"
                            type="date"
                            value={formData.date_of_birth}
                            required
                            hasError={!!fieldErrors.date_of_birth}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <SelectField
                            label="Civil Status"
                            name="civil_status"
                            value={formData.civil_status}
                            options={CIVIL_STATUS}
                            required
                            hasError={!!fieldErrors.civil_status}
                            onChange={handleChange}
                          />
                          <InputField
                            label="Contact Number"
                            name="contact_number"
                            type="tel"
                            value={formData.contact_number}
                            placeholder="09XXXXXXXXX"
                            required
                            hasError={!!fieldErrors.contact_number}
                            errorMsg={inlineErrors.contact_number}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            placeholder="email@example.com"
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                        </div>
                      </div>

                      <div>
                        <SectionHeader icon={Car} title="Vehicle Information" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <SelectField
                            label="Motorcycle Make"
                            name="make"
                            value={formData.make}
                            options={MAKES}
                            required
                            hasError={!!fieldErrors.make}
                            onChange={handleChange}
                          />
                          <SelectField
                            label="Color"
                            name="color"
                            value={formData.color}
                            options={COLORS}
                            required
                            hasError={!!fieldErrors.color}
                            onChange={handleChange}
                          />
                          <InputField
                            label="Engine Number"
                            name="motor_no"
                            value={formData.motor_no}
                            placeholder="EN12345678"
                            maxLength={20}
                            required
                            hasError={!!fieldErrors.motor_no}
                            errorMsg={inlineErrors.motor_no}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <InputField
                            label="Chassis Number"
                            name="chassis_no"
                            value={formData.chassis_no}
                            placeholder="CHS2024ABC998877"
                            maxLength={25}
                            required
                            hasError={!!fieldErrors.chassis_no}
                            errorMsg={inlineErrors.chassis_no}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <InputField
                            label="Plate Number"
                            name="plate_no"
                            value={formData.plate_no}
                            placeholder="ABC 1234"
                            required
                            hasError={!!fieldErrors.plate_no}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <SelectField
                            label="Classification"
                            name="classification"
                            value={formData.classification}
                            options={CLASSIFICATION}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div className="pt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={goNext}
                          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 2 ── */}
                  {step === 2 && (
                    <div className="space-y-8">
                      <div>
                        <SectionHeader
                          icon={FileText}
                          title="Required Documents"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {isRegistration && (
                            <div className="md:col-span-2">
                              <FileUploadBox
                                label="Stencil Motor (Engine/Chassis)"
                                fileKey="stencil_motor"
                                files={files}
                                onFileChange={handleFileChange}
                                hasError={!!fieldErrors.stencil_motor}
                                accept="image/*"
                              />
                            </div>
                          )}
                          <FileUploadBox
                            label="Official Receipt (LTO)"
                            fileKey="or_latest"
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={!!fieldErrors.or_latest}
                          />
                          <FileUploadBox
                            label="Certificate of Registration"
                            fileKey="cr"
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={!!fieldErrors.cr}
                          />
                          <FileUploadBox
                            label="Cedula"
                            fileKey="cedula"
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={!!fieldErrors.cedula}
                          />
                          <FileUploadBox
                            label="Police Clearance"
                            fileKey="police_clearance"
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={!!fieldErrors.police_clearance}
                          />
                          <FileUploadBox
                            label="Barangay Residency"
                            fileKey="barangay_residency"
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={!!fieldErrors.barangay_residency}
                          />
                          <FileUploadBox
                            label="Voter's Certification"
                            fileKey="voters_cert"
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={!!fieldErrors.voters_cert}
                          />
                        </div>
                      </div>
                      <div className="pt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                        >
                          ← Previous
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                        >
                          Continue →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 3 ── */}
                  {step === 3 && (
                    <div className="space-y-8">
                      <div>
                        <SectionHeader icon={Camera} title="Vehicle Photos" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <FileUploadBox
                              label="Tricycle Condition (Overall)"
                              fileKey="tricycle_condition"
                              files={files}
                              onFileChange={handleFileChange}
                              hasError={!!fieldErrors.tricycle_condition}
                              accept="image/*"
                            />
                          </div>
                          <FileUploadBox
                            label="Left Signal Light"
                            fileKey="left_signal"
                            required={false}
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={false}
                            accept="image/*"
                          />
                          <FileUploadBox
                            label="Right Signal Light"
                            fileKey="right_signal"
                            required={false}
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={false}
                            accept="image/*"
                          />
                        </div>
                      </div>
                      <div>
                        <SectionHeader icon={Home} title="Garage Photos" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FileUploadBox
                            label="Garage Condition"
                            fileKey="garage_condition"
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={!!fieldErrors.garage_condition}
                            accept="image/*"
                          />
                          <FileUploadBox
                            label="Garage with Tricycle"
                            fileKey="garage_photo"
                            required={false}
                            files={files}
                            onFileChange={handleFileChange}
                            hasError={false}
                            accept="image/*"
                          />
                        </div>
                      </div>
                      <div className="pt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={goBack}
                          className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                        >
                          ← Previous
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />{" "}
                              Submitting...
                            </>
                          ) : (
                            "Submit Application"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── HELP BOX ── */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">
                    Need help with your application?
                  </h4>
                  <p className="text-slate-400 text-sm">
                    Call the support line at (+63) 123-4567
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow"
                >
                  Contact Support
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {success && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-emerald-500 animate-in zoom-in-95">
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">
                Application Submitted!
              </h1>
              <p className="text-sm text-slate-600 mb-8 max-w-sm mx-auto">
                Your {appType} application has been successfully submitted to
                the municipal office.
              </p>

              <div className="space-y-3 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Franchise Number
                  </p>
                  <p className="text-lg font-black text-blue-700 tracking-widest">
                    {submittedFranchiseNumber}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Control Number
                  </p>
                  <p className="text-base font-black text-orange-600 tracking-widest">
                    {submittedControlNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  handleReset();
                  setAppType("");
                }}
                className="w-full px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
              >
                View My Applications
              </button>
            </div>
          </div>
        </div>
      )}
    </ApplicantLayout>
  );
}
