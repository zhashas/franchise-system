import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollTo = (id) => {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const NAV_LINKS = [
    { label: "Features",     id: "features"     },
    { label: "How It Works", id: "how-it-works"  },
    { label: "Requirements", id: "requirements"  },
    { label: "User Roles",   id: "user-roles"    },
  ]

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ── */}
      <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 transition-shadow ${scrolled ? "shadow-md" : "shadow-sm"}`}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-blue-900 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-blue-900">San Jose Franchise System</p>
              <p className="text-xs text-gray-400">Municipality of San Jose, Occ. Mindoro</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm font-medium text-gray-600 hover:text-orange-500 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition shadow"
            >
              Get started →
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-3 space-y-1">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="w-full text-left text-sm font-medium text-gray-700 hover:text-orange-500 py-2 px-3 rounded-lg hover:bg-orange-50 transition"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-10 w-56 h-56 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <span className="inline-block bg-orange-500/20 text-orange-300 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-orange-400/30">
            ✦ Official Government Portal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 max-w-2xl">
            Online Tricycle Franchise{" "}
            <span className="text-orange-400">Registration</span>{" "}
            &amp; Renewal
          </h1>
          <p className="text-blue-200 text-base max-w-xl mb-8 leading-relaxed">
            Apply for and renew your tricycle franchise digitally — no long queues, no
            paperwork hassle. Track your application, schedule office appointments,
            and receive real-time updates from the Municipal Hall of San Jose.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/register")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-orange-500/30"
            >
              Apply for a franchise
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition border border-white/20"
            >
              Sign in to your account
            </button>
            {/* Quick scroll links */}
            <button
              onClick={() => scrollTo("features")}
              className="bg-white/5 hover:bg-white/15 text-white/80 font-medium px-6 py-3 rounded-xl transition border border-white/10 text-sm"
            >
              Learn more ↓
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-blue-900 border-t border-blue-800">
        <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "3",         label: "User roles supported" },
            { value: "24/7",      label: "Application window" },
            { value: "Real-time", label: "Status updates & notifications" },
            { value: "100%",      label: "Secure and reliable" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-extrabold text-orange-400">{s.value}</p>
              <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6 bg-gray-50 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 text-center mb-2">Built-in Features</p>
          <h2 className="text-3xl font-extrabold text-blue-900 text-center mb-2">Everything you need, in one place</h2>
          <p className="text-gray-500 text-sm text-center max-w-lg mx-auto mb-12">
            A complete digital platform for tricycle franchise management, built for
            applicants, staff, and administrators in San Jose.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "📋", color: "bg-blue-50 border-blue-100",     iconBg: "bg-blue-100",   title: "Online Application",      desc: "Submit new franchise applications and renewal requests digitally — anytime, from any device." },
              { icon: "🔍", color: "bg-orange-50 border-orange-100", iconBg: "bg-orange-100", title: "Application Tracking",     desc: "Monitor the status of every application in real time — from submission to final approval." },
              { icon: "📅", color: "bg-green-50 border-green-100",   iconBg: "bg-green-100",  title: "Appointment Scheduling",   desc: "Book office appointments with the franchise division to confirm required documents." },
              { icon: "🔔", color: "bg-yellow-50 border-yellow-100", iconBg: "bg-yellow-100", title: "Real-time Notifications",  desc: "Get instant alerts on application updates, appointment reminders, and approval announcements." },
              { icon: "📊", color: "bg-purple-50 border-purple-100", iconBg: "bg-purple-100", title: "Reports & Analytics",      desc: "Administrators and staff can generate franchise reports and monitor office-wide performance." },
              { icon: "🔒", color: "bg-red-50 border-red-100",       iconBg: "bg-red-100",    title: "Secure Role-based Access", desc: "Separate portals for applicants, staff, and administrators — each with their own permissions." },
            ].map((f, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${f.color} hover:shadow-md transition`}>
                <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center text-xl mb-4`}>{f.icon}</div>
                <h3 className="font-bold text-blue-900 mb-1">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6 bg-white scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 text-center mb-2">How It Works</p>
          <h2 className="text-3xl font-extrabold text-blue-900 text-center mb-2">Apply in four simple steps</h2>
          <p className="text-gray-500 text-sm text-center mb-12">
            Getting your tricycle franchise has never been easier. Complete the entire
            process from your phone or computer.
          </p>
          <div className="space-y-6">
            {[
              { step: "1", title: "Create an account",      desc: "Register with your name, email and phone number to get started." },
              { step: "2", title: "Submit your application", desc: "Fill out the online application form, attach the required documents about your unit." },
              { step: "3", title: "Schedule an appointment", desc: "Book a visit to the Municipal Hall — pick a date and time slot that works for you." },
              { step: "4", title: "Receive your franchise",  desc: "Once approved, claim your certificate and obtain your franchise certificate." },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-md shadow-orange-200">
                  {s.step}
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex-1">
                  <p className="font-bold text-blue-900">{s.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section id="requirements" className="py-20 px-6 bg-gray-50 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 text-center mb-2">Document Checklist</p>
          <h2 className="text-3xl font-extrabold text-blue-900 text-center mb-2">Requirements for Applicants</h2>
          <p className="text-gray-500 text-sm text-center max-w-lg mx-auto mb-12">
            Prepare the following before filling out your application. Having them ready
            will make your submission faster and error-free.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Personal Information */}
            <div className="bg-white rounded-2xl border border-blue-100 border-t-4 border-t-blue-500 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl flex-shrink-0">👤</div>
                <div>
                  <h3 className="font-extrabold text-blue-900">Personal Information</h3>
                  <p className="text-xs text-gray-400">Required fields in the application form</p>
                </div>
              </div>
              <ul className="space-y-2">
                {[
                  "Full name of franchise owner",
                  "Complete address (Barangay, San Jose)",
                  "Date & place of birth",
                  "Civil status",
                  "Nationality",
                  "Philippine mobile number (09XXXXXXXXX)",
                  "Email address",
                  "1x1 or ID photo (optional but recommended)",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vehicle Information */}
            <div className="bg-white rounded-2xl border border-orange-100 border-t-4 border-t-orange-500 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">🏍️</div>
                <div>
                  <h3 className="font-extrabold text-blue-900">Motorcycle / Vehicle Details</h3>
                  <p className="text-xs text-gray-400">Must be unique across all approved franchises</p>
                </div>
              </div>
              <ul className="space-y-2">
                {[
                  "Make / brand (e.g. RUSI, Honda, Kawasaki)",
                  "Color",
                  "Motor / Engine No. — letters & numbers only, 6–20 chars",
                  "Chassis No. — letters & numbers only, 10–25 chars",
                  "Plate Number",
                  "Classification (For Hire / Not for Hire)",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-orange-400 mt-0.5 flex-shrink-0">✓</span>{item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700">
                <p className="font-semibold mb-1">📌 Vehicle Number Rules</p>
                <p>Engine & Chassis must use A–Z and 0–9 only — no spaces, dashes, or special characters.</p>
              </div>
            </div>

            {/* Required Documents */}
            <div className="bg-white rounded-2xl border border-green-100 border-t-4 border-t-green-500 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl flex-shrink-0">📎</div>
                <div>
                  <h3 className="font-extrabold text-blue-900">Required Documents</h3>
                  <p className="text-xs text-gray-400">Upload clear, legible photo or scanned copies</p>
                </div>
              </div>
              <ul className="space-y-2">
                {[
                  { label: "Latest O.R. ng Motor (LTO)", both: true },
                  { label: "Certificate of Registration — C.R. (LTO)", both: true },
                  { label: "Cedula (Updated)", both: true },
                  { label: "Police Clearance", both: true },
                  { label: "Barangay Residency Certificate (Updated)", both: true },
                  { label: "Voter's Certification — COMELEC (Updated)", both: true },
                  { label: "Stencil ng Motor (Engine / Chassis)", both: false, note: "New registration only" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-0.5 flex-shrink-0 ${item.both ? "text-green-500" : "text-yellow-500"}`}>✓</span>
                    <span>
                      {item.label}
                      {item.note && <span className="ml-1 text-xs text-yellow-600 font-semibold bg-yellow-50 px-1.5 py-0.5 rounded-full">{item.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Photos Required */}
            <div className="bg-white rounded-2xl border border-purple-100 border-t-4 border-t-purple-500 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl flex-shrink-0">📷</div>
                <div>
                  <h3 className="font-extrabold text-blue-900">Condition & Garage Photos</h3>
                  <p className="text-xs text-gray-400">Clear photos of the tricycle and garage</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Required</p>
              <ul className="space-y-2 mb-4">
                {[
                  "Tricycle overall condition photo",
                  "Garage overall condition photo",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 mt-0.5 flex-shrink-0">✓</span>{item}
                  </li>
                ))}
              </ul>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Optional but recommended</p>
              <ul className="space-y-2">
                {[
                  "Left & Right signal lights",
                  "Head light & tail light",
                  "Ilaw sa loob ng sidecar",
                  "Basurahan sa loob ng sidecar",
                  "Garage photo with tricycle",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                    <span className="text-gray-300 mt-0.5 flex-shrink-0">○</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reminder banner */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-3xl flex-shrink-0">📌</span>
            <div className="flex-1 text-sm text-blue-800 space-y-1">
              <p className="font-bold">Important Reminders Before You Apply</p>
              <p>• Only <strong>one active application</strong> (pending or under review) is allowed at a time.</p>
              <p>• Maximum of <strong>3 approved franchises</strong> per applicant.</p>
              <p>• Engine, Chassis, and Plate Numbers must be <strong>unique</strong> across all approved franchises.</p>
              <p>• A <strong>Franchise Number (SJ-XXXX)</strong> is auto-assigned upon approval for new registrations.</p>
              <p>• The <strong>Control Number (CN-YYYY-XXXXXX)</strong> appears only on the printed franchise copy.</p>
            </div>
            <button
              onClick={() => navigate("/register")}
              className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow text-sm"
            >
              Apply Now →
            </button>
          </div>
        </div>
      </section>

      {/* ── USER ROLES ── */}
      <section id="user-roles" className="py-20 px-6 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 text-center mb-2">User Roles</p>
          <h2 className="text-3xl font-extrabold text-blue-900 text-center mb-2">A portal built for everyone</h2>
          <p className="text-gray-500 text-sm text-center mb-12">
            Whether you're an applicant, a franchise officer, or a municipal administrator, the system adapts to your role.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "👤",
                color: "border-t-blue-500",
                badge: "bg-blue-100 text-blue-700",
                title: "Applicant",
                subtitle: "Tricycle operators and drivers who need to register or renew their franchise.",
                points: [
                  "Submit new franchise applications",
                  "Track application status in real time",
                  "Schedule appointments with staff",
                  "Receive notifications & updates",
                ],
              },
              {
                icon: "🛡️",
                color: "border-t-orange-500",
                badge: "bg-orange-100 text-orange-700",
                title: "Staff",
                subtitle: "Franchise division officers responsible for processing and reviewing applications.",
                points: [
                  "Access all submitted applications",
                  "View application counts & status",
                  "Generate franchise reports",
                  "Send notifications and updates",
                ],
              },
              {
                icon: "⚙️",
                color: "border-t-green-500",
                badge: "bg-green-100 text-green-700",
                title: "Administrator",
                subtitle: "Municipal office with full oversight of the franchise management system.",
                points: [
                  "Full registration oversight",
                  "Manage staff and real power",
                  "View analytics & reports",
                  "Configure system settings",
                ],
              },
            ].map((r, i) => (
              <div key={i} className={`bg-white rounded-2xl border border-gray-100 border-t-4 ${r.color} shadow-sm p-6 hover:shadow-md transition`}>
                <div className="text-3xl mb-3">{r.icon}</div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.badge}`}>{r.title}</span>
                <p className="text-gray-500 text-sm mt-3 mb-4 leading-relaxed">{r.subtitle}</p>
                <ul className="space-y-1.5">
                  {r.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-950 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-extrabold mb-3">Ready to get started?</h2>
        <p className="text-blue-300 text-sm max-w-md mx-auto mb-8">
          Register your account today and apply for your tricycle franchise online — fast, easy, and paperless.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate("/register")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3 rounded-xl transition shadow-lg shadow-orange-500/30"
          >
            Create an Account
          </button>
          <button
            onClick={() => navigate("/login")}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3 rounded-xl transition border border-white/20"
          >
            Sign In
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-blue-950 text-blue-400 text-xs text-center py-5 px-6">
        © 2025 Municipality of San Jose, Occidental Mindoro. All rights reserved.
      </footer>
    </div>
  )
}