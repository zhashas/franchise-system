import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/Logger";
import {
  Home,
  ClipboardList,
  Calendar,
  BarChart3,
  Bell,
  LogOut,
  Settings,
  X,
  Clock,
  MapPin,
  CheckCircle,
  Users,
  UserPlus,
  Activity,
  Globe,
  ChevronLeft,
  ChevronRight,
  LogIn,
} from "lucide-react";
import { getCategory } from "../utils/notificationUtils";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DOT_COLOR = {
  new_application: "bg-green-500",
  renewal: "bg-orange-500",
  appointment: "bg-blue-500",
  document: "bg-purple-500",
  inquiry: "bg-yellow-400",
  application: "bg-green-500",
  other: "bg-gray-400",
};

const formatTimeAgo = (date) => {
  const diffMin = Math.floor((Date.now() - new Date(date)) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
  return `${Math.floor(diffMin / 1440)}d ago`;
};

// ─── Appointment modal ────────────────────────────────────────────────────────
function AppointmentModal({ notif, onClose, onNavigate }) {
  if (!notif) return null;
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-PH", {
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
                {fmtDate(notif.created_at)}
              </p>
              <p className="text-xs text-blue-600">
                {fmtTime(notif.created_at)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} className="text-orange-500" />
                <p className="text-xs font-semibold text-orange-600">
                  Action Needed
                </p>
              </div>
              <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                Schedule →
              </span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <MapPin size={12} />
              <span>Admin Action Required:</span>
            </div>
            <p>• Review the applicant's request in Appointments</p>
            <p>• Set a date and time for the appointment</p>
            <p>• Notify the applicant once confirmed</p>
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
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-green-500">
        <div className="bg-green-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-3xl">
            📋
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-green-800">
              New Application Received
            </h2>
            <p className="text-xs text-green-600 mt-0.5">
              Requires your review
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
            <p className="font-bold mb-1">📋 Admin Checklist:</p>
            <p>• Open the application to review all submitted documents</p>
            <p>• Verify engine number, chassis number, and plate number</p>
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
            <p className="text-xs text-red-400 mt-0.5">Administrator session</p>
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
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-green-500 py2.5 rounded-xl font-bold text-sm transition"
          >
            STAY LOGGED IN
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("admin_sidebar_collapsed")) ?? false
      );
    } catch {
      return false;
    }
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellNotifs, setBellNotifs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [appointmentNotif, setAppointmentNotif] = useState(null);
  const [applicationNotif, setApplicationNotif] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);

  const dropdownRef = useRef();
  const seenIds = useRef(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("admin_sidebar_collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const navItems = [
    { path: "/admin/dashboard", icon: Home, label: "Home" },
    { path: "/admin/applications", icon: ClipboardList, label: "Applications" },
    { path: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { path: "/admin/reports", icon: BarChart3, label: "Reports" },
    {
      path: "/admin/notifications",
      icon: Bell,
      label: "Notifications",
      badge: true,
    },
    { path: "/admin/staff", icon: Users, label: "Manage Staff" },
    { path: "/admin/add-applicant", icon: UserPlus, label: "Add Applicant" },
    { path: "/admin/logs", icon: Activity, label: "Activity Logs" },
    { path: "/admin/settings", icon: Settings, label: "Account Settings" },
  ];

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
      setAdminProfile(
        data || { full_name: "User", email: user.email, role: "Administrator" },
      );
    };
    load();
  }, []);

  useEffect(() => {
    let channel;
    let cancelled = false;

    const loadUnread = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, profiles!notifications_sender_id_fkey(full_name)")
        .eq("recipient_type", "admin")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled || error) return;
      const rows = data || [];
      rows.forEach((n) => seenIds.current.add(n.id));
      setBellNotifs(rows.slice(0, 10));
      setUnreadCount(rows.length);
    };

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      channel = supabase
        .channel(`admin-layout-notif-${user.id}`)
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
                .select("full_name")
                .eq("id", row.sender_id)
                .single();
              enriched.profiles = p || null;
            }
            setBellNotifs((prev) => [enriched, ...prev].slice(0, 10));
            setUnreadCount((prev) => prev + 1);
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications" },
          (payload) => {
            if (cancelled) return;
            const updated = payload.new;
            if (updated.is_read) {
              setBellNotifs((prev) => prev.filter((n) => n.id !== updated.id));
              setUnreadCount((prev) => Math.max(prev - 1, 0));
            }
          },
        )
        .subscribe();
    };

    loadUnread();
    setupRealtime();

    const onCount = (e) => setUnreadCount(e.detail?.count ?? e.detail ?? 0);
    const onRows = (e) => setBellNotifs(e.detail || []);
    window.addEventListener("adminUnreadCount", onCount);
    window.addEventListener("admin_bell_rows", onRows);

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener("adminUnreadCount", onCount);
      window.removeEventListener("admin_bell_rows", onRows);
    };
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleBellNotifClick = async (notif) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notif.id);
    setBellNotifs((prev) => prev.filter((n) => n.id !== notif.id));
    setUnreadCount((prev) => Math.max(prev - 1, 0));
    setShowDropdown(false);
    const cat = getCategory(notif);
    if (cat === "appointment") {
      setAppointmentNotif(notif);
      return;
    }
    if (["new_application", "renewal", "application"].includes(cat)) {
      setApplicationNotif(notif);
      return;
    }
    if (notif.application_id)
      navigate(`/admin/applications/${notif.application_id}`);
    else navigate("/admin/notifications");
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_type", "admin")
      .eq("is_read", false);
    setBellNotifs([]);
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    await logActivity({ action: "logout", details: "Admin signed out" });
    await supabase.auth.signOut();
    navigate("/");
  };

  const initials =
    (adminProfile?.full_name || "U")
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "U";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* ── Modals ── */}
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

      {/* ── Logout Modal ── */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      {/* ═══SIDEBAR═══ */}
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
                Franchise System
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
          {navItems.map(({ path, icon, label, badge }) => {
            const isActive = location.pathname === path;
            const Icon = icon;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
                title={collapsed ? label : ""}
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
                      {label}
                    </span>
                    {badge && unreadCount > 0 && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                          isActive
                            ? "bg-white text-gray-900"
                            : "bg-gray-900 text-white"
                        }`}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge && unreadCount > 0 && (
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
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-black text-orange-600 flex-shrink-0 ring-2 ring-orange-200">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-800 truncate leading-tight">
                  {adminProfile?.full_name || "User"}
                </p>
                <p className="text-[10px] text-orange-400 font-semibold leading-tight capitalize">
                  {adminProfile?.role || "Administrator"}
                </p>
              </div>
            )}
          </div>

          {/* Logout button */}
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
                Administrator
              </p>
              <p className="text-sm font-bold text-gray-800 leading-tight mt-0.5">
                San Jose Municipal Portal
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
                {unreadCount > 0 && (
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
                        {unreadCount} unread
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-orange-500 hover:underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {bellNotifs.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-medium">
                        No new notifications
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {bellNotifs.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleBellNotifClick(notif)}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              DOT_COLOR[getCategory(notif)] || "bg-gray-400"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {notif.message}
                            </p>
                            {notif.profiles?.full_name && (
                              <p className="text-xs text-orange-400 mt-0.5 truncate">
                                👤 {notif.profiles.full_name}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-300 mt-1 font-mono">
                              {formatTimeAgo(notif.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/admin/notifications");
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
