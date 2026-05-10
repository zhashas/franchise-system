import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import {
  X,
  Clock,
  MapPin,
  CheckCircle,
  Bell,
  InboxIcon,
  Zap,
  Archive,
  Database,
} from "lucide-react";
import { getCategory } from "../../utils/notificationUtils";

// ─── Broadcast unread count + top-10 rows to AdminLayout bell ────────────────
const broadcastUnreadCount = (notifications) => {
  const unread = notifications.filter((n) => !n.is_read);
  window.dispatchEvent(
    new CustomEvent("adminUnreadCount", { detail: { count: unread.length } }),
  );
  window.dispatchEvent(
    new CustomEvent("admin_bell_rows", { detail: unread.slice(0, 10) }),
  );
};

// ─── Category config ──────────────────────────────────────────────────────────
const DOT_COLORS = {
  mtop_reminder: "bg-blue-500",
  expiry_30: "bg-orange-500",
  expiry_15: "bg-red-500",
  application: "bg-green-500",
  new_application: "bg-green-500",
  renewal: "bg-orange-500",
  appointment: "bg-purple-500",
  document: "bg-purple-500",
  inquiry: "bg-yellow-400",
  staff_review: "bg-teal-500",
  other: "bg-gray-400",
};

const CAT_EMOJI = {
  new_application: "📄",
  renewal: "🔄",
  appointment: "📅",
  mtop_reminder: "📋",
  expiry_15: "🔴",
  expiry_30: "🟡",
  document: "📎",
  application: "📎",
  inquiry: "❓",
  staff_review: "📋",
  other: "🔔",
};

const SIGNAL_TYPE_LABEL = {
  new_application: "NEW APPLICATION",
  renewal: "RENEWAL",
  appointment: "APPOINTMENT",
  mtop_reminder: "MTOP REMINDER",
  expiry_15: "EXPIRY URGENT",
  expiry_30: "EXPIRY WARNING",
  document: "DOCUMENT",
  application: "APPLICATION",
  inquiry: "INQUIRY",
  staff_review: "STAFF REVIEW",
  other: "SYSTEM",
};

const SIGNAL_ACCENT = {
  new_application: "border-l-green-500",
  renewal: "border-l-orange-500",
  appointment: "border-l-purple-500",
  mtop_reminder: "border-l-blue-500",
  expiry_15: "border-l-red-500",
  expiry_30: "border-l-yellow-500",
  document: "border-l-purple-500",
  application: "border-l-green-500",
  inquiry: "border-l-yellow-400",
  staff_review: "border-l-teal-500",
  other: "border-l-gray-400",
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-PH", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }) +
  " · " +
  new Date(date).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatTimeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diff < 1) return "Just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

