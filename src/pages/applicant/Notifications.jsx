// src/pages/applicant/ApplicantNotifications.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import ApplicantLayout from "../../components/ApplicantLayout";
import { X, MapPin, InboxIcon, Zap, Archive, Bell } from "lucide-react";

// ─── Broadcast unread count + bell rows to header ─────────────────────────────
function broadcastUnread(list) {
  const unread = list.filter((n) => !n.is_read);
  const count = unread.length;

  localStorage.setItem("notif_unread", String(count));
  window.dispatchEvent(
    new CustomEvent("notif_unread_update", { detail: count }),
  );
  window.dispatchEvent(
    new CustomEvent("notif_bell_rows", { detail: unread.slice(0, 8) }),
  );
}

// ─── Notification category detection ──────────────────────────────────────────
const getCategory = (notif) => {
  const type = (notif.notification_type || "").toLowerCase();
  const title = (notif.title || "").toLowerCase();
  const message = (notif.message || "").toLowerCase();

  if (type.includes("appointment") || title.includes("appointment"))
    return "appointment";
  if (
    type.includes("approved") ||
    title.includes("approved") ||
    message.includes("approved")
  )
    return "application";
  if (
    type.includes("rejected") ||
    title.includes("rejected") ||
    message.includes("rejected")
  )
    return "application";
  if (
    type.includes("release") ||
    title.includes("release") ||
    message.includes("release")
  )
    return "application";
  if (
    type.includes("review") ||
    title.includes("review") ||
    message.includes("review")
  )
    return "application";
  if (type.includes("expir") || title.includes("expir")) return "expiry";
  return "other";
};

// ─── Category config ──────────────────────────────────────────────────────────
const DOT_COLORS = {
  appointment: "bg-purple-500",
  application: "bg-blue-500",
  expiry: "bg-orange-500",
  other: "bg-gray-400",
};

const CAT_EMOJI = {
  appointment: "📅",
  application: "📋",
  expiry: "⏰",
  other: "🔔",
};

const SIGNAL_TYPE_LABEL = {
  appointment: "APPOINTMENT",
  application: "APPLICATION",
  expiry: "EXPIRY ALERT",
  other: "NOTIFICATION",
};

const SIGNAL_ACCENT = {
  appointment: "border-l-purple-500",
  application: "border-l-blue-500",
  expiry: "border-l-orange-500",
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

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ─── Appointment modal ────────────────────────────────────────────────────────
function AppointmentModal({ notif, onClose, onNavigate }) {
  if (!notif) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-purple-500 animate-in zoom-in-95">
        <div className="bg-purple-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-3xl">
            📅
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-purple-800">
              Appointment Scheduled
            </h2>
            <p className="text-xs text-purple-500 mt-0.5">
              From: Admin · Business Permits Office
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
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
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <MapPin size={12} />
              <span>Appointment Reminders:</span>
            </div>
            <p>• Visit the Municipal Hall – Business Permits Office</p>
            <p>• Bring your valid ID and original documents</p>
            <p>• Arrive at least 15 minutes early</p>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onNavigate}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow"
          >
            View Appointments →
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

  const type = notif.notification_type || "";
  const title = notif.title?.toLowerCase() || "";

  const isApproved = type.includes("approved") || title.includes("approved");
  const isRejected = type.includes("rejected") || title.includes("rejected");
  const isRelease = type.includes("release") || title.includes("release");
  const isReview = type.includes("review") || title.includes("review");

  const config = isApproved
    ? {
        icon: "✅",
        title: "Application Approved!",
        bg: "bg-green-50",
        border: "border-green-500",
        titleColor: "text-green-800",
        btnColor: "bg-green-500 hover:bg-green-600",
        btnLabel: "View Application",
      }
    : isRejected
      ? {
          icon: "❌",
          title: "Application Rejected",
          bg: "bg-red-50",
          border: "border-red-500",
          titleColor: "text-red-800",
          btnColor: "bg-red-500 hover:bg-red-600",
          btnLabel: "View Details",
        }
      : isRelease
        ? {
            icon: "🏛️",
            title: "Ready for Release!",
            bg: "bg-purple-50",
            border: "border-purple-500",
            titleColor: "text-purple-800",
            btnColor: "bg-purple-500 hover:bg-purple-600",
            btnLabel: "View Franchise",
          }
        : isReview
          ? {
              icon: "🔍",
              title: "Under Review",
              bg: "bg-blue-50",
              border: "border-blue-500",
              titleColor: "text-blue-800",
              btnColor: "bg-blue-500 hover:bg-blue-600",
              btnLabel: "View Progress",
            }
          : {
              icon: "📋",
              title: "Application Update",
              bg: "bg-gray-50",
              border: "border-gray-400",
              titleColor: "text-gray-800",
              btnColor: "bg-blue-500 hover:bg-blue-600",
              btnLabel: "View Application",
            };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div
        className={cn(
          "bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 animate-in zoom-in-95",
          config.border,
        )}
      >
        <div className={cn("px-6 py-5 flex items-center gap-4", config.bg)}>
          <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 text-3xl">
            {config.icon}
          </div>
          <div className="flex-1">
            <h2 className={cn("text-base font-extrabold", config.titleColor)}>
              {config.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              From: Admin · Business Permits Office
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Notification Details
            </p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {notif.message}
            </p>
          </div>

          {(isApproved || isRelease) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
              <p className="font-bold mb-1">📋 Next Steps:</p>
              <p>• Visit the Municipal Hall – Business Permits Office</p>
              <p>• Bring a valid ID and required documents</p>
              <p>• Claim your official Franchise Permit</p>
            </div>
          )}

          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 space-y-1">
              <p className="font-bold mb-1">📋 What to do next:</p>
              <p>• Review the reason for rejection above</p>
              <p>• Correct any missing or invalid documents</p>
              <p>• Contact the office for assistance</p>
              <p>• Resubmit a new application when ready</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onNavigate}
            className={cn(
              "flex-1 text-white py-2.5 rounded-xl font-bold text-sm transition shadow",
              config.btnColor,
            )}
          >
            {config.btnLabel} →
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

