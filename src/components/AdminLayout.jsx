import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"

export default function AdminLayout({ children, backPath, backLabel }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnread = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("is_read", false)
      setUnreadCount(data?.length || 0)
    }
    fetchUnread()

    // Real-time listener for notifications
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
    { path: "/admin/dashboard", icon: "🏠", label: "Home" },
    { path: "/admin/applications", icon: "📋", label: "Applications" },
    { path: "/admin/appointments", icon: "📅", label: "Appointments" },
    { path: "/admin/reports", icon: "📊", label: "Report & Analytics" },
    { path: "/admin/notifications", icon: "🔔", label: "Notifications" },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`flex-shrink-0 bg-gradient-to-b from-orange-600 to-orange-500 text-white flex flex-col shadow-xl transition-all duration-300 h-screen sticky top-0 ${collapsed ? "w-16" : "w-56"}`}>
        {/* Logo */}
        <div className="p-4 border-b border-orange-400">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-full flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {!collapsed && (
              <div>
                <p className="font-bold text-xs leading-tight">San Jose</p>
                <p className="text-orange-200 text-xs">Franchise System</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto mt-2 text-orange-200 hover:text-white text-xs px-2 py-1 rounded transition"
        >
          {collapsed ? "→" : "←"}
        </button>

        {/* Menu Items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-orange-600 shadow"
                    : "text-white hover:bg-orange-400"
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}

                {/* Show badge only for notifications */}
                {!collapsed && item.path === "/admin/notifications" && unreadCount > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-orange-400">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-white hover:bg-orange-400 transition"
          >
            <span className="text-lg flex-shrink-0">🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white shadow-sm px-6 py-3 flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-gray-500">Municipality of San Jose, Occidental Mindoro</p>
          <div className="flex items-center gap-3">
            {backPath && (
              <button
                onClick={() => navigate(backPath)}
                className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-orange-200"
              >
                ← {backLabel || "Back"}
              </button>
            )}
            <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium">
              🛡️ Admin
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
              <button
                onClick={handleLogout}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm transition"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold text-sm transition"
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