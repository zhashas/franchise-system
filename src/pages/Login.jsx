import { useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!role) {
      setError("Please select your role before signing in.")
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      setError("Error fetching account role.")
      setLoading(false)
      return
    }

    if (profile.role !== role) {
      setError("Selected role does not match your account.")
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (role === "admin") navigate("/admin/dashboard")
    else if (role === "staff") navigate("/staff/dashboard")
    else navigate("/applicant/dashboard")

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 bg-blue-900 flex-col items-center justify-center p-10 text-white">
        <div className="bg-orange-500 p-4 rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">San Jose Franchise System</h1>
        <p className="text-blue-200 text-center text-sm">Online Franchise Registration & Renewal</p>
        <p className="text-blue-300 text-center text-xs mt-2">Municipality of San Jose, Occidental Mindoro</p>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">

          {/* Mobile Header */}
          <div className="md:hidden text-center mb-8">
            <div className="bg-orange-500 p-3 rounded-full inline-block mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-blue-900">San Jose Franchise System</h1>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-orange-500">
            <h2 className="text-2xl font-bold text-blue-900 mb-1">Welcome Back!</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Login As <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "admin", label: "🛡️ Admin" },
                    { value: "staff", label: "👨‍💼 Staff" },
                    { value: "applicant", label: "🛺 Applicant" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`border-2 rounded-lg py-2 text-sm font-medium transition ${
                        role === r.value
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-gray-200 text-gray-500 hover:border-orange-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold transition duration-200"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <a href="/register" className="text-orange-500 font-medium hover:underline">
                  Register here
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2025 Municipality of San Jose, Occidental Mindoro
          </p>
        </div>
      </div>
    </div>
  )
}