// ─── Appointment modal ────────────────────────────────────────────────────────
function AppointmentModal({ notif, onClose, onNavigate }) {
  if (!notif) return null;
  const fmt = (d, type) =>
    type === "date"
      ? new Date(d).toLocaleDateString("en-PH", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : new Date(d).toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-blue-500">
        <div className="bg-blue-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-3xl">
            📅
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-blue-800">
              Appointment Request
            </h2>
            <p className="text-xs text-blue-500 mt-0.5">From: Applicant</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Message
            </p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {notif.message}
            </p>
            {notif.profiles?.full_name && (
              <p className="text-xs text-orange-500 mt-2 font-medium">
                👤 From: {notif.profiles.full_name}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={12} className="text-blue-500" />
                <p className="text-xs font-semibold text-blue-600">Received</p>
              </div>
              <p className="text-xs font-bold text-blue-800">
                {fmt(notif.created_at, "date")}
              </p>
              <p className="text-xs text-blue-600">
                {fmt(notif.created_at, "time")}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} className="text-yellow-500" />
                <p className="text-xs font-semibold text-yellow-700">Action</p>
              </div>
              <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full">
                Needs Scheduling
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <MapPin size={12} />
              <span>Admin Action Required:</span>
            </div>
            <p>• Go to Appointments to set a date and time</p>
            <p>• Notify the applicant once the schedule is confirmed</p>
            <p>• Ensure the applicant brings required documents</p>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onNavigate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow"
          >
            Go to Appointments →
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Application modal ────────────────────────────────────────────────────────
function ApplicationModal({ notif, onClose, onNavigate }) {
  if (!notif) return null;
  const isRenewal = getCategory(notif) === "renewal";
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-orange-500">
        <div className="bg-orange-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-3xl">
            {isRenewal ? "🔄" : "📋"}
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-orange-800">
              {isRenewal ? "Renewal Request" : "New Application Received"}
            </h2>
            <p className="text-xs text-orange-500 mt-0.5">
              Awaiting your review
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Details
            </p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {notif.message}
            </p>
            {notif.profiles?.full_name && (
              <p className="text-xs text-orange-500 mt-2 font-medium">
                👤 Applicant: {notif.profiles.full_name}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-1">Received</p>
              <p className="text-xs font-bold text-gray-800">
                {new Date(notif.created_at).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 text-center">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                Pending Review
              </span>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 space-y-1">
            <p className="font-bold mb-1">📋 Review Checklist:</p>
            <p>• Verify engine number, chassis number, plate number</p>
            <p>• Check all uploaded documents are complete and valid</p>
            <p>• Approve, reject, or schedule for inspection</p>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onNavigate}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm transition shadow"
          >
            View Application →
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unread | read (archived)
  const [appointmentNotif, setAppointmentNotif] = useState(null);
  const [applicationNotif, setApplicationNotif] = useState(null);
  const [staffReviewNotif, setStaffReviewNotif] = useState(null);
  const seenIds = useRef(new Set());
  const navigate = useNavigate();

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, profiles!notifications_sender_id_fkey(full_name, email)")
        .eq("recipient_type", "admin")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = data || [];
      rows.forEach((n) => seenIds.current.add(n.id));
      setNotifications(rows);
      broadcastUnreadCount(rows);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Realtime INSERT ───────────────────────────────────────────────────────────
  useEffect(() => {
    let channel;
    let cancelled = false;

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`admin-notif-page-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          async (payload) => {
            if (cancelled) return;
            const row = payload.new;
            if (row.recipient_type !== "admin") return;
            if (row.recipient_id && row.recipient_id !== user.id) return;
            if (seenIds.current.has(row.id)) return;
            seenIds.current.add(row.id);

            let enriched = { ...row, profiles: null };
            if (row.sender_id) {
              const { data: p } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", row.sender_id)
                .single();
              enriched.profiles = p || null;
            }

            setNotifications((prev) => {
              const updated = [enriched, ...prev];
              broadcastUnreadCount(updated);
              return updated;
            });
          },
        )
        .subscribe();
    };

    setup();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // ── Mark read helpers ─────────────────────────────────────────────────────────
  const markRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      );
      broadcastUnreadCount(updated);
      return updated;
    });
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_type", "admin")
      .eq("is_read", false);
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, is_read: true }));
      broadcastUnreadCount(updated);
      return updated;
    });
  };

  // ── Click handler ─────────────────────────────────────────────────────────────
  const handleClick = async (n) => {
    if (!n.is_read) await markRead(n.id);
    const cat = getCategory(n);
    if (cat === "appointment") {
      setAppointmentNotif(n);
      return;
    }
    if (["new_application", "renewal", "application"].includes(cat)) {
      setApplicationNotif(n);
      return;
    }
    if (cat === "staff_review" || n.notification_type === "staff_review") {
      setStaffReviewNotif(n);
      return;
    }
    if (n.application_id) navigate(`/admin/applications/${n.application_id}`);
    else navigate("/admin/applications");
  };

  // ── Derived state ─────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const archivedCount = notifications.filter((n) => n.is_read).length;

  const filtered = notifications.filter((n) =>
    filter === "unread" ? !n.is_read : filter === "read" ? n.is_read : true,
  );

  // ── Dispatch filter tabs ──────────────────────────────────────────────────────
  const dispatchFilters = [
    {
      key: "all",
      label: "ALL INCOMING",
      Icon: InboxIcon,
      count: notifications.length,
    },
    {
      key: "unread",
      label: "UNREAD SIGNALS",
      Icon: Zap,
      count: unreadCount,
    },
    {
      key: "read",
      label: "ARCHIVED LOGS",
      Icon: Archive,
      count: archivedCount,
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      {/* Modals */}
      {appointmentNotif && (
        <AppointmentModal
          notif={appointmentNotif}
          onClose={() => setAppointmentNotif(null)}
          onNavigate={() => {
            setAppointmentNotif(null);
            navigate("/admin/appointments");
          }}
        />
      )}
      {applicationNotif && (
        <ApplicationModal
          notif={applicationNotif}
          onClose={() => setApplicationNotif(null)}
          onNavigate={() => {
            const id = applicationNotif.application_id;
            setApplicationNotif(null);
            navigate(id ? `/admin/applications/${id}` : "/admin/applications");
          }}
        />
      )}
      {staffReviewNotif && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-teal-500">
            <div className="bg-teal-50 px-6 py-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 text-3xl">
                📋
              </div>
              <div className="flex-1">
                <h2 className="text-base font-extrabold text-teal-800">
                  New Staff Review
                </h2>
                <p className="text-xs text-teal-600 mt-0.5">
                  Staff has submitted a recommendation
                </p>
              </div>
              <button
                onClick={() => setStaffReviewNotif(null)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Review Summary
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {staffReviewNotif.title}
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {staffReviewNotif.message}
                </p>
                {staffReviewNotif.profiles?.full_name && (
                  <p className="text-xs text-orange-500 mt-2 font-medium">
                    👤 Reviewed by: {staffReviewNotif.profiles.full_name}
                  </p>
                )}
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
                <p className="font-bold mb-1">⚡ Admin Action Required:</p>
                <p>• Review the full application and staff remarks</p>
                <p>• Make the final approval or rejection decision</p>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => {
                  setStaffReviewNotif(null);
                  navigate("/admin/reviewed-applications");
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow"
              >
                View Reviewed Applications →
              </button>
              <button
                onClick={() => setStaffReviewNotif(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              <span className="text-gray-900">NOTIFICATION</span>
              <span className="text-orange-500">COMMAND.</span>
            </h1>
            {/* Underline accent */}
            <div className="mt-1 h-0.5 w-48 bg-gradient-to-r from-orange-500 to-transparent rounded-full" />
            <p className="text-sm text-gray-400 font-medium mt-2 tracking-wide">
              Central dispatcher for all incoming system alerts and requests.
            </p>
          </div>

          {/* Pending alerts badge */}
          <button
            onClick={() => setFilter("unread")}
            className="flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all"
          >
            <Bell size={16} />
            {unreadCount} PENDING ALERT{unreadCount !== 1 ? "S" : ""}
          </button>
        </div>

        {/* ── BODY: LEFT PANEL + RIGHT PANEL ── */}
        <div className="flex gap-5 items-start">
          {/* ── LEFT: DISPATCH FILTER PANEL ── */}
          <div className="w-64 flex-shrink-0 space-y-4">
            {/* Filter card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  Dispatch Filter
                </p>
              </div>
              <div className="px-3 pb-4 space-y-1">
                {dispatchFilters.map(({ key, label, count }) => {
                  const isActive = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-150 ${
                        isActive
                          ? "bg-gray-900 text-white shadow-md"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                      }`}
                    >
                      <span
                        className={`flex-1 text-[11px] font-black uppercase tracking-[0.12em] ${isActive ? "text-white" : "text-gray-600"}`}
                      >
                        {label}
                      </span>
                      <span
                        className={`text-xs font-black tabular-nums px-2 py-0.5 rounded-lg ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Automated cleansing info card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Database size={20} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.15em] mb-1">
                  Automated Cleansing
                </p>
                <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-wide font-medium">
                  Signals older than 90 days are automatically archived to cold
                  storage.
                </p>
              </div>
            </div>

            {/* Mark all read button — only shows when there are unread */}
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black uppercase tracking-[0.15em] shadow transition-all"
              >
                Mark All as Read ({unreadCount})
              </button>
            )}
          </div>

          {/* ── RIGHT: SIGNAL STREAM PANEL ── */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[480px] flex flex-col">
            {/* Stream header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${unreadCount > 0 ? "bg-green-400 animate-pulse" : "bg-gray-300"}`}
                />
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.18em]">
                  {filter === "all"
                    ? "Live Signal Stream"
                    : filter === "unread"
                      ? "Unread Signals"
                      : "Archived Logs"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-mono">
                  {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={fetchNotifications}
                  className="text-[10px] font-bold text-gray-400 hover:text-orange-500 transition uppercase tracking-widest"
                >
                  ↻ Sync
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Fetching signals…
                </p>
              </div>
            ) : filtered.length === 0 ? (
              /* ── EMPTY STATE matching design ── */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <InboxIcon size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-black text-gray-300 uppercase tracking-[0.25em]">
                  Void Stream. No Signals Detected.
                </p>
                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="text-[11px] text-orange-400 hover:text-orange-500 font-bold uppercase tracking-widest transition"
                  >
                    ← Back to All Incoming
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
                {filtered.map((notif) => {
                  const cat = getCategory(notif);
                  const dot = DOT_COLORS[cat] || "bg-gray-400";
                  const accent = SIGNAL_ACCENT[cat] || "border-l-gray-300";
                  const typeLabel = SIGNAL_TYPE_LABEL[cat] || "SYSTEM";
                  const sender =
                    notif.profiles?.full_name || notif.profiles?.email || null;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`flex items-start gap-4 px-6 py-5 cursor-pointer transition-all duration-150 border-l-4 group ${accent} ${
                        notif.is_read
                          ? "bg-white hover:bg-gray-50/80 opacity-70 hover:opacity-100"
                          : "bg-white hover:bg-orange-50/40"
                      }`}
                    >
                      {/* Status dot */}
                      <div className="flex-shrink-0 pt-1.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${notif.is_read ? "bg-gray-200" : dot}`}
                        />
                      </div>

                      {/* Emoji icon */}
                      <div
                        className={`flex-shrink-0 text-xl leading-none pt-0.5 ${notif.is_read ? "grayscale opacity-50" : ""}`}
                      >
                        {CAT_EMOJI[cat] || "🔔"}
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded-md ${
                              notif.is_read
                                ? "bg-gray-100 text-gray-400"
                                : "bg-gray-900 text-white"
                            }`}
                          >
                            {typeLabel}
                          </span>
                          {!notif.is_read && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500">
                              · NEW
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm font-bold leading-snug ${notif.is_read ? "text-gray-400" : "text-gray-900"}`}
                        >
                          {notif.title}
                        </p>
                        <p
                          className={`text-xs leading-relaxed mt-0.5 line-clamp-2 ${notif.is_read ? "text-gray-300" : "text-gray-500"}`}
                        >
                          {notif.message}
                        </p>
                        {sender && (
                          <p className="text-[10px] text-orange-400 font-semibold mt-1.5">
                            👤 {sender}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex-shrink-0 text-right ml-2 flex flex-col items-end gap-1.5">
                        <p className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                          {formatTimeAgo(notif.created_at)}
                        </p>
                        <p className="text-[9px] text-gray-300 font-mono whitespace-nowrap hidden lg:block">
                          {formatDate(notif.created_at)}
                        </p>
                        {notif.is_read ? (
                          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                            READ
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-orange-400 block" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {!loading && notifications.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                  {filtered.length} / {notifications.length} signals displayed
                </span>
                <span className="text-[10px] text-gray-300 font-mono">
                  {unreadCount} unread · {archivedCount} archived
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
