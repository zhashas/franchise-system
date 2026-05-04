import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/Logger";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("credentials");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setStep("credentials");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setStep("fetching_role");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError("Could not retrieve your account role. Please contact support.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    try {
      await logActivity({
        action: "login",
        details: `${profile.full_name || email} signed in as ${profile.role}`,
      });
    } catch (logErr) {
      console.warn("[Login] logActivity failed:", logErr?.message);
    }

    const role = profile.role?.toLowerCase();

    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "staff") navigate("/staff/dashboard");
    else if (role === "applicant") navigate("/applicant/dashboard");
    else {
      setError(
        `Unknown account role "${profile.role}". Please contact support.`,
      );
      await supabase.auth.signOut();
    }

    setLoading(false);
  };

  const loadingLabel =
    step === "fetching_role" ? "Checking account…" : "Signing in…";

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden md:flex w-1/2 bg-blue-900 flex-col items-center justify-center p-10 text-white">
        <div className="bg-orange-500 p-4 rounded-full mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">
          San Jose Franchise System
        </h1>
        <p className="text-blue-200 text-center text-sm">
          Online Franchise Registration &amp; Renewal
        </p>
        <p className="text-blue-300 text-center text-xs mt-2">
          Municipality of San Jose, Occidental Mindoro
        </p>

        <div className="mt-10 space-y-3 w-full max-w-xs">
          {[
            "🛺 Apply for tricycle franchise online",
            "🔄 Renew existing franchises easily",
            "📋 Track your application status",
            "📅 Schedule appointments with the office",
          ].map((text, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-blue-800/50 rounded-xl px-4 py-2.5"
            >
              <span className="text-sm text-blue-100">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="md:hidden text-center mb-8">
            <div className="bg-orange-500 p-3 rounded-full inline-block mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-blue-900">
              San Jose Franchise System
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Municipality of San Jose, Occidental Mindoro
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-orange-500">
            <h2 className="text-2xl font-bold text-blue-900 mb-1">
              Welcome Back!
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Sign in with your email and password to continue
            </p>

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-5 text-sm flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* ✅ Blue verification banner completely removed */}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2"
              >
                {loading && <span className="animate-spin text-sm">⏳</span>}
                {loading ? loadingLabel : "Sign In →"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="text-orange-500 font-medium hover:underline"
                >
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
  );
}
