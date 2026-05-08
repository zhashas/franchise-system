// src/pages/applicant/ApplicantSettings.jsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import ApplicantLayout from "../../components/ApplicantLayout";
import {
  Shield,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  X,
  ChevronRight,
  BookOpen,
  Lock,
  HelpCircle,
  ExternalLink,
  Search,
  Tag,
  User,
  Mail,
  Calendar,
  MapPin,
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ─── Help Documentation Data ──────────────────────────────────────────────────
const HELP_SECTIONS = [
  {
    id: "getting-started",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
    tag: "BASICS",
    title: "Getting Started",
    summary: "Learn how to navigate and use the eFranchise applicant portal.",
    articles: [
      {
        title: "Portal Overview",
        content: `Welcome to the San Jose Tricycle eFranchise Portal for applicants.

This portal allows you to:
• Submit new franchise applications or renewals
• Track your application status in real-time
• View and manage scheduled appointments
• Receive notifications from the franchise office
• Access your franchise documents and permits

Navigate using the sidebar menu. Your dashboard shows a summary of all your applications and upcoming appointments.`,
      },
      {
        title: "How to Apply",
        content: `To submit a new franchise application:

1. Click "Apply" in the sidebar or "New Application" on the dashboard
2. Choose "New Registration" or "Renewal Permit"
3. Complete all three steps:
   • Step 1: Personal & Vehicle Information
   • Step 2: Required Documents (upload PDFs or images)
   • Step 3: Vehicle & Garage Photos
4. Review all information carefully before submitting
5. Click "Submit Application"

You will receive a Control Number and Franchise Number for tracking. Save these numbers for your records.`,
      },
      {
        title: "Tracking Your Application",
        content: `After submitting, you can track your application status from the Applications page.

Application statuses:
• Pending — Your application has been received and is awaiting review
• Under Review — Staff is currently reviewing your documents
• Approved — Your application has been approved! Wait for "For Release" status
• For Release — Your franchise permit is ready for pickup at the Municipal Hall
• Released — You have claimed your franchise permit
• Rejected — Your application did not meet requirements (check the remarks for details)

You will receive notifications when your status changes.`,
      },
    ],
  },
  {
    id: "appointments",
    icon: Calendar,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    tag: "SCHEDULING",
    title: "Appointments",
    summary: "Managing your scheduled appointments with the franchise office.",
    articles: [
      {
        title: "Understanding Appointments",
        content: `The admin may schedule an appointment for you during the application review process.

Appointment types:
• Document Verification — Bring original documents for inspection
• Vehicle Inspection — Bring your tricycle to the Municipal Hall
• Permit Pickup — Claim your approved franchise permit

When an appointment is confirmed, you will receive a notification with:
• Date and time
• Location (usually Municipal Hall)
• Items to bring
• Special instructions

Always arrive 15 minutes early and bring a valid ID.`,
      },
      {
        title: "Rescheduling Requests",
        content: `If you cannot make your scheduled appointment:

1. Go to Appointments in the sidebar
2. Click on the appointment you need to reschedule
3. Click "Request Reschedule"
4. Provide a reason for the reschedule request
5. Submit your request

The admin will review your request and confirm a new date and time. You will receive a notification once rescheduled.

Note: Reschedule requests should be made at least 24 hours in advance when possible.`,
      },
    ],
  },
  {
    id: "documents",
    icon: FileText,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
    tag: "REQUIREMENTS",
    title: "Required Documents",
    summary: "What documents you need to submit with your application.",
    articles: [
      {
        title: "Document Checklist",
        content: `For new franchise registration, you must upload:

Required Documents:
• Official Receipt (LTO) — Latest OR from the Land Transportation Office
• Certificate of Registration (CR) — Vehicle registration certificate
• Cedula — Community Tax Certificate
• Police Clearance — Valid police clearance certificate
• Barangay Residency Certificate — Certificate of residency from your barangay
• Voter's Certification — Certificate from COMELEC
• Stencil Motor — Photo showing engine and chassis numbers clearly

For renewal applications:
• Same documents as above, except Stencil Motor is optional if already on file
• Ensure all documents are valid and not expired

All files must be in PDF, JPG, JPEG, or PNG format and clearly readable.`,
      },
      {
        title: "Photo Requirements",
        content: `In Step 3, you must upload vehicle and garage photos:

Required Photos:
• Tricycle Condition (Overall) — Full view of your tricycle showing its condition
• Garage Condition — Photo of your garage where the tricycle is stored

Optional Photos:
• Left Signal Light — Close-up of functioning left signal
• Right Signal Light — Close-up of functioning right signal
• Garage with Tricycle — Your tricycle parked inside the garage

Tips for good photos:
• Use good lighting (daylight is best)
• Ensure photos are clear and in focus
• Show the entire subject (no cropping important details)
• Avoid shadows or glare
• Take photos horizontally (landscape orientation)`,
      },
    ],
  },
  {
    id: "faq",
    icon: HelpCircle,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    tag: "SUPPORT",
    title: "FAQ & Troubleshooting",
    summary: "Common questions and solutions for applicant portal issues.",
    articles: [
      {
        title: "Frequently Asked Questions",
        content: `Q: How long does it take to process my application?
A: Processing time varies depending on application volume and document verification. Typically, it takes 3-7 business days. You will receive notifications at each status change.

Q: Can I edit my application after submitting?
A: No, applications cannot be edited after submission. If you made an error, contact the franchise office immediately by phone or visit in person.

Q: What if my application is rejected?
A: Check the rejection reason in the application details. You can submit a new application after correcting the issues. Common reasons include invalid documents, incomplete information, or duplicate vehicle numbers.

Q: Can I apply for multiple franchises?
A: Yes, but each application must be submitted separately. You can have a maximum of 3 approved franchises per applicant.

Q: How do I renew my franchise?
A: You can renew starting 30 days before your franchise expiration date. Go to Apply → Renewal Permit and select the franchise you want to renew.`,
      },
      {
        title: "Troubleshooting",
        content: `Problem: I can't upload a document.
Solution: Check that your file is in PDF, JPG, JPEG, or PNG format and is less than 10MB in size. Try using a different browser or compressing the image.

Problem: Notifications are not appearing.
Solution: Refresh the page. Notifications should reload from the server. Check your internet connection. Clear your browser cache if the issue persists.

Problem: I forgot my password.
Solution: Click "Forgot Password" on the login page and enter your email. You will receive a password reset link via email.

Problem: The system is slow or unresponsive.
Solution: Check your internet connection. Try refreshing the page. Clear your browser cache and cookies. If the issue persists, try using a different browser.

Problem: I need to update my personal information.
Solution: Contact the franchise office directly. Personal information cannot be changed through the portal for security reasons.`,
      },
    ],
  },
];

// ─── Help Portal Modal ────────────────────────────────────────────────────────
function HelpPortal({ onClose }) {
  const [activeSection, setActiveSection] = useState(HELP_SECTIONS[0]);
  const [activeArticle, setActiveArticle] = useState(
    HELP_SECTIONS[0].articles[0],
  );
  const [searchQuery, setSearchQuery] = useState("");

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    HELP_SECTIONS.forEach((sec) => {
      sec.articles.forEach((art) => {
        if (
          art.title.toLowerCase().includes(q) ||
          art.content.toLowerCase().includes(q) ||
          sec.title.toLowerCase().includes(q)
        ) {
          results.push({ section: sec, article: art });
        }
      });
    });
    return results;
  }, [searchQuery]);

  const selectArticle = (sec, art) => {
    setActiveSection(sec);
    setActiveArticle(art);
    setSearchQuery("");
  };

  const SectionIcon = activeSection.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <BookOpen size={15} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">
                Help Center
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Applicant Guide & Support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Section list */}
          <div className="w-64 flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  type="text"
                  placeholder="Search help…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-300"
                />
              </div>
            </div>

            {isSearching ? (
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold px-2 py-1">
                  {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 px-2 py-4 text-center">
                    No articles found
                  </p>
                ) : (
                  searchResults.map(({ section, article }, i) => (
                    <button
                      key={i}
                      onClick={() => selectArticle(section, article)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition"
                    >
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {article.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {section.title}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {HELP_SECTIONS.map((sec) => {
                  const SecIcon = sec.icon;
                  const isActive = activeSection.id === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec);
                        setActiveArticle(sec.articles[0]);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                        isActive
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-white hover:text-slate-800",
                      )}
                    >
                      <SecIcon
                        size={14}
                        className={isActive ? "text-blue-400" : sec.color}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">
                          {sec.title}
                        </p>
                        <p className="text-[10px] truncate text-slate-400">
                          {sec.articles.length} article
                          {sec.articles.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight
                          size={12}
                          className="text-blue-400 flex-shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Middle: Article list */}
          <div className="w-52 flex-shrink-0 border-r border-slate-100 flex flex-col">
            <div
              className={cn(
                "px-4 py-3 border-b border-slate-100",
                activeSection.bg,
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Tag size={10} className={activeSection.color} />
                <span
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    activeSection.color,
                  )}
                >
                  {activeSection.tag}
                </span>
              </div>
              <p className="text-xs font-black text-slate-900">
                {activeSection.title}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                {activeSection.summary}
              </p>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {activeSection.articles.map((art, i) => {
                const isActive = activeArticle?.title === art.title;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveArticle(art)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl transition-all text-xs",
                      isActive
                        ? `${activeSection.bg} ${activeSection.color} font-bold border ${activeSection.border}`
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                    )}
                  >
                    {art.title}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Article content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {activeArticle ? (
              <>
                <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                        activeSection.bg,
                      )}
                    >
                      <SectionIcon size={16} className={activeSection.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            activeSection.color,
                          )}
                        >
                          {activeSection.tag}
                        </span>
                        <span className="text-slate-200">·</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {activeSection.title}
                        </span>
                      </div>
                      <h2 className="text-base font-black text-slate-900">
                        {activeArticle.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5 flex-1">
                  <div className="prose prose-sm max-w-none">
                    {activeArticle.content.split("\n\n").map((para, i) => {
                      if (para.trim().endsWith(":") && !para.includes("\n")) {
                        return (
                          <p
                            key={i}
                            className="text-xs font-black text-slate-900 uppercase tracking-wide mt-5 mb-2 first:mt-0"
                          >
                            {para}
                          </p>
                        );
                      }
                      if (para.includes("\n•") || para.startsWith("•")) {
                        const lines = para.split("\n");
                        return (
                          <div key={i} className="mb-3 space-y-1.5">
                            {lines.map((line, j) => {
                              if (line.startsWith("•")) {
                                return (
                                  <div
                                    key={j}
                                    className="flex items-start gap-2"
                                  >
                                    <span
                                      className={cn(
                                        "mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0",
                                        activeSection.color.replace(
                                          "text-",
                                          "bg-",
                                        ),
                                      )}
                                    />
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                      {line.replace("•", "").trim()}
                                    </p>
                                  </div>
                                );
                              }
                              return (
                                <p
                                  key={j}
                                  className="text-xs text-slate-700 font-semibold leading-relaxed"
                                >
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                        );
                      }
                      if (para.startsWith("Q:")) {
                        const lines = para.split("\n");
                        return (
                          <div
                            key={i}
                            className={cn(
                              "mb-4 rounded-xl p-4 border",
                              activeSection.bg,
                              activeSection.border,
                            )}
                          >
                            {lines.map((line, j) => {
                              if (line.startsWith("Q:"))
                                return (
                                  <p
                                    key={j}
                                    className="text-xs font-black text-slate-900 mb-1"
                                  >
                                    {line}
                                  </p>
                                );
                              if (line.startsWith("A:"))
                                return (
                                  <p
                                    key={j}
                                    className="text-xs text-slate-600 leading-relaxed"
                                  >
                                    {line}
                                  </p>
                                );
                              return null;
                            })}
                          </div>
                        );
                      }
                      if (para.startsWith("Problem:")) {
                        const lines = para.split("\n");
                        return (
                          <div
                            key={i}
                            className="mb-4 rounded-xl p-4 border bg-slate-50 border-slate-200"
                          >
                            {lines.map((line, j) => {
                              if (line.startsWith("Problem:"))
                                return (
                                  <p
                                    key={j}
                                    className="text-xs font-black text-slate-900 mb-1"
                                  >
                                    {line}
                                  </p>
                                );
                              if (line.startsWith("Solution:"))
                                return (
                                  <p
                                    key={j}
                                    className="text-xs text-slate-600 leading-relaxed"
                                  >
                                    {line}
                                  </p>
                                );
                              return null;
                            })}
                          </div>
                        );
                      }
                      return (
                        <p
                          key={i}
                          className="text-xs text-slate-600 leading-relaxed mb-3"
                        >
                          {para}
                        </p>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const arts = activeSection.articles;
                  const curIdx = arts.findIndex(
                    (a) => a.title === activeArticle.title,
                  );
                  const next = arts[curIdx + 1];
                  return next ? (
                    <div className="px-6 pb-6 flex-shrink-0">
                      <button
                        onClick={() => setActiveArticle(next)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl border hover:opacity-80 transition",
                          activeSection.bg,
                          activeSection.border,
                        )}
                      >
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                            Next Article
                          </p>
                          <p
                            className={cn(
                              "text-xs font-bold",
                              activeSection.color,
                            )}
                          >
                            {next.title}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className={activeSection.color}
                        />
                      </button>
                    </div>
                  ) : null;
                })()}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">
                    Select an article to read
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-2.5 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <p className="text-[10px] text-slate-400 font-mono">
            San Jose eFranchise System · Applicant Guide v1.0.0 · © 2025
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Info size={10} />
            <span>Need more help? Contact the franchise office</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function ApplicantSettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // ── Load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, role, created_at")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        setProfile(
          data || { full_name: "User", email: user.email, role: "applicant" },
        );
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Password change ───────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  // ── Password strength ─────────────────────────────────────────────────────
  const strengthScore = () => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 6) s++;
    if (newPassword.length >= 10) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  };

  const strengthLabel = [
    "",
    "Very Weak",
    "Weak",
    "Fair",
    "Strong",
    "Very Strong",
  ];
  const strengthColor = [
    "",
    "bg-rose-500",
    "bg-orange-500",
    "bg-yellow-400",
    "bg-blue-500",
    "bg-emerald-500",
  ];
  const score = strengthScore();

  // ── Profile initials ──────────────────────────────────────────────────────
  const initials = (profile?.full_name || "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ApplicantLayout>
      {showHelp && <HelpPortal onClose={() => setShowHelp(false)} />}

      <div className="space-y-8 animate-in">
        <div className="max-w-8xl mx-auto">
          {/* ── Page Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
                Settings
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Manage your account settings and security preferences.
              </p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <Settings size={16} className="text-slate-300" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Version 1.0.0
                </p>
                <p className="text-[9px] text-slate-300 uppercase tracking-widest">
                  Applicant Portal
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid: 2 + 1 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ══ LEFT: 2-col span ══ */}
            <div className="lg:col-span-2 space-y-6">
              {/* Change Password */}
              <div className="bg-white rounded-2xl shadow-sm border border-black overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-black bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Lock size={18} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        Change Password
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Update your account password
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                    Secure
                  </span>
                </div>

                <div className="px-6 pt-5">
                  {message && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-xs font-semibold">
                      <CheckCircle size={14} className="flex-shrink-0" />
                      {message}
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-4 text-xs font-semibold">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={handleChangePassword}
                  className="px-6 pb-6 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New password */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder:text-slate-300 transition shadow-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
                        >
                          {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-1 flex-1 rounded-full transition-all duration-300",
                                  i <= score
                                    ? strengthColor[score]
                                    : "bg-slate-100",
                                )}
                              />
                            ))}
                          </div>
                          <p
                            className={cn(
                              "text-[10px] font-bold",
                              score <= 2
                                ? "text-rose-500"
                                : score === 3
                                  ? "text-yellow-500"
                                  : "text-emerald-500",
                            )}
                          >
                            {strengthLabel[score]}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Retype password"
                          className={cn(
                            "w-full border bg-slate-50 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder:text-slate-300 transition shadow-sm",
                            confirmPassword && confirmPassword !== newPassword
                              ? "border-rose-300"
                              : "border-slate-200",
                          )}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
                        >
                          {showConfirm ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-[10px] text-rose-500 font-semibold mt-1">
                          Passwords do not match
                        </p>
                      )}
                      {confirmPassword && confirmPassword === newPassword && (
                        <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle size={10} /> Match confirmed
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest transition shadow-sm flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    )}
                    {loading ? "Updating…" : "Update Password"}
                  </button>
                </form>
              </div>

              {/* Help & Support */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <HelpCircle size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Help & Support
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                      Guides, FAQs, and Troubleshooting
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Access step-by-step guides on how to use the applicant portal,
                  submit applications, track status, manage appointments, and
                  troubleshoot common issues.
                </p>

                <button
                  onClick={() => setShowHelp(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition group"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Open Help Center
                  </span>
                  <ExternalLink
                    size={12}
                    className="text-blue-400 group-hover:translate-x-0.5 transition-transform"
                  />
                </button>
              </div>
            </div>

            {/* ══ RIGHT: 1-col span ══ */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-slate-900 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      APPLICANT
                    </p>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-0.5">
                      Verified Account
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <User size={18} className="text-blue-400" />
                  </div>
                </div>

                {profile ? (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border-2 border-blue-500/30 flex items-center justify-center">
                      <span className="text-xl font-black text-blue-400">
                        {initials}
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-black text-white leading-tight">
                        {profile.full_name}
                      </p>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">
                        {profile.role}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate flex items-center gap-1">
                        <Mail size={10} />
                        {profile.email}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <div className="bg-white/5 rounded-xl px-3 py-2">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Member Since
                        </p>
                        <p className="text-xs text-white font-bold mt-0.5 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(profile.created_at).toLocaleDateString(
                            "en-PH",
                            { month: "short", year: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-4 bg-white/10 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
                  <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <MapPin size={10} />
                    San Jose, Occ. Mindoro
                  </p>
                  <Info size={12} className="text-slate-500" />
                </div>
              </div>

              {/* Security Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-blue-500" />
                  <p className="text-xs font-black text-blue-800 uppercase tracking-wide">
                    Security Tips
                  </p>
                </div>
                <ul className="space-y-2">
                  {[
                    "Use a strong, unique password",
                    "Never share your login credentials",
                    "Log out after each session on shared devices",
                    "Keep your contact information updated",
                    "Report suspicious emails or messages",
                  ].map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <CheckCircle
                        size={11}
                        className="text-blue-400 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-[11px] text-blue-700 leading-relaxed">
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={14} className="text-slate-400" />
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Need Assistance?
                  </p>
                </div>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="flex items-start gap-2">
                    <span className="font-black text-slate-400">📞</span>
                    <span className="leading-relaxed">
                      <strong>Phone:</strong> (+63) 123-4567
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-black text-slate-400">📧</span>
                    <span className="leading-relaxed">
                      <strong>Email:</strong> franchise@sanjose.gov.ph
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-black text-slate-400">🏛️</span>
                    <span className="leading-relaxed">
                      <strong>Office:</strong> Municipal Hall, San Jose,
                      Occidental Mindoro
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-black text-slate-400">🕐</span>
                    <span className="leading-relaxed">
                      <strong>Hours:</strong> Mon-Fri, 8:00 AM – 5:00 PM
                    </span>
                  </p>
                </div>
              </div>

              {/* About */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center">
                <p className="text-xs font-black text-slate-900 mb-1">
                  Tricycle eFranchise System
                </p>
                <p className="text-[10px] text-slate-500">
                  San Jose Franchising Unit
                </p>
                <p className="text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-200">
                  Version 1.0.0 · © 2025 Municipality of San Jose
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ApplicantLayout>
  );
}
