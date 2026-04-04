import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"

export default function AdminSettings() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setMessage("")
    setError("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match!")
      return
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setError(error.message)
    else {
      setMessage("Password changed successfully!")
      setNewPassword("")
      setConfirmPassword("")
    }
    setLoading(false)
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-900">⚙️ Settings</h1>
          <p className="text-gray-500 text-sm">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Change Password */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-orange-500">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">🔒 Change Password</h2>
            {message && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">{message}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold text-sm transition">
                {loading ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>

          {/* About */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-blue-500 text-center">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">ℹ️ About the System</h2>
            <p className="font-bold text-blue-900 text-sm">Tricycle eFranchise System</p>
            <p className="text-gray-500 text-xs mt-1">for San Jose Tricycle Franchising Unit</p>
            <p className="text-gray-500 text-xs">San Jose, Occidental Mindoro</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Version 1.0.0</p>
              <p className="text-xs text-gray-400 mt-1">© 2025 Municipality of San Jose</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}