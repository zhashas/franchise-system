import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import {
  Home, ClipboardList, Calendar, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, FileText
} from "lucide-react"

export default function ApplicantLayout({ children, backPath, backLabel }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("applicant_sidebar")) ?? false }
    catch { return false }
  })
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    localStorage.setItem("applicant_sidebar", JSON.stringify(collapsed))
  }, [collapsed])

  // ── Load notifications (recipient_id = user.id, recipient_type = applicant) ──
  useEffect(() => {
    let channel

    const loadNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("recipient_type", "applicant")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(50)

      const all = data || []
      setNotifications(all.slice(0, 8))
      setUnreadCount(all.length)
    }

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await loadNotifications()

      channel = supabase
        .channel(`applicant-layout-notif-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => loadNotifications())
        .subscribe()
    }

    setupRealtime()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("notifications").update({ is_read: true })
      .eq("recipient_id", user.id).eq("recipient_type", "applicant").eq("is_read", false)
    setNotifications([])
    setUnreadCount(0)
  }

  const handleNotifClick = async (notif) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id)
    setNotifications(prev => prev.filter(n => n.id !== notif.id))
    setUnreadCount(prev => Math.max(prev - 1, 0))
    setShowDropdown(false)

    const type = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""
    if (type.includes("appointment") || title.includes("appointment")) navigate("/applicant/appointments")
    else navigate("/applicant/notifications")
  }

  const getNotifDot = (notif) => {
    const type = notif.notification_type || ""
    const title = notif.title?.toLowerCase() || ""
    if (title.includes("approved")) return "bg-green-500"
    if (title.includes("rejected")) return "bg-red-500"
    if (title.includes("review")) return "bg-blue-500"
    if (title.includes("appointment")) return "bg-blue-400"
    if (type.includes("expiry") || title.includes("expir")) return "bg-orange-500"
    if (type.includes("mtop") || title.includes("mtop")) return "bg-blue-300"
    if (type.includes("recycled")) return "bg-purple-400"
    return "bg-gray-400"
  }

  const formatTime = (date) => {
    const diffMin = Math.floor((new Date() - new Date(date)) / 60000)
    if (diffMin < 1) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
    return `${Math.floor(diffMin / 1440)}d ago`
  }

  const menuItems = [
    { path: "/applicant/dashboard", icon: Home, label: "Home" },
    { path: "/applicant/apply", icon: ClipboardList, label: "My Applications" },
    { path: "/applicant/appointments", icon: Calendar, label: "Appointments" },
    { path: "/applicant/notifications", icon: Bell, label: "Notifications", badge: true },
    { path: "/applicant/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── SIDEBAR ── */}
      <div className={`flex-shrink-0 bg-gradient-to-b from-orange-600 to-orange-500 text-white flex flex-col shadow-xl transition-all duration-300 h-screen sticky top-0 ${collapsed ? "w-16" : "w-56"}`}>

        {/* Logo */}
        <div className="p-4 border-b border-orange-400 flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-full flex-shrink-0">
            <FileText className="w-5 h-5 text-orange-500" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-xs leading-tight">San Jose</p>
              <p className="text-orange-200 text-xs">Franchise System</p>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className="mx-auto mt-2 text-orange-200 hover:text-white transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Menu */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition relative ${
                  isActive ? "bg-white text-orange-600 shadow" : "text-white hover:bg-orange-400"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {/* Badge on Notifications */}
                {item.badge && unreadCount > 0 && (
                  <span className={`${collapsed ? "absolute top-0.5 right-0.5" : ""} bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none`}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-orange-400">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white hover:bg-orange-400 transition"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <div className="bg-white shadow-sm px-6 py-3 flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-gray-500">Municipality of San Jose, Occidental Mindoro</p>

          <div className="flex items-center gap-4 relative" ref={dropdownRef}>

            {/* Bell Button */}
            <button onClick={() => setShowDropdown(prev => !prev)} className="relative p-1">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Bell Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-9 w-80 bg-white shadow-xl rounded-xl border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                  <div>
                    <p className="text-sm font-bold text-gray-800">🔔 Notifications</p>
                    <p className="text-xs text-gray-400">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-orange-500 hover:underline font-medium">
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    <p className="text-2xl mb-2">🔔</p>
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.map((notif) => (
                      <div key={notif.id} onClick={() => handleNotifClick(notif)}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-orange-50 transition">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getNotifDot(notif)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(notif.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t">
                  <button
                    onClick={() => { setShowDropdown(false); navigate("/applicant/notifications") }}
                    className="w-full text-center text-xs py-2.5 text-orange-500 hover:bg-orange-50 font-semibold transition"
                  >
                    View All Notifications →
                  </button>
                </div>
              </div>
            )}

            {backPath && (
              <button onClick={() => navigate(backPath)}
                className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-orange-200">
                ← {backLabel || "Back"}
              </button>
            )}

            <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium">
              🛺 Applicant
            </span>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm border-t-4 border-orange-500">
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">🚪</p>
              <h2 className="text-lg font-bold text-blue-900">Logout Confirmation</h2>
              <p className="text-sm text-gray-500 mt-1">Are you sure you want to logout?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleLogout} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm transition">
                Yes, Logout
              </button>
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold text-sm transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}