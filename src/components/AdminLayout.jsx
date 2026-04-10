import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { logActivity } from "../lib/Logger"
import {
  Home, ClipboardList, Calendar, BarChart3, Bell, LogOut,
  ChevronLeft, ChevronRight, Settings, X, Clock, MapPin, CheckCircle,
  Users, KeyRound, UserPlus, ChevronDown, ChevronUp, UserCog, Activity
} from "lucide-react"
import { getCategory } from "../utils/notificationUtils"

const DOT_COLOR = {
  new_application: "bg-green-500",
  renewal:         "bg-orange-500",
  appointment:     "bg-blue-500",
  document:        "bg-purple-500",
  inquiry:         "bg-yellow-400",
  application:     "bg-green-500",
  other:           "bg-gray-400",
}

const formatTimeAgo = (date) => {
  const diffMin = Math.floor((Date.now() - new Date(date)) / 60000)
  if (diffMin < 1)    return "Just now"
  if (diffMin < 60)   return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
  return `${Math.floor(diffMin / 1440)}d ago`
}

// ─── Sidebar avatar ───────────────────────────────────────────────────────────
function SidebarAvatar({ name }) {
  const initials = (name || "AD").split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("")
  return (
    <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

// ─── Appointment modal ────────────────────────────────────────────────────────
function AppointmentModal({ notif, onClose, onNavigate }) {
  if (!notif) return null
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
  const fmtTime = (d) => new Date(d).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-blue-500">
        <div className="bg-blue-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-3xl">📅</div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-blue-800">Appointment Request</h2>
            <p className="text-xs text-blue-500 mt-0.5">From: Applicant</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Message</p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
            {notif.profiles?.full_name && <p className="text-xs text-orange-500 mt-2 font-medium">👤 From: {notif.profiles.full_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-1"><Clock size={12} className="text-blue-500" /><p className="text-xs font-semibold text-blue-600">Received</p></div>
              <p className="text-xs font-bold text-blue-800">{fmtDate(notif.created_at)}</p>
              <p className="text-xs text-blue-600">{fmtTime(notif.created_at)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
              <div className="flex items-center gap-1.5 mb-1"><CheckCircle size={12} className="text-orange-500" /><p className="text-xs font-semibold text-orange-600">Action Needed</p></div>
              <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Schedule →</span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-1"><MapPin size={12} /><span>Admin Action Required:</span></div>
            <p>• Review the applicant's request in Appointments</p>
            <p>• Set a date and time for the appointment</p>
            <p>• Notify the applicant once confirmed</p>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onNavigate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow">Go to Appointments →</button>
          <button onClick={onClose}    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition">Dismiss</button>
        </div>
      </div>
    </div>
  )
}

// ─── Application modal ────────────────────────────────────────────────────────
function ApplicationModal({ notif, onClose, onNavigate }) {
  if (!notif) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-green-500">
        <div className="bg-green-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-3xl">📋</div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-green-800">New Application Received</h2>
            <p className="text-xs text-green-600 mt-0.5">Requires your review</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Notification Details</p>
            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
            {notif.profiles?.full_name && <p className="text-xs text-orange-500 mt-2 font-medium">👤 Applicant: {notif.profiles.full_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-1">Received</p>
              <p className="text-xs font-bold text-gray-800">{new Date(notif.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 text-center">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">Pending Review</span>
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
          <button onClick={onNavigate} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm transition shadow">View Application →</button>
          <button onClick={onClose}    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition">Later</button>
        </div>
      </div>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout({ children, backPath, backLabel }) {
  const [collapsed,        setCollapsed]        = useState(() => { try { return JSON.parse(localStorage.getItem("admin_sidebar")) ?? false } catch { return false } })
  const [showLogoutModal,  setShowLogoutModal]  = useState(false)
  const [unreadCount,      setUnreadCount]      = useState(0)
  const [bellNotifs,       setBellNotifs]       = useState([])
  const [showDropdown,     setShowDropdown]     = useState(false)
  const [appointmentNotif, setAppointmentNotif] = useState(null)
  const [applicationNotif, setApplicationNotif] = useState(null)
  const [settingsOpen,     setSettingsOpen]     = useState(false)
  const [adminProfile,     setAdminProfile]     = useState(null)

  const dropdownRef = useRef()
  const seenIds     = useRef(new Set())
  const navigate    = useNavigate()
  const location    = useLocation()

  const settingsSubItems = [
    { path: "/admin/staff",         icon: Users,    label: "Add Staff"       },
    { path: "/admin/add-applicant", icon: UserPlus, label: "Add Applicant"   },
    { path: "/admin/logs",          icon: Activity, label: "Activity Logs"   },
    { path: "/admin/settings",      icon: KeyRound, label: "Change Password" },
  ]

  const isSettingsActive    = settingsSubItems.some(s => location.pathname === s.path)
  const settingsMenuOpen    = settingsOpen || isSettingsActive

  // Persist sidebar state
  useEffect(() => { localStorage.setItem("admin_sidebar", JSON.stringify(collapsed)) }, [collapsed])

  // Load admin profile
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()
      setAdminProfile(data || { full_name: "Administrator", email: user.email })
    }
    load()
  }, [])

  // ── Load unread notifications + realtime subscription ──────────────────────
  // This runs on every page so the badge is always current.
  useEffect(() => {
    let channel
    let cancelled = false

    const loadUnread = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, profiles!notifications_sender_id_fkey(full_name)")
        .eq("recipient_type", "admin")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(50)

      if (cancelled || error) return
      const rows = data || []
      rows.forEach(n => seenIds.current.add(n.id))
      setBellNotifs(rows.slice(0, 10))
      setUnreadCount(rows.length)
    }

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      channel = supabase
        .channel(`admin-layout-notif-${user.id}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          async (payload) => {
            if (cancelled) return
            const row = payload.new
            if (row.recipient_type !== "admin") return
            if (row.recipient_id && row.recipient_id !== user.id) return
            if (seenIds.current.has(row.id)) return
            seenIds.current.add(row.id)

            let enriched = { ...row, profiles: null }
            if (row.sender_id) {
              const { data: p } = await supabase.from("profiles").select("full_name").eq("id", row.sender_id).single()
              enriched.profiles = p || null
            }

            setBellNotifs(prev => [enriched, ...prev].slice(0, 10))
            setUnreadCount(prev => prev + 1)
          }
        )
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications" },
          (payload) => {
            if (cancelled) return
            const updated = payload.new
            if (updated.is_read) {
              setBellNotifs(prev => prev.filter(n => n.id !== updated.id))
              setUnreadCount(prev => Math.max(prev - 1, 0))
            }
          }
        )
        .subscribe()
    }

    loadUnread()
    setupRealtime()

    // Also listen to events from AdminNotifications page (belt-and-suspenders)
    const onCount = (e) => setUnreadCount(e.detail?.count ?? e.detail ?? 0)
    const onRows  = (e) => setBellNotifs(e.detail || [])
    window.addEventListener("adminUnreadCount", onCount)
    window.addEventListener("admin_bell_rows",  onRows)

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
      window.removeEventListener("adminUnreadCount", onCount)
      window.removeEventListener("admin_bell_rows",  onRows)
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  // ── Bell notification click ────────────────────────────────────────────────
  const handleBellNotifClick = async (notif) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id)
    setBellNotifs(prev => prev.filter(n => n.id !== notif.id))
    setUnreadCount(prev => Math.max(prev - 1, 0))
    setShowDropdown(false)

    const cat = getCategory(notif)
    if (cat === "appointment")                                        { setAppointmentNotif(notif); return }
    if (["new_application", "renewal", "application"].includes(cat)) { setApplicationNotif(notif); return }
    if (notif.application_id) navigate(`/admin/applications/${notif.application_id}`)
    else navigate("/admin/notifications")
  }

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ is_read: true })
      .eq("recipient_type", "admin").eq("is_read", false)
    setBellNotifs([])
    setUnreadCount(0)
  }

  const handleLogout = async () => {
    await logActivity({ action: "logout", details: "Admin signed out" })
    await supabase.auth.signOut()
    navigate("/")
  }

  // ── Nav items ──────────────────────────────────────────────────────────────
  const mainMenuItems = [
    { path: "/admin/dashboard",     icon: Home,          label: "Home"          },
    { path: "/admin/applications",  icon: ClipboardList, label: "Applications"  },
    { path: "/admin/appointments",  icon: Calendar,      label: "Appointments"  },
    { path: "/admin/reports",       icon: BarChart3,     label: "Reports"       },
    { path: "/admin/notifications", icon: Bell,          label: "Notifications", badge: true },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      {appointmentNotif && (
        <AppointmentModal
          notif={appointmentNotif}
          onClose={() => setAppointmentNotif(null)}
          onNavigate={() => { setAppointmentNotif(null); navigate("/admin/appointments") }}
        />
      )}
      {applicationNotif && (
        <ApplicationModal
          notif={applicationNotif}
          onClose={() => setApplicationNotif(null)}
          onNavigate={() => {
            const id = applicationNotif.application_id
            setApplicationNotif(null)
            navigate(id ? `/admin/applications/${id}` : "/admin/applications")
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`flex-shrink-0 bg-gradient-to-b from-orange-600 to-orange-500 text-white flex flex-col shadow-xl transition-all duration-300 h-screen sticky top-0 ${collapsed ? "w-16" : "w-56"}`}>
        
        <div className={`flex items-center gap-2.5 px-3 py-3 rounded-xl bg-orange-700/40 border border-orange-400/30 ${collapsed ? "justify-center" : ""}`}>
          <SidebarAvatar name={adminProfile?.full_name} />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{adminProfile?.full_name || "Administrator"}</p>
                <p className="text-[10px] text-orange-200 truncate mt-0.5">{adminProfile?.email || ""}</p>
              </div>
              <UserCog size={13} className="text-orange-300 flex-shrink-0" />
            </>
          )}
        </div>

        <button onClick={() => setCollapsed(p => !p)} className="mx-auto mt-2 text-orange-200 hover:text-white transition">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {mainMenuItems.map((item) => {
            const Icon     = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition relative ${isActive ? "bg-white text-orange-600 shadow" : "text-white hover:bg-orange-400"}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {item.badge && unreadCount > 0 && (
                  <span className={`absolute ${collapsed ? "top-0.5 right-0.5" : "right-3"} bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )
          })}

          {/* Settings dropdown */}
          <div>
            <button
              onClick={() => collapsed ? navigate("/admin/settings") : setSettingsOpen(p => !p)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${isSettingsActive ? "bg-white text-orange-600 shadow" : "text-white hover:bg-orange-400"}`}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Settings</span>
                  {settingsMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </>
              )}
            </button>
            {!collapsed && settingsMenuOpen && (
              <div className="mt-1 ml-3 space-y-0.5 border-l-2 border-orange-400 pl-3">
                {settingsSubItems.map((sub) => {
                  const SubIcon  = sub.icon
                  const isActive = location.pathname === sub.path
                  return (
                    <button
                      key={sub.path}
                      onClick={() => navigate(sub.path)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition ${isActive ? "bg-white text-orange-600 shadow" : "text-orange-100 hover:bg-orange-400 hover:text-white"}`}
                    >
                      <SubIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{sub.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="px-2 pb-3 space-y-1 border-t border-orange-400 pt-2">
          <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white hover:bg-orange-400 transition">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm px-6 py-3 flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-gray-500">Municipality of San Jose, Occidental Mindoro</p>

          <div className="flex items-center gap-4" ref={dropdownRef}>
            {/* Bell */}
            <div className="relative">
              <button onClick={() => setShowDropdown(p => !p)} className="relative p-1">
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-9 w-80 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                    <div>
                      <p className="text-sm font-bold text-gray-800">🔔 Notifications</p>
                      <p className="text-xs text-gray-400">{unreadCount} unread</p>
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-orange-500 hover:underline font-medium">Mark all read</button>
                    )}
                  </div>

                  {bellNotifs.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      <p className="text-2xl mb-2">🔔</p>
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {bellNotifs.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleBellNotifClick(notif)}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-orange-50 transition"
                        >
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${DOT_COLOR[getCategory(notif)] || "bg-gray-400"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{notif.title}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{notif.message}</p>
                            {notif.profiles?.full_name && <p className="text-xs text-orange-400 mt-0.5 truncate">👤 {notif.profiles.full_name}</p>}
                            <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notif.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t">
                    <button
                      onClick={() => { setShowDropdown(false); navigate("/admin/notifications") }}
                      className="w-full text-center text-xs py-2.5 text-orange-500 hover:bg-orange-50 font-semibold transition"
                    >
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {backPath && (
              <button onClick={() => navigate(backPath)} className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-orange-200">
                ← {backLabel || "Back"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border-t-4 border-orange-500">
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">🚪</p>
              <h2 className="text-lg font-bold text-blue-900">Logout Confirmation</h2>
              <p className="text-sm text-gray-500 mt-1">Are you sure you want to logout?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleLogout}              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm transition">Yes, Logout</button>
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold text-sm transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}