// ─── Expiry Modal ──────────────────────────────────────────────────────────────
function ExpiryModal({ notif, onClose, onNavigate }) {
  if (!notif) return null;

  const isExpired =
    notif.notification_type?.includes("expired") ||
    notif.title?.toLowerCase().includes("expired");

  const config = isExpired
    ? {
        icon: "⚠️",
        title: "Franchise Expired",
        bg: "bg-red-50",
        border: "border-red-500",
        titleColor: "text-red-800",
        btnColor: "bg-red-500 hover:bg-red-600",
        btnLabel: "Renew Now",
      }
    : {
        icon: "⏰",
        title: "Franchise Expiring Soon",
        bg: "bg-orange-50",
        border: "border-orange-500",
        titleColor: "text-orange-800",
        btnColor: "bg-orange-500 hover:bg-orange-600",
        btnLabel: "Renew Now",
      };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div
        className={cn(
          "bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 animate-in zoom-in-95",
          config.border,
        )}
      >
        <div className={cn("px-6 py-5 flex items-center gap-4", config.bg)}>
          <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 text-3xl">
            {config.icon}
          </div>
          <div className="flex-1">
            <h2 className={cn("text-base font-extrabold", config.titleColor)}>
              {config.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              From: System · Franchise Monitoring
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Important Notice
            </p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {notif.message}
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
            <p className="font-bold mb-1">📋 Required Steps:</p>
            <p>• Submit a franchise renewal application</p>
            <p>• Prepare required documents (O.R., C.R., Cedula)</p>
            <p>• Ensure tricycle meets safety requirements</p>
            <p>• Visit Municipal Hall to complete renewal</p>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onNavigate}
            className={cn(
              "flex-1 text-white py-2.5 rounded-xl font-bold text-sm transition shadow",
              config.btnColor,
            )}
          >
            {config.btnLabel} →
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ApplicantNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedModal, setSelectedModal] = useState({
    type: null,
    notif: null,
  });

  const navigate = useNavigate();
  const userIdRef = useRef(null);
  const channelRef = useRef(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    const userId = userIdRef.current;
    if (!userId) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    else setRefreshing(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[fetchNotifications]", error);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const rows = (data || []).filter(
      (n) => !n.recipient_type || n.recipient_type === "applicant",
    );

    setNotifications(rows);
    broadcastUnread(rows);
    setLoading(false);
    setRefreshing(false);
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        setLoading(false);
        return;
      }
      userIdRef.current = user.id;
      await fetchNotifications({ silent: false });
    };
    init();
  }, [fetchNotifications]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase
        .channel(`applicant-notif-${user.id}`, {
          config: { broadcast: { self: false } },
        })
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            const row = payload.new;
            if (row.recipient_type && row.recipient_type !== "applicant")
              return;

            setNotifications((prev) => {
              if (prev.some((n) => n.id === row.id)) return prev;
              const updated = [row, ...prev];
              broadcastUnread(updated);
              return updated;
            });
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            const row = payload.new;
            if (row.recipient_type && row.recipient_type !== "applicant")
              return;

            setNotifications((prev) => {
              const updated = prev.map((n) =>
                n.id === row.id ? { ...n, ...row } : n,
              );
              broadcastUnread(updated);
              return updated;
            });
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[Realtime] Channel issue:", status);
            if (mounted) fetchNotifications({ silent: true });
          }
        });

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchNotifications]);

  // ── Mark single read ──────────────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      );
      broadcastUnread(updated);
      return updated;
    });

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("[markRead]", error);
      setNotifications((prev) => {
        const reverted = prev.map((n) =>
          n.id === id ? { ...n, is_read: false } : n,
        );
        broadcastUnread(reverted);
        return reverted;
      });
    }
  };

  // ── Mark all read ─────────────────────────────────────────────────────────
  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (!unread.length) return;

    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, is_read: true }));
      broadcastUnread(updated);
      return updated;
    });

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userIdRef.current)
      .eq("is_read", false);

    if (error) {
      console.error("[markAllRead]", error);
      await fetchNotifications({ silent: true });
    }
  };

  // ── Click handler ─────────────────────────────────────────────────────────
  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) await markRead(notif.id);

    const cat = getCategory(notif);
    if (cat === "appointment") {
      setSelectedModal({ type: "appointment", notif });
    } else if (cat === "application") {
      setSelectedModal({ type: "application", notif });
    } else if (cat === "expiry") {
      setSelectedModal({ type: "expiry", notif });
    } else {
      navigate("/applicant/dashboard");
    }
  };

  const closeModal = () => setSelectedModal({ type: null, notif: null });

  const navigateFromModal = () => {
    const target =
      selectedModal.type === "expiry"
        ? "/applicant/apply"
        : selectedModal.type === "appointment"
          ? "/applicant/appointments"
          : "/applicant/applications";
    closeModal();
    navigate(target);
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const archivedCount = notifications.filter((n) => n.is_read).length;

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : filter === "read"
        ? notifications.filter((n) => n.is_read)
        : notifications;

  // ── Filter tabs ───────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ApplicantLayout>
      {/* Modals */}
      {selectedModal.type === "appointment" && (
        <AppointmentModal
          notif={selectedModal.notif}
          onClose={closeModal}
          onNavigate={navigateFromModal}
        />
      )}
      {selectedModal.type === "application" && (
        <ApplicationModal
          notif={selectedModal.notif}
          onClose={closeModal}
          onNavigate={navigateFromModal}
        />
      )}
      {selectedModal.type === "expiry" && (
        <ExpiryModal
          notif={selectedModal.notif}
          onClose={closeModal}
          onNavigate={navigateFromModal}
        />
      )}

      <div className="max-w-8xl mx-auto space-y-6">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              <span className="text-gray-900">NOTIFICATION</span>
              <span className="text-blue-500">DASHBOARD.</span>
            </h1>
            {/* Underline accent */}
            <div className="mt-1 h-0.5 w-48 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
            <p className="text-sm text-gray-400 font-medium mt-2 tracking-wide">
              All updates about your applications and permits in one place.
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
                  Filter Signals
                </p>
              </div>
              <div className="px-3 pb-4 space-y-1">
                {dispatchFilters.map(({ key, label, count }) => {
                  const isActive = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-150",
                        isActive
                          ? "bg-gray-900 text-white shadow-md"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800",
                      )}
                    >
                      <span
                        className={cn(
                          "flex-1 text-[11px] font-black uppercase tracking-[0.12em]",
                          isActive ? "text-white" : "text-gray-600",
                        )}
                      >
                        {label}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-black tabular-nums px-2 py-0.5 rounded-lg",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mark all read button */}
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.15em] shadow transition-all"
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
                  className={cn(
                    "w-2 h-2 rounded-full",
                    unreadCount > 0
                      ? "bg-green-400 animate-pulse"
                      : "bg-gray-300",
                  )}
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
                  onClick={() => fetchNotifications({ silent: true })}
                  disabled={refreshing}
                  className="text-[10px] font-bold text-gray-400 hover:text-blue-500 transition uppercase tracking-widest disabled:opacity-50"
                >
                  {refreshing ? "↻ Syncing…" : "↻ Sync"}
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Fetching signals…
                </p>
              </div>
            ) : filtered.length === 0 ? (
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
                    className="text-[11px] text-blue-400 hover:text-blue-500 font-bold uppercase tracking-widest transition"
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
                  const typeLabel = SIGNAL_TYPE_LABEL[cat] || "NOTIFICATION";

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "flex items-start gap-4 px-6 py-5 cursor-pointer transition-all duration-150 border-l-4 group",
                        accent,
                        notif.is_read
                          ? "bg-white hover:bg-gray-50/80 opacity-70 hover:opacity-100"
                          : "bg-white hover:bg-blue-50/40",
                      )}
                    >
                      {/* Status dot */}
                      <div className="flex-shrink-0 pt-1.5">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            notif.is_read ? "bg-gray-200" : dot,
                          )}
                        />
                      </div>

                      {/* Emoji icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 text-xl leading-none pt-0.5",
                          notif.is_read ? "grayscale opacity-50" : "",
                        )}
                      >
                        {CAT_EMOJI[cat] || "🔔"}
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={cn(
                              "text-[9px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded-md",
                              notif.is_read
                                ? "bg-gray-100 text-gray-400"
                                : "bg-gray-900 text-white",
                            )}
                          >
                            {typeLabel}
                          </span>
                          {!notif.is_read && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                              · NEW
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm font-bold leading-snug",
                            notif.is_read ? "text-gray-400" : "text-gray-900",
                          )}
                        >
                          {notif.title}
                        </p>
                        <p
                          className={cn(
                            "text-xs leading-relaxed mt-0.5 line-clamp-2",
                            notif.is_read ? "text-gray-300" : "text-gray-500",
                          )}
                        >
                          {notif.message}
                        </p>
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
                          <span className="w-2 h-2 rounded-full bg-blue-400 block" />
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
    </ApplicantLayout>
  );
}
