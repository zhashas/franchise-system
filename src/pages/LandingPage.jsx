import { useNavigate } from "react-router-dom"

export default function LandingPage() {
  const navigate = useNavigate()

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-blue-900">San Jose Franchise System</p>
              <p className="text-xs text-gray-400">Municipality of San Jose</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <button onClick={() => scrollTo("features")} className="hover:text-orange-500">Features</button>
              <button onClick={() => scrollTo("how")} className="hover:text-orange-500">How it works</button>
              <button onClick={() => scrollTo("requirements")} className="hover:text-orange-500">Requirements</button>
              <button onClick={() => scrollTo("roles")} className="hover:text-orange-500">User Roles</button>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition shadow"
            >
              Get started →
            </button>
          </div>
        </div>
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
            Online Tricycle Franchise <span className="text-orange-400">Registration</span> &amp; Renewal
          </h1>
          <p className="text-blue-200 text-base max-w-xl mb-8 leading-relaxed">
            Apply, renew, and track your franchise digitally — no queues, no paperwork.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate("/register")} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-orange-500/30">
              Apply Now
            </button>
            <button onClick={() => navigate("/login")} className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition border border-white/20">
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-blue-900 border-t border-blue-800">
        <div className="max-w-6xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "3", label: "User roles" },
            { value: "24/7", label: "Applications" },
            { value: "Real-time", label: "Notifications" },
            { value: "100%", label: "Secure" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-extrabold text-orange-400">{s.value}</p>
              <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Built-in Features</p>
          <h2 className="text-3xl font-extrabold text-blue-900 mb-12">Everything you need</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "📋", title: "Online Application", color: "bg-blue-50 border-blue-100", iconBg: "bg-blue-100" },
              { icon: "🔍", title: "Application Tracking", color: "bg-orange-50 border-orange-100", iconBg: "bg-orange-100" },
              { icon: "📅", title: "Appointment Scheduling", color: "bg-green-50 border-green-100", iconBg: "bg-green-100" },
              { icon: "🔔", title: "Notifications", color: "bg-yellow-50 border-yellow-100", iconBg: "bg-yellow-100" },
              { icon: "📊", title: "Reports & Analytics", color: "bg-purple-50 border-purple-100", iconBg: "bg-purple-100" },
              { icon: "🔒", title: "Secure Access", color: "bg-red-50 border-red-100", iconBg: "bg-red-100" },
            ].map((f, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${f.color} hover:shadow-md transition`}>
                <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center text-xl mb-4`}>{f.icon}</div>
                <h3 className="font-bold text-blue-900">{f.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">How It Works</p>
          <h2 className="text-3xl font-extrabold text-blue-900 mb-12">Four simple steps</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Create account" },
              { step: "2", title: "Submit application" },
              { step: "3", title: "Schedule appointment" },
              { step: "4", title: "Get approved" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-md shadow-orange-200">
                  {s.step}
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 flex-1">
                  <p className="font-bold text-blue-900">{s.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section id="requirements" className="py-20 px-6 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-10">Applicant Requirements</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-bold text-blue-900 mb-3">New Registration</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Valid ID</li>
              <li>• OR/CR of vehicle</li>
              <li>• Barangay Clearance</li>
              <li>• Proof of Ownership</li>
              <li>• Driver's License</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-bold text-orange-600 mb-3">Renewal</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Previous Franchise Certificate</li>
              <li>• Updated OR/CR</li>
              <li>• Valid ID</li>
              <li>• Inspection Clearance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── USER ROLES ── */}
      <section id="roles" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">User Roles</p>
          <h2 className="text-3xl font-extrabold text-blue-900 mb-12">Built for everyone</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "👤", title: "Applicant", color: "border-t-blue-500", badge: "bg-blue-100 text-blue-700" },
              { icon: "🛡️", title: "Staff", color: "border-t-orange-500", badge: "bg-orange-100 text-orange-700" },
              { icon: "⚙️", title: "Admin", color: "border-t-green-500", badge: "bg-green-100 text-green-700" },
            ].map((r, i) => (
              <div key={i} className={`bg-gray-50 rounded-2xl border border-gray-100 border-t-4 ${r.color} shadow-sm p-6 hover:shadow-md transition`}>
                <div className="text-3xl mb-3">{r.icon}</div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.badge}`}>{r.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-blue-900 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-extrabold mb-3">Ready to get started?</h2>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button onClick={() => navigate("/register")} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3 rounded-xl transition shadow-lg shadow-orange-500/30">
            Create Account
          </button>
          <button onClick={() => navigate("/login")} className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3 rounded-xl transition border border-white/20">
            Sign In
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-blue-950 text-blue-400 text-xs text-center py-5">
        © 2025 Municipality of San Jose. All rights reserved.
      </footer>
    </div>
  )
}