import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"

// Lucide icons
import {
  Home,
  ClipboardList,
  Calendar,
  BarChart3,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

export default function AdminLayout({ children, backPath, backLabel }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [collapsed, setCollapsed] = useState(true) // ✅ START COLLAPSED
  const [unreadCount, setUnreadCount] = useState(0)

  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  useEffect(() => {
    const fetchUnread = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("is_read", false)

      setUnreadCount(data?.length || 0)
    }

    fetchUnread()

    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchUnread()
      )
      .subscribe()

    return () => supabase.removeChannel(subscription)
  }, [])

  const menuItems = [
    { path: "/admin/dashboard", icon: Home, label: "Home" },
    { path: "/admin/applications", icon: ClipboardList, label: "Applications" },
    { path: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { path: "/admin/reports", icon: BarChart3, label: "Reports" },
    { path: "/admin/notifications", icon: Bell, label: "Notifications" },
  ]

  return (
    <div className="flex h-screen overflow-hidden">

      {/* SIDEBAR */}
      <div className={`bg-gradient-to-b from-orange-600 to-orange-500 text-white flex flex-col shadow-xl transition-all duration-300 h-screen sticky top-0 ${
        collapsed ? "w-16" : "w-56"
      }`}>

        {/* LOGO */}
        <div className="p-4 border-b border-orange-400 flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-full">
            <BarChart3 className="w-5 h-5 text-black" />
          </div>

          {!collapsed && (
            <div>
              <p className="font-bold text-xs">San Jose</p>
              <p className="text-orange-200 text-xs">Franchise System</p>
            </div>
          )}
        </div>

        {/* TOGGLE */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto mt-2 text-white hover:opacity-80"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* MENU */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-black shadow"
                    : "text-white hover:bg-orange-400"
                }`}
              >
                {/* ICON (black when active, white when inactive) */}
                <Icon className="w-5 h-5 flex-shrink-0" />

                {!collapsed && <span>{item.label}</span>}

                {!collapsed &&
                  item.path === "/admin/notifications" &&
                  unreadCount > 0 && (
                    <span className="ml-auto bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                  )}
              </button>
            )
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-3 border-t border-orange-400">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white hover:bg-orange-400 transition"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP BAR */}
        <div className="bg-white shadow-sm px-6 py-3 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Municipality of San Jose, Occidental Mindoro
          </p>

          <div className="flex items-center gap-3">
            {backPath && (
              <button
                onClick={() => navigate(backPath)}
                className="bg-orange-50 text-orange-600 text-xs px-3 py-1 rounded-lg"
              >
                ← {backLabel || "Back"}
              </button>
            )}

            <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
              Admin
            </span>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Logout?</h2>

            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg"
              >
                Yes
              </button>

              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}