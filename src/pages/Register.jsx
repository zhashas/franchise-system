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
  MapPin,
} from "lucide-react";

// ─── Privacy Policy Modal ──────────────────────────────────────────────────────
function PrivacyPolicyModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Shield size={13} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Privacy Policy</p>
              <p className="text-[10px] text-gray-400">
                San Jose Franchise System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 text-sm text-gray-700">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-800 font-medium">
            Last Updated: January 1, 2025 · Data Privacy Act of 2012 (RA 10173)
            Compliant
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            The Municipality of San Jose, Occidental Mindoro ("the
            Municipality", "we", "us") is committed to protecting your personal
            information in accordance with{" "}
            <strong>Republic Act No. 10173</strong> — the Data Privacy Act of
            2012. This policy explains how we collect, use, store, and protect
            your data when you use the San Jose Tricycle eFranchise Portal.
          </p>

          {[
            {
              title: "1. Information We Collect",
              color: "text-blue-500",
              items: [
                "Full legal name, date and place of birth, civil status, nationality",
                "Complete residential address (Barangay, San Jose, Occidental Mindoro)",
                "Philippine mobile number (09XXXXXXXXX format) and email address",
                "Motorcycle details: make/brand, color, Engine No., Chassis No., Plate No.",
                "LTO Official Receipt (OR) and Certificate of Registration (CR)",
                "Cedula, Police Clearance, Barangay Residency Certificate, Voter's Certification",
                "Stencil of engine and chassis numbers (for new registrations)",
                "Photos of tricycle condition and garage",
                "Application records, appointment schedules, status history, and audit logs",
              ],
            },
            {
              title: "2. How We Use Your Information",
              color: "text-orange-500",
              items: [
                "To process and evaluate franchise applications and renewal requests",
                "To verify your identity and the authenticity of submitted documents",
                "To issue official Franchise Certificates and Permits",
                "To schedule and manage appointments with the franchise division",
                "To send notifications on application status, approvals, and reminders",
                "To maintain official municipal franchise records as required by law",
                "To generate statistical reports for municipal planning and oversight",
                "To comply with applicable Philippine laws and regulations",
              ],
            },
            {
              title: "3. Legal Basis for Processing",
              color: "text-green-500",
              items: [
                "Fulfillment of a legal obligation — the Municipality is mandated by law to regulate tricycle-for-hire operations",
                "Performance of a public function — processing franchise applications is an official governmental function",
                "Consent — by registering and submitting your application, you expressly consent to data processing as described here",
              ],
            },
            {
              title: "4. Data Sharing and Disclosure",
              color: "text-purple-500",
              items: [
                "NOT sold, rented, or shared with third parties for commercial purposes",
                "Shared only with authorized municipal staff and franchise division officers",
                "Shared with government agencies (LTO, PNP, COMELEC) for document verification as required by law",
                "Processed by Supabase (our cloud infrastructure provider) under strict data processing agreements",
                "Disclosed when required by valid court order or legal process",
              ],
            },
            {
              title: "5. Data Security",
              color: "text-red-500",
              items: [
                "Encryption in transit and at rest using TLS/SSL protocols",
                "Row-Level Security (RLS) ensuring you can only access your own data",
                "Secure bcrypt password hashing — your password is never stored in plain text",
                "Access controls limiting data access to authorized personnel only",
                "Regular security audits and infrastructure monitoring by Supabase",
              ],
            },
            {
              title: "6. Data Retention",
              color: "text-yellow-600",
              items: [
                "Active franchise records: retained for the duration of your franchise plus a minimum of 5 years after expiration",
                "Rejected applications: retained for 1 year for audit and compliance purposes",
                "Account information: retained while your account is active",
                "After retention periods, data is securely deleted or anonymized per the Data Privacy Act",
              ],
            },
            {
              title: "7. Your Rights as a Data Subject",
              color: "text-blue-500",
              items: [
                "Right to Be Informed — know how your personal data is collected and processed",
                "Right to Access — request a copy of the personal data we hold about you",
                "Right to Rectification — request correction of inaccurate or incomplete data",
                "Right to Erasure — request deletion of your data (subject to legal retention requirements)",
                "Right to Data Portability — request your data in a structured, commonly used format",
                "Right to Object — object to certain types of processing of your personal data",
                "Right to Lodge a Complaint — file a complaint with the National Privacy Commission (NPC)",
              ],
            },
            {
              title: "8. Cookies and Technical Data",
              color: "text-green-500",
              items: [
                "Only essential browser storage (localStorage/sessionStorage) is used to maintain your login session",
                "No tracking cookies or third-party advertising technologies are used",
                "Technical logs (browser type, IP address) may be recorded by Supabase for security monitoring only",
              ],
            },
          ].map((section, i) => (
            <div key={i} className="space-y-2">
              <h3 className="font-black text-gray-900 text-sm border-b border-gray-100 pb-1.5">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-xs text-gray-600"
                  >
                    <CheckCircle
                      size={12}
                      className={`${section.color} mt-0.5 flex-shrink-0`}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="font-black text-gray-900 text-sm">9. Contact Us</p>
            <p className="text-xs text-gray-500 mb-2">
              To exercise your rights or for any privacy-related concerns,
              contact:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p className="font-bold text-gray-800">
                Municipal Franchise Division
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin size={11} className="text-orange-500 flex-shrink-0" />
                Municipal Hall, San Jose, Occidental Mindoro
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={11} className="text-orange-500 flex-shrink-0" />
                (043) XXX-XXXX
              </p>
              <p className="flex items-center gap-1.5">
                <Mail size={11} className="text-orange-500 flex-shrink-0" />
                franchise@sanjose.gov.ph
              </p>
              <p className="text-gray-400 mt-1">
                Office Hours: Monday – Friday, 8:00 AM – 5:00 PM (excluding
                holidays)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-[10px] text-gray-400 font-mono">
            Municipality of San Jose · RA 10173 Compliant · © 2025
          </p>
          <button
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Terms of Service Modal ────────────────────────────────────────────────────
function TermsOfServiceModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <FileText size={13} className="text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Terms of Service</p>
              <p className="text-[10px] text-gray-400">
                San Jose Franchise System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 text-sm text-gray-700">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-xs text-orange-800 font-medium">
            Last Updated: January 1, 2025 · Please read these terms carefully
            before registering.
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of
            the San Jose Tricycle eFranchise Portal ("the Portal"), operated by
            the Municipality of San Jose, Occidental Mindoro ("the
            Municipality"). By creating an account, you agree to be bound by
            these Terms. If you do not agree, do not use the Portal.
          </p>

          {[
            {
              title: "1. Eligibility and Account Registration",
              icon: "✅",
              items: [
                "Must be a resident of the Municipality of San Jose, Occidental Mindoro",
                "Must be a legitimate owner or operator of a tricycle unit seeking franchise registration or renewal",
                "Must provide accurate, complete, and truthful information during registration",
                "Must be at least 18 years of age or the legal age of majority in the Philippines",
                "Must maintain the security and confidentiality of your account credentials",
                "You are responsible for all activities that occur under your account",
              ],
              warning: null,
            },
            {
              title: "2. Permitted Use of the Portal",
              icon: "✅",
              items: [
                "Submitting new tricycle franchise applications for the Municipality of San Jose",
                "Filing renewal applications for existing valid franchises",
                "Tracking the real-time status of submitted applications",
                "Scheduling and managing appointments with the franchise division",
                "Receiving official notifications from the Municipal Franchise Office",
                "Accessing and downloading official franchise documents and permits",
              ],
              warning: null,
            },
            {
              title: "3. Prohibited Activities",
              icon: "🚫",
              items: [
                "Submitting false, misleading, or fraudulent information or documents",
                "Uploading fabricated, altered, or falsified government documents",
                "Registering duplicate accounts or impersonating another person",
                "Attempting to access another user's account or data",
                "Interfering with, disrupting, or attempting to hack the Portal's systems",
                "Using automated tools, bots, or scripts to interact with the Portal",
                "Violating Philippine law including the Revised Penal Code and RA 10175 (Cybercrime Prevention Act)",
                "Using the Portal for any commercial purpose not authorized by the Municipality",
              ],
              warning:
                "⚠️ Violations may result in immediate account suspension, rejection of all applications, and referral to law enforcement authorities.",
            },
            {
              title: "4. Application Rules and Limitations",
              icon: "📋",
              items: [
                "Only one (1) active application (Pending or Under Review) is allowed per account at any time",
                "A maximum of three (3) approved franchises may be held per applicant",
                "Engine Numbers, Chassis Numbers, and Plate Numbers must be unique across all system-approved franchises",
                "Applications cannot be edited after submission — contact the franchise office for corrections",
                "Franchise Numbers (SJ-XXXX) are auto-assigned upon approval and cannot be requested or changed",
                "Franchise Certificates are valid for one (1) year from the date of issuance",
                "Renewal applications may be submitted starting thirty (30) days before the expiration date",
              ],
              warning: null,
            },
            {
              title: "5. Document Authenticity",
              icon: "📄",
              items: [
                "All submitted documents must be genuine, valid, and unaltered",
                "All information provided must be accurate and truthful to the best of your knowledge",
                "You must be the rightful owner of the tricycle unit described in your application",
                "The Municipality reserves the right to verify all submitted documents with issuing agencies",
                "Submitting falsified documents constitutes fraud under the Revised Penal Code and anti-graft laws",
              ],
              warning: null,
            },
            {
              title: "6. Appointments",
              icon: "📅",
              items: [
                "Appear at the Municipal Hall on the scheduled date and time with all original documents",
                "Reschedule requests must be made at least 24 hours in advance through the Portal",
                "Failure to appear without prior notice may result in application rejection at the office's discretion",
                "The Municipality reserves the right to limit the number of reschedule requests per application",
              ],
              warning: null,
            },
            {
              title: "7. Account Suspension and Termination",
              icon: "🔒",
              items: [
                "The Municipality may suspend or terminate your account for violation of these Terms",
                "Accounts may be suspended for submission of fraudulent or falsified documents",
                "Abusive or threatening conduct toward municipal staff may result in termination",
                "Accounts inactive for 12 months or more may be deactivated",
                "Upon termination, your access is revoked; existing franchise records are retained as required by law",
              ],
              warning: null,
            },
            {
              title: "8. Limitation of Liability",
              icon: "⚖️",
              items: [
                "The Portal is provided on an 'as is' and 'as available' basis",
                "The Municipality is not liable for data loss, delays, or errors beyond our reasonable control",
                "Processing timelines are estimates and may vary based on application volume",
                "The Municipality's decisions on applications are final and subject only to proper administrative appeal",
              ],
              warning: null,
            },
            {
              title: "9. Governing Law",
              icon: "🏛️",
              items: [
                "These Terms are governed by the laws of the Republic of the Philippines",
                "Disputes shall first be addressed through the Municipal Franchise Division's administrative process",
                "Unresolved disputes shall be submitted to the proper courts of Occidental Mindoro",
              ],
              warning: null,
            },
          ].map((section, i) => (
            <div key={i} className="space-y-2">
              <h3 className="font-black text-gray-900 text-sm border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                <span>{section.icon}</span>
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-xs text-gray-600"
                  >
                    <ArrowRight
                      size={11}
                      className="text-orange-500 mt-0.5 flex-shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              {section.warning && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[11px] text-red-700 font-medium flex items-start gap-1.5 mt-2">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  {section.warning}
                </div>
              )}
            </div>
          ))}

          {/* Contact */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <p className="font-black text-gray-900 text-sm">
              10. Contact Information
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p className="font-bold text-gray-800">
                Municipal Franchise Division
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin size={11} className="text-orange-500 flex-shrink-0" />
                Municipal Hall, San Jose, Occidental Mindoro
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={11} className="text-orange-500 flex-shrink-0" />
                (043) XXX-XXXX
              </p>
              <p className="flex items-center gap-1.5">
                <Mail size={11} className="text-orange-500 flex-shrink-0" />
                franchise@sanjose.gov.ph
              </p>
              <p className="text-gray-400 mt-1">
                Office Hours: Monday – Friday, 8:00 AM – 5:00 PM (excluding
                holidays)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-[10px] text-gray-400 font-mono">
            Municipality of San Jose · Terms of Service v1.0 · © 2025
          </p>
          <button
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Register Component ───────────────────────────────────────────────────
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

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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

  // ── Email Confirmation Screen ────────────────────────────────────────────────
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

  // ── Registration Form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Modals ── */}
      {showPrivacy && (
        <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />
      )}
      {showTerms && <TermsOfServiceModal onClose={() => setShowTerms(false)} />}

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-orange-400/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 py-16">
          {/* Logo + Title */}
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

          {/* Feature Pills */}
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

          {/* ── Trust Indicators ── */}
          <div className="flex items-center gap-6 text-blue-300 text-xs mt-6">
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

      {/* Right Panel */}
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
            {/* Card Header */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-100 px-8 py-4">
              <h2 className="text-xl font-black text-gray-900 mb-0.5">
                Create Account
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Register as a Tricycle Operator or Driver
              </p>
            </div>

            {/* Card Body */}
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

                {/* ── Terms Checkbox — opens modals on link click ── */}
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
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTerms(true);
                        }}
                        className="text-orange-500 hover:underline font-bold"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPrivacy(true);
                        }}
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
