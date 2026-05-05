// src/pages/applicant/ApplicantNotifications.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import ApplicantLayout from "../../components/ApplicantLayout";
import { X, MapPin } from "lucide-react";

// ─── Broadcast unread count to bell / header ──────────────────────────────
function broadcastUnread(list) {
  const unread = list.filter((n) => !n.is_read);
  const count = unread.length;

  localStorage.setItem("notif_unread", String(count));

  window.dispatchEvent(
    new CustomEvent("notif_unread_update", { detail: count }),
  );

  // Top 8 unread rows for the bell dropdown
  window.dispatchEvent(
    new CustomEvent("notif_bell_rows", { detail: unread.slice(0, 8) }),
  );
}

// ─── Appointment Modal ─────────────────────────────────────────────────────
function AppointmentModal({ notif, onClose, onNavigate }) {
  if (!notif) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-blue-500">
        <div className="bg-blue-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-3xl">
            📅
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-blue-800">
              Appointment Scheduled
            </h2>
            <p className="text-xs text-blue-500 mt-0.5">
              From: Admin · Business Permits Office
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
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow"
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

// ─── Application Modal ──────────────────────────────────────────────────────
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
              btnColor: "bg-orange-500 hover:bg-orange-600",
              btnLabel: "View Application",
            };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${config.border}`}
      >
        <div className={`${config.bg} px-6 py-5 flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 text-3xl">
            {config.icon}
          </div>
          <div className="flex-1">
            <h2 className={`text-base font-extrabold ${config.titleColor}`}>
              {config.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              From: Admin · Business Permits Office
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
            className={`flex-1 ${config.btnColor} text-white py-2.5 rounded-xl font-bold text-sm transition shadow`}
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

// ─── Expiry Modal ───────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${config.border}`}
      >
        <div className={`${config.bg} px-6 py-5 flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 text-3xl">
            {config.icon}
          </div>
          <div className="flex-1">
            <h2 className={`text-base font-extrabold ${config.titleColor}`}>
              {config.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              From: System · Franchise Monitoring
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
            className={`flex-1 ${config.btnColor} text-white py-2.5 rounded-xl font-bold text-sm transition shadow`}
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

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ApplicantNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [diagInfo, setDiagInfo] = useState(null);
  const [selectedModal, setSelectedModal] = useState({
    type: null,
    notif: null,
  });

  const navigate = useNavigate();
  const userIdRef = useRef(null);
  const channelRef = useRef(null);

  // ── Fetch notifications ─────────────────────────────────────────────────
  // Schema uses `recipient_id` — no probing needed, query directly.
  const fetchNotifications = useCallback(async (options = {}) => {
    const { silent = false } = options;
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
      .eq("recipient_id", userId) // ✅ correct column per schema
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[fetchNotifications] Error:", error);
      setDiagInfo({
        type: "fetch_error",
        message: `Failed to load notifications: ${error.message}`,
      });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Filter to applicant-only recipient_type (belt-and-suspenders)
    const rows = (data || []).filter(
      (n) => !n.recipient_type || n.recipient_type === "applicant",
    );

    setNotifications(rows);
    broadcastUnread(rows);
    setDiagInfo(null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  // ── Initial load ────────────────────────────────────────────────────────
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

  // ── Realtime subscription ───────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) return;

      // Remove any previous channel
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
            // Filter server-side to only rows for this user
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            const row = payload.new;

            // Double-check recipient_type
            if (row.recipient_type && row.recipient_type !== "applicant")
              return;

            setNotifications((prev) => {
              // Deduplicate by id in case of multiple events
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
          if (status === "SUBSCRIBED") {
            console.log("[Realtime] Subscribed to notifications channel");
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[Realtime] Channel issue:", status);
            // Fallback: refetch on channel error
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

  // ── Mark single notification as read ───────────────────────────────────
  const markRead = async (id) => {
    // Optimistic update first
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
      console.error("[markRead] Failed:", error);
      // Revert optimistic update on error
      setNotifications((prev) => {
        const reverted = prev.map((n) =>
          n.id === id ? { ...n, is_read: false } : n,
        );
        broadcastUnread(reverted);
        return reverted;
      });
    }
  };

  // ── Mark all as read ────────────────────────────────────────────────────
  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (!unread.length) return;

    // Optimistic update
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, is_read: true }));
      broadcastUnread(updated);
      return updated;
    });

    // Batch update in Supabase — update where recipient_id = user and is_read = false
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", userIdRef.current)
      .eq("is_read", false);

    if (error) {
      console.error("[markAllRead] Failed:", error);
      // Fallback: refetch to get correct state
      await fetchNotifications({ silent: true });
    }
  };

  // ── Refresh handler (manual button) ────────────────────────────────────
  const handleRefresh = () => {
    fetchNotifications({ silent: true });
  };

  // ── Get redirect path ───────────────────────────────────────────────────
  const getRedirectPath = (notif) => {
    const type = notif.notification_type || "";
    const title = notif.title?.toLowerCase() || "";

    if (type.includes("appointment") || title.includes("appointment"))
      return "/applicant/appointments";
    if (
      type.includes("status_") ||
      type.includes("approved") ||
      type.includes("rejected") ||
      type.includes("review") ||
      type.includes("release")
    )
      return "/applicant/applications";
    if (type.includes("expir")) return "/applicant/dashboard";
    return "/applicant/dashboard";
  };

  // ── Click handler ───────────────────────────────────────────────────────
  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) await markRead(notif.id);

    const type = notif.notification_type || "";
    const title = notif.title?.toLowerCase() || "";

    if (type.includes("appointment") || title.includes("appointment")) {
      setSelectedModal({ type: "appointment", notif });
    } else if (
      type.includes("status_") ||
      type.includes("approved") ||
      type.includes("rejected") ||
      type.includes("review") ||
      type.includes("release")
    ) {
      setSelectedModal({ type: "application", notif });
    } else if (type.includes("expir")) {
      setSelectedModal({ type: "expiry", notif });
    } else {
      navigate(getRedirectPath(notif));
    }
  };

  // ── UI helpers ──────────────────────────────────────────────────────────
  const statusDot = (notif) => {
    const type = notif.notification_type || "";
    const title = notif.title?.toLowerCase() || "";
    if (type === "status_approved" || title.includes("approved"))
      return "bg-green-500";
    if (type === "status_rejected" || title.includes("rejected"))
      return "bg-red-500";
    if (type === "status_for_release" || title.includes("release"))
      return "bg-purple-500";
    if (type === "status_under_review" || title.includes("review"))
      return "bg-blue-500";
    if (type.includes("appointment") || title.includes("appointment"))
      return "bg-orange-500";
    if (type.includes("expir")) return "bg-orange-400";
    return "bg-gray-400";
  };

  const getTypePill = (notif) => {
    const type = notif.notification_type || "";
    const title = notif.title?.toLowerCase() || "";
    if (type === "status_approved" || title.includes("approved"))
      return { label: "Approved", cls: "bg-green-100 text-green-700" };
    if (type === "status_rejected" || title.includes("rejected"))
      return { label: "Rejected", cls: "bg-red-100 text-red-700" };
    if (type === "status_for_release" || title.includes("release"))
      return { label: "For Release", cls: "bg-purple-100 text-purple-700" };
    if (type === "status_under_review" || title.includes("review"))
      return { label: "Under Review", cls: "bg-blue-100 text-blue-700" };
    if (type.includes("appointment") || title.includes("appointment"))
      return { label: "Appointment", cls: "bg-orange-100 text-orange-700" };
    if (type.includes("expir"))
      return { label: "Expiry", cls: "bg-orange-100 text-orange-700" };
    return null;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return (
      d.toLocaleDateString("en-PH", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }) +
      " – " +
      d.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  // ── Derived state ───────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : filter === "read"
        ? notifications.filter((n) => n.is_read)
        : notifications;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <ApplicantLayout>
      {/* Modals */}
      {selectedModal.type === "appointment" && (
        <AppointmentModal
          notif={selectedModal.notif}
          onClose={() => setSelectedModal({ type: null, notif: null })}
          onNavigate={() => {
            setSelectedModal({ type: null, notif: null });
            navigate(getRedirectPath(selectedModal.notif));
          }}
        />
      )}
      {selectedModal.type === "application" && (
        <ApplicationModal
          notif={selectedModal.notif}
          onClose={() => setSelectedModal({ type: null, notif: null })}
          onNavigate={() => {
            setSelectedModal({ type: null, notif: null });
            navigate(getRedirectPath(selectedModal.notif));
          }}
        />
      )}
      {selectedModal.type === "expiry" && (
        <ExpiryModal
          notif={selectedModal.notif}
          onClose={() => setSelectedModal({ type: null, notif: null })}
          onNavigate={() => {
            setSelectedModal({ type: null, notif: null });
            navigate("/applicant/apply");
          }}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* ── Header ── */}
          <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold text-gray-800 uppercase tracking-wide flex items-center gap-3">
                🔔 My Notifications
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Updates from the Franchise Office about your applications and
                permits.
              </p>
            </div>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                unreadCount === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
              }`}
            >
              Mark All as Read ({unreadCount})
            </button>
          </div>

          {/* ── Filters ── */}
          <div className="px-6 py-3 border-b bg-white flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <div className="flex gap-2">
              {["all", "unread", "read"].map((f) => {
                const count =
                  f === "all"
                    ? notifications.length
                    : f === "unread"
                      ? unreadCount
                      : notifications.length - unreadCount;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase transition ${
                      filter === f
                        ? "bg-orange-500 text-white shadow-md scale-105"
                        : "bg-gray-100 text-gray-500 hover:bg-orange-50"
                    }`}
                  >
                    {f} ({count})
                  </button>
                );
              })}
            </div>
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {unreadCount} unread • {filtered.length} shown
            </span>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="text-center py-16 text-orange-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
              <p className="font-semibold">Loading notifications...</p>
            </div>
          ) : diagInfo ? (
            <div className="mx-6 my-12 bg-amber-50 border-2 border-amber-300 rounded-2xl p-8 text-sm">
              <p className="font-bold text-amber-800 mb-1">⚠️ Notice</p>
              <p className="text-amber-900">{diagInfo.message}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 text-xs text-orange-600 hover:underline font-medium"
              >
                ↻ Try Again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-xl font-semibold mb-2 text-gray-500">
                No notifications found
              </p>
              <p className="text-sm mb-6 text-gray-400">
                {filter !== "all"
                  ? "Try adjusting your filter"
                  : "All caught up! 🎉"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
              {filtered.map((notif) => {
                const dotColor = statusDot(notif);
                const pill = getTypePill(notif);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-4 px-6 py-5 cursor-pointer transition ${
                      notif.is_read
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 border-r-4 border-orange-400"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full shadow-sm ${dotColor}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold leading-tight ${
                          notif.is_read ? "text-gray-600" : "text-gray-900"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p
                        className={`text-xs leading-relaxed mt-0.5 ${
                          notif.is_read ? "text-gray-400" : "text-gray-700"
                        }`}
                      >
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {pill && (
                          <span
                            className={`text-xs font-bold px-3 py-0.5 rounded-full ${pill.cls}`}
                          >
                            {pill.label}
                          </span>
                        )}
                        <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                          {notif.sender_type === "system"
                            ? "🤖 System"
                            : "👤 Admin"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right ml-2">
                      <p className="text-xs text-gray-400 whitespace-nowrap font-mono">
                        {formatDate(notif.created_at)}
                      </p>
                      {notif.is_read ? (
                        <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-400 px-2.5 py-0.5 rounded-full font-medium">
                          ✓ Read
                        </span>
                      ) : (
                        <span className="inline-block mt-1.5 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full font-bold shadow">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Footer ── */}
          {!loading && (
            <div className="px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-orange-50 text-xs text-gray-500 flex items-center justify-between gap-4">
              <span>
                {notifications.length > 0 ? (
                  <>
                    Showing <strong>{filtered.length}</strong> of{" "}
                    <strong>{notifications.length}</strong> notifications
                  </>
                ) : (
                  "No notifications yet"
                )}
              </span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-1.5 font-medium transition ${
                  refreshing
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-orange-500 hover:text-orange-600 hover:underline"
                }`}
              >
                <span className={refreshing ? "animate-spin inline-block" : ""}>
                  ↻
                </span>
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          )}
        </div>
      </div>
    </ApplicantLayout>
  );
}
