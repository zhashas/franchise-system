import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/Logger";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  Shield,
  Clock,
  FileText,
  Calendar,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ChevronLeft,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("credentials");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setStep("credentials");

    try {
      // Step 1: Authenticate
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (authError) throw authError;

      setStep("fetching_role");

      // Step 2: Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error(
          "Could not retrieve your account role. Please contact support.",
        );
      }

      // Step 3: Log activity
      try {
        await logActivity({
          action: "login",
          details: `${profile.full_name || email} signed in as ${profile.role}`,
        });
      } catch (logErr) {
        console.warn("[Login] logActivity failed:", logErr?.message);
      }

      // Step 4: Navigate based on role
      const role = profile.role?.toLowerCase();

      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "staff") navigate("/staff/dashboard");
      else if (role === "applicant") navigate("/applicant/dashboard");
      else {
        throw new Error(
          `Unknown account role "${profile.role}". Please contact support.`,
        );
      }
    } catch (err) {
      console.error("[Login] Error:", err);
      setError(err.message || "Login failed. Please try again.");
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const loadingSteps = {
    credentials: { text: "Verifying credentials", icon: Shield },
    fetching_role: { text: "Loading your account", icon: Loader2 },
  };

  const currentStep = loadingSteps[step] || loadingSteps.credentials;
  const StepIcon = currentStep.icon;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL - BRANDING & FEATURES
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-orange-400/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-16">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-6">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect x="4" y="4" width="12" height="12" rx="3" fill="white" />
                <rect x="24" y="4" width="12" height="12" rx="3" fill="white" />
                <rect x="4" y="24" width="12" height="12" rx="3" fill="white" />
                <rect
                  x="24"
                  y="24"
                  width="12"
                  height="12"
                  rx="3"
                  fill="white"
                />
              </svg>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-white mb-2">
                San Jose Franchise System
              </h1>
              <p className="text-blue-300 text-sm font-semibold mb-1">
                Online Franchise Registration &amp; Renewal
              </p>
              <p className="text-blue-400 text-xs font-medium">
                Municipality of San Jose, Occidental Mindoro
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="w-full max-w-md space-y-3 mb-8">
            {[
              {
                icon: FileText,
                text: "Apply for tricycle franchise online",
                color: "bg-blue-500/20 border-blue-400/30 text-blue-200",
              },
              {
                icon: Clock,
                text: "Renew existing franchises easily",
                color: "bg-orange-500/20 border-orange-400/30 text-orange-200",
              },
              {
                icon: CheckCircle,
                text: "Track your application status in real-time",
                color: "bg-green-500/20 border-green-400/30 text-green-200",
              },
              {
                icon: Calendar,
                text: "Schedule appointments with the office",
                color: "bg-purple-500/20 border-purple-400/30 text-purple-200",
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 ${feature.color} border backdrop-blur-sm rounded-xl px-4 py-3.5 transition-all duration-300 hover:scale-105`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold">{feature.text}</span>
                </div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 text-blue-300 text-xs">
            <div className="flex items-center gap-1.5">
              <Shield size={14} className="text-green-400" />
              <span className="font-medium">Secure & Encrypted</span>
            </div>
            <div className="w-px h-4 bg-blue-700" />
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-green-400" />
              <span className="font-medium">Official Government Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PANEL - LOGIN FORM
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Back to home */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500 mb-8 transition-colors group"
          >
            <ChevronLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Home
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="10"
                  height="10"
                  rx="2.5"
                  fill="white"
                />
                <rect
                  x="19"
                  y="3"
                  width="10"
                  height="10"
                  rx="2.5"
                  fill="white"
                />
                <rect
                  x="3"
                  y="19"
                  width="10"
                  height="10"
                  rx="2.5"
                  fill="white"
                />
                <rect
                  x="19"
                  y="19"
                  width="10"
                  height="10"
                  rx="2.5"
                  fill="white"
                />
              </svg>
            </div>
            <h1 className="text-xl font-black text-gray-900 mb-1">
              San Jose Franchise System
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Municipality of San Jose, Occidental Mindoro
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-100 px-8 py-6">
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                Welcome Back!
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Sign in to access your account
              </p>
            </div>

            {/* Card Body */}
            <div className="px-8 py-8">
              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertCircle
                    size={20}
                    className="text-red-500 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-800 mb-1">
                      Authentication Failed
                    </p>
                    <p className="text-xs text-red-600 leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <Loader2
                    size={20}
                    className="text-blue-500 animate-spin flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-blue-800">
                      {currentStep.text}...
                    </p>
                    <p className="text-xs text-blue-600">
                      Please wait a moment
                    </p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 hover:border-gray-300"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 hover:border-gray-300"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-orange-500 font-semibold hover:text-orange-600 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 disabled:shadow-none group"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{currentStep.text}...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-500 font-medium">
                    New to the system?
                  </span>
                </div>
              </div>

              {/* Register Link */}
              <button
                onClick={() => navigate("/register")}
                className="w-full bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-3 rounded-xl font-bold transition-all duration-150 flex items-center justify-center gap-2 group"
              >
                <span>Create New Account</span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 space-y-3">
            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-green-500" />
                <span className="font-medium">Secure Login</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <Lock size={14} className="text-blue-500" />
                <span className="font-medium">Encrypted</span>
              </div>
            </div>

            {/* Copyright */}
            <p className="text-center text-xs text-gray-400 font-medium">
              © 2025 Municipality of San Jose, Occidental Mindoro. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
