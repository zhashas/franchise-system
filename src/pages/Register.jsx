import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

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
  const [submitted, setSubmitted] = useState(false); // ← tracks "check your email" state
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // ── Validate passwords match ───────────────────────────────────────────
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // ── Step 1: Create the auth user ───────────────────────────────────────
    // Pass profile fields in `options.data` so the DB trigger (if any) or
    // the post-confirmation callback can create the profile row automatically.
    // We also attempt a manual insert below for setups without a trigger.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
          role: "applicant",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // ── Step 2: Insert the profile row (only when there is a live session) ─
    // If email confirmation is ON  → data.session is null, so we skip the
    //   insert here.  The profile should be created via a Supabase DB trigger
    //   on auth.users (recommended), or on first login after confirmation.
    // If email confirmation is OFF → data.session is populated, insert now.
    if (data.session && data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        role: "applicant",
      });

      if (profileError) {
        // Non-fatal in most cases (e.g. trigger already created the row),
        // but surface real errors in the console.
        console.warn(
          "[Register] profile insert warning:",
          profileError.message,
        );
      }

      // Session exists → user is already authenticated → go to dashboard
      setLoading(false);
      navigate("/applicant/dashboard");
      return;
    }

    // ── Step 3: No session → email confirmation is required ───────────────
    // Show the "check your inbox" screen instead of redirecting anywhere.
    setLoading(false);
    setSubmitted(true);
  };

  // ── "Check your email" screen ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex">
        {/* Left panel (same as form) */}
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
        </div>

        {/* Right panel — confirmation notice */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-orange-500 text-center">
              {/* Email icon */}
              <div className="mx-auto mb-5 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                We sent a confirmation link to{" "}
                <span className="font-semibold text-gray-700">
                  {formData.email}
                </span>
                .
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Click the link in that email to activate your account, then come
                back to sign in. If you don't see it, check your spam folder.
              </p>

              <button
                onClick={() => navigate("/login")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold transition duration-200"
              >
                Go to Sign In →
              </button>

              <p className="text-xs text-gray-400 mt-4">
                Wrong email?{" "}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-orange-500 hover:underline font-medium"
                >
                  Go back and try again
                </button>
              </p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              © 2025 Municipality of San Jose, Occidental Mindoro
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
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
      </div>

      {/* Right Panel */}
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
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-orange-500">
            <h2 className="text-2xl font-bold text-blue-900 mb-1">
              Create Account
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Register as a Tricycle Operator or Driver
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="At least 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Confirm your password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2"
              >
                {loading && <span className="animate-spin text-sm">⏳</span>}
                {loading ? "Creating account…" : "Create Account →"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-orange-500 font-medium hover:underline"
                >
                  Sign in here
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
