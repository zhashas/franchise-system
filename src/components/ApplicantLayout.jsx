import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Home,
  ClipboardList,
  Calendar,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  MapPin,
  CheckCircle,
  Globe,
} from "lucide-react";

// ─── Appointment Detail Modal ─────────────────────────────────────────────────
function AppointmentModal({ notif, onClose, onNavigate }) {
  if (!notif) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-blue-500">
        <div className="bg-blue-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">📅</span>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={12} className="text-blue-500" />
                <p className="text-xs font-semibold text-blue-600">Received</p>
              </div>
              <p className="text-xs font-bold text-blue-800">
                {new Date(notif.created_at).toLocaleDateString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} className="text-green-500" />
                <p className="text-xs font-semibold text-green-600">Status</p>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                Confirmed ✓
              </span>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <MapPin size={12} />
              <span>Reminders:</span>
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

// ─── Notification Detail Modal ────────────────────────────────────────────────
function NotifDetailModal({ notif, onClose, onNavigate }) {
  if (!notif) return null;
  const isApproved = (notif.title || "").toLowerCase().includes("approved");
  const isRejected = (notif.title || "").toLowerCase().includes("rejected");
  const isRelease = (notif.title || "").toLowerCase().includes("release");
  const cfg = isApproved
    ? {
        icon: "✅",
        hdr: "bg-green-50",
        border: "border-green-500",
        title: "Application Approved!",
        tc: "text-green-800",
      }
    : isRejected
      ? {
          icon: "❌",
          hdr: "bg-red-50",
          border: "border-red-500",
          title: "Application Rejected",
          tc: "text-red-800",
        }
      : isRelease
        ? {
            icon: "🏛️",
            hdr: "bg-purple-50",
            border: "border-purple-500",
            title: "Ready for Release!",
            tc: "text-purple-800",
          }
        : {
            icon: "🔔",
            hdr: "bg-orange-50",
            border: "border-orange-400",
            title: notif.title,
            tc: "text-orange-800",
          };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${cfg.border}`}
      >
        <div className={`${cfg.hdr} px-6 py-5 flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">{cfg.icon}</span>
          </div>
          <div className="flex-1">
            <h2 className={`text-base font-extrabold ${cfg.tc}`}>
              {cfg.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              From: {notif.sender_type === "system" ? "🤖 System" : "👤 Admin"}
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
          <p className="text-xs text-gray-400">
            {new Date(notif.created_at).toLocaleDateString("en-PH", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
          {(isApproved || isRelease) && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
              <p className="font-bold mb-1">📋 Next Steps:</p>
              <p>• Visit the Municipal Hall – Business Permits Office</p>
              <p>• Bring a valid ID and required documents</p>
              <p>• Claim your official Franchise Permit</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onNavigate}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm transition shadow"
          >
            Go to Dashboard →
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

// ─── Logout Confirmation Modal ────────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border-t-4 border-red-500">
        {/* Header */}
        <div className="bg-red-50 px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <LogOut size={22} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-red-800">Sign Out</h2>
            <p className="text-xs text-red-400 mt-0.5">Applicant session</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-black">
              ARE YOU SURE YOU WANT TO SIGN OUT?
            </p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Your session will end and you'll be redirected to the home page!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
          >
            <LogOut size={14} />
            YES, SIGN OUT
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-green-500 py-2.5 rounded-xl font-bold text-sm transition"
          >
            STAY LOGGED IN
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function ApplicantLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("applicant_sidebar_collapsed")) ?? false
      );
    } catch {
      return false;
    }
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [navUnread, setNavUnread] = useState(() =>
    parseInt(localStorage.getItem("notif_unread") || "0", 10),
  );
  const [bellModal, setBellModal] = useState(null);

  const dropdownRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(
      "applicant_sidebar_collapsed",
      JSON.stringify(collapsed),
    );
  }, [collapsed]);

  // Load profile
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single();
      setProfile(data || { full_name: "Applicant", email: user.email });
    };
    load();
  }, []);

  // Poll notifications every 30s
  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("notifications")
        .select(
          "id, title, message, notification_type, sender_type, is_read, created_at, application_id",
        )
        .eq("recipient_id", user.id)
        .eq("recipient_type", "applicant")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      const all = data || [];
      setNotifications(all.slice(0, 8));
      const count = all.length;
      setNavUnread(count);
      localStorage.setItem("notif_unread", String(count));
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Listen for sync from Notifications page
  useEffect(() => {
    const h = (e) => {
      setNavUnread(e.detail);
      localStorage.setItem("notif_unread", String(e.detail));
    };
    window.addEventListener("notif_unread_update", h);
    return () => window.removeEventListener("notif_unread_update", h);
  }, []);

  // Click outside dropdown
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ✅ Redirects to landing page "/" instead of "/login"
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("recipient_type", "applicant")
      .eq("is_read", false);
    setNotifications([]);
    setNavUnread(0);
    localStorage.setItem("notif_unread", "0");
    window.dispatchEvent(new CustomEvent("notif_unread_update", { detail: 0 }));
  };

  const handleNotifClick = async (notif) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notif.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    const newCount = Math.max(navUnread - 1, 0);
    setNavUnread(newCount);
    localStorage.setItem("notif_unread", String(newCount));
    window.dispatchEvent(
      new CustomEvent("notif_unread_update", { detail: newCount }),
    );
    setShowDropdown(false);
    const type = notif.notification_type || "";
    const title = notif.title?.toLowerCase() || "";
    if (type.includes("appointment") || title.includes("appointment")) {
      setBellModal({ type: "appointment", notif });
    } else {
      setBellModal({ type: "notif", notif });
    }
  };

  const getNotifDot = (notif) => {
    const title = notif.title?.toLowerCase() || "";
    const type = notif.notification_type || "";
    if (title.includes("approved")) return "bg-green-500";
    if (title.includes("rejected")) return "bg-red-500";
    if (title.includes("review")) return "bg-blue-500";
    if (title.includes("appointment")) return "bg-blue-400";
    if (type.includes("expiry") || title.includes("expir"))
      return "bg-orange-500";
    return "bg-gray-400";
  };

  const formatTime = (date) => {
    const diffMin = Math.floor((new Date() - new Date(date)) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
  };

  const menuItems = [
    { path: "/applicant/dashboard", icon: Home, label: "Home" },
    { path: "/applicant/apply", icon: ClipboardList, label: "My Applications" },
    { path: "/applicant/appointments", icon: Calendar, label: "Appointments" },
    {
      path: "/applicant/notifications",
      icon: Bell,
      label: "Notifications",
      badge: true,
    },
    { path: "/applicant/settings", icon: Settings, label: "Settings" },
  ];

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* ── Bell Modals ── */}
      {bellModal?.type === "appointment" && (
        <AppointmentModal
          notif={bellModal.notif}
          onClose={() => setBellModal(null)}
          onNavigate={() => {
            setBellModal(null);
            navigate("/applicant/appointments");
          }}
        />
      )}
      {bellModal?.type === "notif" && (
        <NotifDetailModal
          notif={bellModal.notif}
          onClose={() => setBellModal(null)}
          onNavigate={() => {
            setBellModal(null);
            navigate("/applicant/dashboard");
          }}
        />
      )}

      {/* ── Logout Modal ── */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════ */}
      <aside
        className={`flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shadow-sm transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
              <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" />
              <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" />
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" />
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 leading-tight truncate">
                San Jose
              </p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.18em] leading-tight">
                Applicant Portal
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="px-3 py-2 flex justify-center border-b border-gray-100">
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
                title={collapsed ? item.label : ""}
              >
                <Icon
                  size={17}
                  className={`flex-shrink-0 ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-[13px]">
                      {item.label}
                    </span>
                    {item.badge && navUnread > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                          isActive
                            ? "bg-white text-gray-900"
                            : "bg-gray-900 text-white"
                        }`}
                      >
                        {navUnread > 99 ? "99+" : navUnread}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && navUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── User + Logout section ── */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {/* Profile card */}
          <div
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 bg-gray-50 border border-gray-100 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-black text-orange-600 flex-shrink-0 ring-2 ring-orange-200">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-800 truncate leading-tight">
                  {profile?.full_name || "Applicant"}
                </p>
                <p className="text-[10px] text-orange-400 font-semibold leading-tight capitalize">
                  Applicant
                </p>
              </div>
            )}
          </div>

          {/* Sign Out button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold
              text-red-500 hover:text-red-600 hover:bg-red-50 border border-transparent
              hover:border-red-100 transition-all duration-150 ${
                collapsed ? "justify-center" : ""
              }`}
            title={collapsed ? "Sign Out" : ""}
          >
            <LogOut size={14} className="flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                Applicant Portal
              </p>
              <p className="text-sm font-bold text-gray-800 leading-tight mt-0.5">
                San Jose Franchise System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3" ref={dropdownRef}>
            {/* Language */}
            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
              <Globe size={13} />
              <span>English</span>
            </button>

            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown((p) => !p)}
                className="relative p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 hover:text-gray-700"
              >
                <Bell size={18} />
                {navUnread > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-11 w-80 bg-white shadow-xl rounded-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Notifications
                      </p>
                      <p className="text-xs text-gray-400">
                        {navUnread} unread
                      </p>
                    </div>
                    {navUnread > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-orange-500 hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-medium">
                        No new notifications
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {notifications.map((notif) => {
                        const isAppt =
                          (notif.notification_type || "").includes(
                            "appointment",
                          ) ||
                          (notif.title || "")
                            .toLowerCase()
                            .includes("appointment");
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getNotifDot(notif)}`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-gray-800 truncate">
                                  {notif.title}
                                </p>
                                {isAppt && (
                                  <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                                    📅 Tap
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-gray-300 mt-1 font-mono">
                                {formatTime(notif.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/applicant/notifications");
                      }}
                      className="w-full text-center text-xs py-3 text-orange-500 hover:bg-orange-50 font-semibold transition"
                    >
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
