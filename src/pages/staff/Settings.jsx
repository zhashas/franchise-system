import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import StaffLayout from "../../components/StaffLayout";
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
  Users,
  ClipboardList,
  Calendar,
  BarChart3,
  Activity,
  Lock,
  HelpCircle,
  ExternalLink,
  Search,
  Tag,
} from "lucide-react";

// ─── Documentation Data ───────────────────────────────────────────────────────
const DOC_SECTIONS = [
  {
    id: "getting-started",
    icon: BookOpen,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    tag: "ESSENTIALS",
    title: "Getting Started",
    summary: "System overview, login procedures, and role-based access guide.",
    articles: [
      {
        title: "System Overview",
        content: `The San Jose Tricycle eFranchise System is a web-based platform designed for the Municipality of San Jose, Occidental Mindoro. It digitizes the entire franchise registration and renewal workflow for tricycles operating within the municipality.

Key modules include:
• Dashboard — Real-time metrics and activity feed
• Applications — New registrations and renewals management
• Appointments — Scheduling and confirmation workflow
• Reports — Analytics and exportable data
• Notifications — Real-time alerts for staff and applicants
• Activity Logs — Full audit trail of all system actions`,
      },
      {
        title: "Login & Authentication",
        content: `All users authenticate via email and password through Supabase Auth.

Roles and access levels:
• Admin — Full system access including staff management, reports, and all settings
• Staff — Access to applications, appointments, notifications, and reports
• Applicant — Access to their own applications, appointments, and notifications

After login, the system reads your role from the profiles table and redirects you to the appropriate dashboard. Sessions are managed automatically.

Security note: Always log out when leaving a shared workstation. Use the Sign Out button in the sidebar.`,
      },
      {
        title: "Navigation Guide",
        content: `The sidebar provides access to all major modules. It can be collapsed to icon-only mode by clicking the chevron toggle near the top.

Header bar elements:
• Language toggle — English (default)
• Bell icon — Live notification dropdown with unread badge
• Profile card — Your name and role displayed at the bottom of the sidebar
• Sign Out — Ends your session and returns to the landing page

Active page is highlighted in dark/black in the sidebar. Notification badges appear on the Notifications nav item when unread messages exist.`,
      },
    ],
  },
  {
    id: "applications",
    icon: ClipboardList,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
    tag: "WORKFLOW",
    title: "Applications",
    summary: "Processing new registrations, renewals, and status transitions.",
    articles: [
      {
        title: "Application Status Flow",
        content: `Every application moves through a defined status pipeline:

1. pending — Newly submitted, awaiting initial review
2. under_review — Staff or admin has opened and is reviewing the application
3. approved — Application meets all requirements and is approved
4. for_release — Franchise permit is ready for physical pickup
5. rejected — Application did not meet requirements (remarks required)

Status transitions are one-directional in normal workflow.`,
      },
      {
        title: "Reviewing an Application",
        content: `To review an application:

1. Go to Applications in the sidebar
2. Click on any application row to open its detail view
3. Review submitted documents — ID, permits, certificates
4. Verify engine number, chassis number, and plate number format (XX-XXXX or XXX-XXXX)
5. Add remarks if rejecting
6. Update the status using the status dropdown

All status changes are recorded in the activity_logs table with the staff ID, timestamp, and details.`,
      },
      {
        title: "Document Verification",
        content: `Applicants upload documents during the application process. These are stored in Supabase Storage and referenced in the documents table.

Document types accepted:
• id — Valid government-issued identification
• permit — Existing franchise or business permit
• certificate — LTFRB or LTO certificates
• other — Supporting documents

Staff should verify that all required document types are present before approving. Missing documents should result in a rejection with clear remarks explaining what is needed.`,
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
    summary: "Scheduling, confirming, and managing applicant appointments.",
    articles: [
      {
        title: "Appointment Status Flow",
        content: `Appointments follow this status lifecycle:

1. pending — Applicant has requested an appointment
2. confirmed — Admin/staff has set a date and time
3. completed — Applicant visited and process was finished
4. cancelled — Appointment was cancelled by either party

When an appointment is confirmed, a notification is automatically sent to the applicant with the scheduled date, time, and instructions to bring valid ID and original documents.`,
      },
      {
        title: "Scheduling an Appointment",
        content: `To schedule an appointment:

1. Go to Appointments in the sidebar
2. Filter by "pending" status to see unscheduled requests
3. Click on an appointment to open it
4. Set the scheduled_date (date picker) and scheduled_time (time picker)
5. Add any notes for the applicant
6. Change status to "confirmed" and save

The applicant will receive a real-time notification via the notifications table. The bell icon on their portal will update immediately.`,
      },
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    color: "text-yellow-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    tag: "ANALYTICS",
    title: "Reports & Analytics",
    summary: "Generating and exporting franchise and application reports.",
    articles: [
      {
        title: "Available Reports",
        content: `The Reports module provides the following analytics:

• Application Summary — Total applications by type (registration/renewal), status breakdown, and monthly trends
• Franchise Status Report — Active, expired, and available franchise counts
• Staff Performance — Applications processed per staff member
• Appointment Report — Scheduled vs completed vs cancelled ratios
• Activity Log Export — Full audit trail filterable by date range, user, and action type

All reports can be exported to PDF or CSV format using the export buttons in each report section.`,
      },
      {
        title: "Reading the Dashboard",
        content: `The staff dashboard displays key metrics at a glance:

• Total Applications — All-time count with today's submissions highlighted
• Pending Review — Applications awaiting action (requires attention)
• Active Franchises — Currently valid franchise count
• Expiring Soon — Franchises expiring within 30 days (action required)

The activity feed shows the latest 10 system events in real time. Click any entry to view full details.`,
      },
    ],
  },
  {
    id: "activity-logs",
    icon: Activity,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    tag: "AUDIT",
    title: "Activity Logs",
    summary: "Understanding the audit trail and log retention policy.",
    articles: [
      {
        title: "What is Logged",
        content: `Every significant action in the system is recorded in the activity_logs table. This provides a complete and immutable audit trail.

Logged actions include:
• login / logout — Session events with user details
• application_submitted — New application created
• status_changed — Application status updates
• appointment_confirmed — Scheduling events
• password_changed — Account security events
• report_generated — Report export events

Each log entry records: user_id, user_name, user_email, role, action, details, metadata (JSON), created_at, and ip_address.`,
      },
      {
        title: "Log Access for Staff",
        content: `Staff members have read-only access to activity logs.

Access levels:
• Admin — Full read access to all logs, with deletion capability
• Staff — Read access to logs (view only, no deletion)
• Applicant — No access

Use the search and date-range filters in the Activity Logs page to narrow results. Logs are immutable — no edits or deletions can be made through the UI by staff members.`,
      },
    ],
  },
  {
    id: "security",
    icon: Lock,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    tag: "SECURITY",
    title: "Security & Access",
    summary: "Password rules, session management, and best practices.",
    articles: [
      {
        title: "Password Requirements",
        content: `Password requirements enforced by the system:

• Minimum 6 characters (system minimum)
• Recommended: 10+ characters with mixed case, numbers, and symbols
• Passwords are hashed by Supabase Auth — never stored in plain text

Best practices:
• Change your password every 90 days
• Do not reuse passwords across systems
• Use the strength meter in Account Settings to gauge password quality

After a password change, existing sessions remain valid. The change is reflected immediately in Supabase Auth.`,
      },
      {
        title: "Session Management",
        content: `Sessions are managed automatically by Supabase Auth.

Important notes:
• Always log out when leaving a shared workstation
• Use the Sign Out button in the sidebar to end your session
• If you suspect unauthorized access, change your password immediately and notify the system administrator
• Staff accounts cannot access admin-only modules — the system enforces this at both UI and database (RLS) levels`,
      },
    ],
  },
  {
    id: "faq",
    icon: HelpCircle,
    color: "text-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
    tag: "SUPPORT",
    title: "FAQ & Troubleshooting",
    summary: "Common issues, error messages, and their solutions.",
    articles: [
      {
        title: "Common Issues",
        content: `Q: I cannot log in even with the correct password.
A: Your account may be deactivated or your role may not be set in the profiles table. Contact the system administrator.

Q: Notifications are not appearing in real time.
A: The system uses Supabase Realtime. Check your internet connection. If the issue persists, refresh the page — notifications will reload from the database.

Q: An application is stuck in "pending" status.
A: Open the application and manually update the status to "under_review". If the save fails, check your RLS permissions — only admin and staff can update application status.

Q: I cannot access a module I need.
A: Some modules are restricted to admins only (e.g., Manage Staff, Add Applicant, Activity Logs). If you need access, contact the system administrator.`,
      },
      {
        title: "Error Reference",
        content: `Common error messages and their meanings:

• "Could not retrieve your account role" — Your profile exists in auth.users but not in the profiles table. An admin needs to create your profile record.

• "new row violates row-level security policy" — You are attempting an action that your role does not permit. Verify you are logged in with the correct account.

• "duplicate key value violates unique constraint" — A franchise number or plate number already exists in the system. Use a different value.

• "JWT expired" — Your session has timed out. Log out and log back in.

• "Failed to fetch" — Network connectivity issue. Check your internet connection and try again.`,
      },
    ],
  },
];

// ─── Documentation Portal Modal ───────────────────────────────────────────────
function DocumentationPortal({ onClose }) {
  const [activeSection, setActiveSection] = useState(DOC_SECTIONS[0]);
  const [activeArticle, setActiveArticle] = useState(
    DOC_SECTIONS[0].articles[0],
  );
  const [searchQuery, setSearchQuery] = useState("");

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    DOC_SECTIONS.forEach((sec) => {
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

  const Icon = activeSection.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <FileText size={15} className="text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">
                Documentation Portal
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                Staff Manual — System Reference v1.0.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Section list */}
          <div className="w-64 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                />
                <input
                  type="text"
                  placeholder="Search docs…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-xs
                    focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-gray-300"
                />
              </div>
            </div>

            {isSearching ? (
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold px-2 py-1">
                  {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-4 text-center">
                    No articles found
                  </p>
                ) : (
                  searchResults.map(({ section, article }, i) => (
                    <button
                      key={i}
                      onClick={() => selectArticle(section, article)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition"
                    >
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {article.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {section.title}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {DOC_SECTIONS.map((sec) => {
                  const SIcon = sec.icon;
                  const isActive = activeSection.id === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec);
                        setActiveArticle(sec.articles[0]);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-500 hover:bg-white hover:text-gray-800"
                      }`}
                    >
                      <SIcon
                        size={14}
                        className={isActive ? "text-orange-400" : sec.color}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">
                          {sec.title}
                        </p>
                        <p className="text-[10px] truncate text-gray-400">
                          {sec.articles.length} article
                          {sec.articles.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {isActive && (
                        <ChevronRight
                          size={12}
                          className="text-orange-400 flex-shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Middle: Article list */}
          <div className="w-52 flex-shrink-0 border-r border-gray-100 flex flex-col">
            <div
              className={`px-4 py-3 border-b border-gray-100 ${activeSection.bg}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Tag size={10} className={activeSection.color} />
                <span
                  className={`text-[9px] font-black uppercase tracking-widest ${activeSection.color}`}
                >
                  {activeSection.tag}
                </span>
              </div>
              <p className="text-xs font-black text-gray-900">
                {activeSection.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
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
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-xs ${
                      isActive
                        ? `${activeSection.bg} ${activeSection.color} font-bold border ${activeSection.border}`
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
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
                <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${activeSection.bg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon size={16} className={activeSection.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${activeSection.color}`}
                        >
                          {activeSection.tag}
                        </span>
                        <span className="text-gray-200">·</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {activeSection.title}
                        </span>
                      </div>
                      <h2 className="text-base font-black text-gray-900">
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
                            className="text-xs font-black text-gray-900 uppercase tracking-wide mt-5 mb-2 first:mt-0"
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
                                      className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeSection.color.replace(
                                        "text-",
                                        "bg-",
                                      )}`}
                                    />
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                      {line.replace("•", "").trim()}
                                    </p>
                                  </div>
                                );
                              }
                              return (
                                <p
                                  key={j}
                                  className="text-xs text-gray-700 font-semibold leading-relaxed"
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
                            className={`mb-4 rounded-xl p-4 border ${activeSection.bg} ${activeSection.border}`}
                          >
                            {lines.map((line, j) => {
                              if (line.startsWith("Q:"))
                                return (
                                  <p
                                    key={j}
                                    className="text-xs font-black text-gray-900 mb-1"
                                  >
                                    {line}
                                  </p>
                                );
                              if (line.startsWith("A:"))
                                return (
                                  <p
                                    key={j}
                                    className="text-xs text-gray-600 leading-relaxed"
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
                          className="text-xs text-gray-600 leading-relaxed mb-3"
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
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${activeSection.bg} ${activeSection.border} hover:opacity-80 transition`}
                      >
                        <div className="text-left">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                            Next Article
                          </p>
                          <p
                            className={`text-xs font-bold ${activeSection.color}`}
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
                  <FileText size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Select an article to read
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-2.5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <p className="text-[10px] text-gray-400 font-mono">
            San Jose eFranchise System · Wiki.RTF v1.0.0 · © 2025 Municipality
            of San Jose
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <ExternalLink size={10} />
            <span>Internal Reference Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Staff Settings Page ─────────────────────────────────────────────────
export default function StaffSettings() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showDocs, setShowDocs] = useState(false);

  // ── Load staff profile ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single();
      setProfile(
        data || { full_name: "Staff User", email: user.email, role: "staff" },
      );
    };
    load();
  }, []);

  // ── Password change handler ─────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passphrases do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Passphrase must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Security matrix updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  // ── Password strength ───────────────────────────────────────────────────────
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
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-400",
    "bg-blue-500",
    "bg-green-500",
  ];
  const score = strengthScore();

  return (
    <StaffLayout>
      {showDocs && <DocumentationPortal onClose={() => setShowDocs(false)} />}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              PASSWORD<span className="text-orange-500">MANAGEMENT.</span>
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Manage your account credentials and access your staff reference
              manual.
            </p>
          </div>
          <div className="flex items-center gap-2 text-right">
            <Settings size={16} className="text-gray-300" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Protocol 1.0.4
              </p>
              <p className="text-[9px] text-gray-300 uppercase tracking-widest">
                Vetted Architecture
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left 2 cols ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Security & Identity Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-wide">
                      Security And Identity Protection
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      Upgrade your access credentials.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                  Secure Line
                </span>
              </div>

              {/* Alerts */}
              <div className="px-6 pt-5">
                {message && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-xs font-semibold">
                    <CheckCircle size={14} />
                    {message}
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-xs font-semibold">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
              </div>

              {/* Form */}
              <form
                onSubmit={handleChangePassword}
                className="px-6 pb-6 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New password */}
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 alphanumeric chars"
                        className="w-full border border-black bg-gray-50 rounded-xl px-4 py-2.5 text-sm pr-10
                          focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400
                          placeholder:text-gray-300 transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
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
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                i <= score
                                  ? strengthColor[score]
                                  : "bg-gray-100"
                              }`}
                            />
                          ))}
                        </div>
                        <p
                          className={`text-[10px] font-bold ${
                            score <= 2
                              ? "text-red-500"
                              : score === 3
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        >
                          {strengthLabel[score]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5">
                      Verify Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Retype password"
                        className={`w-full border bg-gray-50 rounded-xl px-4 py-2.5 text-sm pr-10
                          focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400
                          placeholder:text-gray-300 transition ${
                            confirmPassword && confirmPassword !== newPassword
                              ? "border-red-300"
                              : "border-black"
                          }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">
                        Passphrases do not match
                      </p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && (
                      <p className="text-[10px] text-green-500 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle size={10} /> Match confirmed
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50
                    disabled:cursor-not-allowed text-white py-3 rounded-xl font-black text-sm
                    uppercase tracking-widest transition shadow-sm flex items-center justify-center gap-2"
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {loading
                    ? "Updating Security Matrix…"
                    : "Update Security Matrix"}
                </button>
              </form>
            </div>

            {/* Password Policy Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-black p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Lock size={18} className="text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-gray-900 uppercase tracking-wide mb-0.5">
                    Password Policy Guidelines
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">
                    Requirements enforced by the system.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        rule: "Minimum 6 characters required",
                        met: newPassword.length >= 6,
                      },
                      {
                        rule: "10+ characters recommended",
                        met: newPassword.length >= 10,
                      },
                      {
                        rule: "Uppercase letter included",
                        met: /[A-Z]/.test(newPassword),
                      },
                      {
                        rule: "Number included",
                        met: /[0-9]/.test(newPassword),
                      },
                      {
                        rule: "Special character included",
                        met: /[^A-Za-z0-9]/.test(newPassword),
                      },
                      {
                        rule: "Passwords stored encrypted",
                        met: true,
                        static: true,
                      },
                    ].map(({ rule, met, static: isStatic }) => (
                      <div key={rule} className="flex items-center gap-2">
                        <CheckCircle
                          size={12}
                          className={
                            isStatic
                              ? "text-blue-400"
                              : met && newPassword
                                ? "text-green-500"
                                : "text-gray-200"
                          }
                        />
                        <span
                          className={`text-[10px] font-semibold ${
                            isStatic
                              ? "text-blue-400"
                              : met && newPassword
                                ? "text-green-600"
                                : "text-gray-400"
                          }`}
                        >
                          {rule}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right col ──────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Documentation Portal Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 mb-4">
                <FileText size={18} className="text-gray-400" />
              </div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-wide">
                Documentation Portal
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 leading-relaxed">
                Review operational guidelines for processing applications,
                managing appointments, and understanding your system
                permissions.
              </p>
              <button
                onClick={() => setShowDocs(true)}
                className="mt-4 w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                  bg-gray-900 hover:bg-gray-800 text-white transition group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Staff Manual
                </span>
                <ExternalLink
                  size={12}
                  className="text-orange-400 group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            </div>

            {/* Staff Identity Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-black uppercase tracking-widest">
                    STAFF
                  </p>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                    FULL SUPPORT
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                  <Shield size={18} className="text-orange-400" />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-black leading-relaxed">
                  Tricycle eFranchise System for the Municipality
                  <br />
                  of San Jose, Occidental Mindoro.PH
                </p>
              </div>
              {profile && (
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    Authenticated as
                  </p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {profile.full_name}
                  </p>
                  <p className="text-[10px] text-orange-400 font-semibold capitalize">
                    {profile.role}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {profile.email}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-500 font-mono">V 1.0.0</p>
                <Info size={12} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
