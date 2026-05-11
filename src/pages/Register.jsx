import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
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
  Check,
  X,
  MailCheck,
} from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    if (strength <= 1)
      return { strength: 1, label: "Weak", color: "bg-red-500" };
    if (strength <= 3)
      return { strength: 2, label: "Fair", color: "bg-yellow-500" };
    if (strength <= 4)
      return { strength: 3, label: "Good", color: "bg-blue-500" };
    return { strength: 4, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      setError("Phone number must be in format: 09XXXXXXXXX");
      return;
    }
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            role: "applicant",
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (signUpError) throw signUpError;
      if (data.session && data.user) {
        setLoading(false);
        navigate("/applicant/dashboard");
        return;
      }
      setLoading(false);
      setSubmitted(true);
    } catch (err) {
      console.error("[Register] Error:", err);
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // EMAIL CONFIRMATION SCREEN
  // ═══════════════════════════════════════════════════════════════════════
  if (submitted) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-16">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30 mb-6">
              <MailCheck size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white text-center mb-2">
              Check Your Email
            </h1>
            <p className="text-blue-300 text-center text-sm max-w-md">
              We've sent a confirmation link to verify your account
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 px-8 py-7 text-center border-b border-green-100">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                  <Check size={32} className="text-white" strokeWidth={3} />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-1">
                  Registration Successful!
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  Please verify your email to continue
                </p>
              </div>
              <div className="px-8 py-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Mail
                      size={18}
                      className="text-blue-500 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-900 mb-0.5">
                        Confirmation Email Sent
                      </p>
                      <p className="text-xs text-blue-700">
                        We sent a verification link to:
                      </p>
                      <p className="text-sm font-black text-blue-900 mt-1 break-all">
                        {formData.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <h3 className="text-sm font-black text-gray-900">
                    Next Steps:
                  </h3>
                  <div className="space-y-2">
                    {[
                      "Check your email inbox for the confirmation link",
                      "Click the link to verify your email address",
                      "Return to this site and sign in with your credentials",
                      "Start applying for your tricycle franchise!",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black">
                          {i + 1}
                        </div>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 mb-4 flex items-start gap-3">
                  <AlertCircle
                    size={16}
                    className="text-yellow-600 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-bold text-yellow-800 mb-0.5">
                      Can't find the email?
                    </p>
                    <p className="text-xs text-yellow-700 leading-relaxed">
                      Check your spam or junk folder. The email should arrive
                      within 5 minutes.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:shadow-xl group"
                  >
                    <span>Go to Sign In</span>
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="w-full bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold transition-all duration-150"
                  >
                    Use Different Email
                  </button>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 font-medium mt-4">
              © 2025 Municipality of San Jose, Occidental Mindoro
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REGISTRATION FORM
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-orange-400/5 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-16">
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
          <div className="w-full max-w-md space-y-3">
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
                  className={`flex items-center gap-3 ${feature.color} border backdrop-blur-sm rounded-xl px-4 py-3 transition-all duration-300 hover:scale-105`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      {/* ↓ Reduced vertical padding to prevent scroll */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center px-6 py-4 sm:px-12 sm:py-6">
        <div className="w-full max-w-lg">
          {/* Back to home */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-500 mb-3 transition-colors group"
          >
            <ChevronLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Home
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-200">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
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
            <h1 className="text-lg font-black text-gray-900 mb-0.5">
              San Jose Franchise System
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Create your applicant account
            </p>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Card Header — reduced py */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-100 px-8 py-4">
              <h2 className="text-xl font-black text-gray-900 mb-0.5">
                Create Account
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Register as a Tricycle Operator or Driver
              </p>
            </div>

            {/* Card Body — reduced py and tighter form spacing */}
            <div className="px-8 py-5">
              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4 flex items-start gap-3">
                  <AlertCircle
                    size={18}
                    className="text-red-500 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-800 mb-0.5">
                      Registration Error
                    </p>
                    <p className="text-xs text-red-600 leading-relaxed">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Registration Form — space-y-4 instead of space-y-5 */}
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      name="full_name"
                      placeholder="Juan Dela Cruz"
                      className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 hover:border-gray-300"
                      value={formData.full_name}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="your.email@example.com"
                      className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 hover:border-gray-300"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="09XX XXX XXXX"
                      className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 hover:border-gray-300"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-1 font-medium">
                    Must be a valid Philippine mobile number
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="At least 6 characters"
                      className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-150 hover:border-gray-300"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password Strength */}
                  {formData.password && (
                    <div className="mt-1.5">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength.strength ? passwordStrength.color : "bg-gray-200"}`}
                          />
                        ))}
                      </div>
                      <p
                        className={`text-xs font-bold ${passwordStrength.strength === 1 ? "text-red-600" : passwordStrength.strength === 2 ? "text-yellow-600" : passwordStrength.strength === 3 ? "text-blue-600" : "text-green-600"}`}
                      >
                        Password strength: {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      placeholder="Re-enter your password"
                      className={`w-full border-2 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-150 hover:border-gray-300 ${
                        formData.confirm_password &&
                        formData.password !== formData.confirm_password
                          ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                          : formData.confirm_password &&
                              formData.password === formData.confirm_password
                            ? "border-green-300 focus:ring-green-400 focus:border-green-400"
                            : "border-gray-200 focus:ring-orange-400 focus:border-orange-400"
                      }`}
                      value={formData.confirm_password}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    {formData.confirm_password && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        {formData.password === formData.confirm_password ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <X size={16} className="text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {formData.confirm_password &&
                    formData.password !== formData.confirm_password && (
                      <p className="text-xs text-red-600 mt-1 ml-1 font-medium">
                        Passwords do not match
                      </p>
                    )}
                </div>

                {/* Terms */}
                <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      required
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed font-medium group-hover:text-gray-900 transition-colors">
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-orange-500 hover:underline font-bold"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        className="text-orange-500 hover:underline font-bold"
                      >
                        Privacy Policy
                      </button>{" "}
                      of the San Jose Franchise System
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 disabled:shadow-none group"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Creating your account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-500 font-medium">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Login Link */}
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 text-gray-700 py-2.5 rounded-xl font-bold transition-all duration-150 flex items-center justify-center gap-2 group"
              >
                <span>Sign In Instead</span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Shield size={13} className="text-green-500" />
                <span className="font-medium">Secure Registration</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <Lock size={13} className="text-blue-500" />
                <span className="font-medium">Encrypted</span>
              </div>
            </div>
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
