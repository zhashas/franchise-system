import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  FileText,
  Bell,
  Calendar,
  Shield,
  BarChart3,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  Menu,
  X,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const NAV_LINKS = [
    { label: "Features", id: "features" },
    { label: "How It Works", id: "how-it-works" },
    { label: "Requirements", id: "requirements" },
    { label: "User Roles", id: "user-roles" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* ══════════════════════════════════════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? "shadow-lg border-b border-gray-100"
            : "shadow-sm border-b border-gray-50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect
                    x="2"
                    y="2"
                    width="6"
                    height="6"
                    rx="1.5"
                    fill="white"
                  />
                  <rect
                    x="12"
                    y="2"
                    width="6"
                    height="6"
                    rx="1.5"
                    fill="white"
                  />
                  <rect
                    x="2"
                    y="12"
                    width="6"
                    height="6"
                    rx="1.5"
                    fill="white"
                  />
                  <rect
                    x="12"
                    y="12"
                    width="6"
                    height="6"
                    rx="1.5"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="leading-tight">
                <p className="text-sm font-extrabold text-gray-900">
                  San Jose Franchise System
                </p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Municipality Portal
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="text-[13px] font-semibold text-gray-600 hover:text-orange-500 px-4 py-2 rounded-xl hover:bg-orange-50 transition-all duration-150"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/login")}
                className="hidden sm:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
              >
                Get Started
                <ArrowRight size={14} />
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen((p) => !p)}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="lg:hidden border-t border-gray-100 py-4 space-y-1">
              {NAV_LINKS.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="w-full text-left text-sm font-semibold text-gray-700 hover:text-orange-500 py-2.5 px-4 rounded-xl hover:bg-orange-50 transition"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition mt-3"
              >
                Get Started
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-orange-400/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              Official Government Portal
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              Online Tricycle Franchise{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                Registration
              </span>{" "}
              &amp; Renewal
            </h1>

            {/* Description */}
            <p className="text-blue-200 text-base lg:text-lg leading-relaxed mb-8 max-w-2xl">
              Apply for and renew your tricycle franchise digitally — no long
              queues, no paperwork hassle. Track your application, schedule
              office appointments, and receive real-time updates from the
              Municipal Hall of San Jose.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/register")}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-orange-500/30 hover:shadow-xl"
              >
                Apply for Franchise
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-150 border border-white/20 backdrop-blur-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => scrollTo("features")}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 border border-white/10"
              >
                Learn More
                <ChevronRight size={16} className="animate-bounce" />
              </button>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="#F9FAFB"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 -mt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                value: "3",
                label: "User Roles Supported",
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                icon: Clock,
                value: "24/7",
                label: "Application Window",
                color: "text-orange-500",
                bg: "bg-orange-50",
              },
              {
                icon: Bell,
                value: "Real-time",
                label: "Status Notifications",
                color: "text-green-500",
                bg: "bg-green-50",
              },
              {
                icon: Shield,
                value: "100%",
                label: "Secure & Reliable",
                color: "text-purple-500",
                bg: "bg-purple-50",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-all duration-150"
              >
                <div
                  className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}
                >
                  <stat.icon size={22} className={stat.color} />
                </div>
                <p className={`text-2xl font-black ${stat.color} mb-1`}>
                  {stat.value}
                </p>
                <p className="text-xs font-semibold text-gray-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-3 py-1 rounded-full mb-3">
              Built-in Features
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
              Everything You Need, In One Place
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
              A complete digital platform for tricycle franchise management,
              built for applicants, staff, and administrators in San Jose.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                color: "text-blue-500",
                bg: "bg-blue-50",
                border: "border-blue-100",
                title: "Online Application",
                desc: "Submit new franchise applications and renewal requests digitally — anytime, from any device.",
              },
              {
                icon: BarChart3,
                color: "text-orange-500",
                bg: "bg-orange-50",
                border: "border-orange-100",
                title: "Application Tracking",
                desc: "Monitor the status of every application in real time — from submission to final approval.",
              },
              {
                icon: Calendar,
                color: "text-green-500",
                bg: "bg-green-50",
                border: "border-green-100",
                title: "Appointment Scheduling",
                desc: "Book office appointments with the franchise division to confirm required documents.",
              },
              {
                icon: Bell,
                color: "text-yellow-500",
                bg: "bg-yellow-50",
                border: "border-yellow-100",
                title: "Real-time Notifications",
                desc: "Get instant alerts on application updates, appointment reminders, and approval announcements.",
              },
              {
                icon: BarChart3,
                color: "text-purple-500",
                bg: "bg-purple-50",
                border: "border-purple-100",
                title: "Reports & Analytics",
                desc: "Administrators and staff can generate franchise reports and monitor office-wide performance.",
              },
              {
                icon: Shield,
                color: "text-red-500",
                bg: "bg-red-50",
                border: "border-red-100",
                title: "Secure Role-based Access",
                desc: "Separate portals for applicants, staff, and administrators — each with their own permissions.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group bg-white rounded-2xl border-2 ${feature.border} p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div
                  className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon size={24} className={feature.color} />
                </div>
                <h3 className="font-black text-gray-900 text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-20"
      >
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-3 py-1 rounded-full mb-3">
              How It Works
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
              Apply in Four Simple Steps
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
              Getting your tricycle franchise has never been easier. Complete
              the entire process from your phone or computer.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Create an Account",
                desc: "Register with your name, email and phone number to get started.",
                icon: Users,
                color: "bg-blue-500",
              },
              {
                step: "2",
                title: "Submit Your Application",
                desc: "Fill out the online application form and attach the required documents about your unit.",
                icon: FileText,
                color: "bg-orange-500",
              },
              {
                step: "3",
                title: "Schedule an Appointment",
                desc: "Book a visit to the Municipal Hall — pick a date and time slot that works for you.",
                icon: Calendar,
                color: "bg-green-500",
              },
              {
                step: "4",
                title: "Receive Your Franchise",
                desc: "Once approved, claim your certificate and obtain your franchise certificate.",
                icon: CheckCircle,
                color: "bg-purple-500",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-200"
              >
                <div className="flex items-start gap-4">
                  {/* Step number */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 ${step.color} text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {step.step}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-black text-gray-900 text-lg">
                        {step.title}
                      </h3>
                      <step.icon
                        size={18}
                        className="text-gray-300 group-hover:text-orange-500 transition-colors"
                      />
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-150 shadow-lg hover:shadow-xl"
            >
              Start Your Application
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          REQUIREMENTS
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="requirements"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-3 py-1 rounded-full mb-3">
              Document Checklist
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
              Requirements for Applicants
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
              Prepare the following before filling out your application. Having
              them ready will make your submission faster and error-free.
            </p>
          </div>

          {/* Requirements Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Personal Information */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 border-t-4 border-t-blue-500 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">
                    Personal Information
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Required fields in the application form
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
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
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <CheckCircle
                      size={16}
                      className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vehicle Information */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl border-2 border-orange-100 border-t-4 border-t-orange-500 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 text-2xl">
                  🏍️
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">
                    Motorcycle / Vehicle Details
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Must be unique across all approved franchises
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 mb-4">
                {[
                  "Make / brand (e.g. RUSI, Honda, Kawasaki)",
                  "Color",
                  "Motor / Engine No. — letters & numbers only, 6–20 chars",
                  "Chassis No. — letters & numbers only, 10–25 chars",
                  "Plate Number",
                  "Classification (For Hire / Not for Hire)",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    <CheckCircle
                      size={16}
                      className="text-orange-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-orange-100 border border-orange-200 rounded-xl px-4 py-3 text-xs text-orange-800">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <span className="text-sm">⚠️</span>
                  Vehicle Number Rules
                </p>
                <p className="font-medium">
                  Engine & Chassis must use A–Z and 0–9 only — no spaces,
                  dashes, or special characters.
                </p>
              </div>
            </div>

            {/* Required Documents */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl border-2 border-green-100 border-t-4 border-t-green-500 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={24} className="text-green-500" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">
                    Required Documents
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Upload clear, legible photo or scanned copies
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {[
                  { label: "Latest O.R. ng Motor (LTO)", required: true },
                  {
                    label: "Certificate of Registration — C.R. (LTO)",
                    required: true,
                  },
                  { label: "Cedula (Updated)", required: true },
                  { label: "Police Clearance", required: true },
                  {
                    label: "Barangay Residency Certificate (Updated)",
                    required: true,
                  },
                  {
                    label: "Voter's Certification — COMELEC (Updated)",
                    required: true,
                  },
                  {
                    label: "Stencil ng Motor (Engine / Chassis)",
                    required: false,
                    note: "New registration only",
                  },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-gray-700"
                  >
                    {item.required ? (
                      <CheckCircle
                        size={16}
                        className="text-green-500 mt-0.5 flex-shrink-0"
                      />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-yellow-400 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="font-medium flex-1">
                      {item.label}
                      {item.note && (
                        <span className="ml-2 text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                          {item.note}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Photos Required */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border-2 border-purple-100 border-t-4 border-t-purple-500 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 text-2xl">
                  📷
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">
                    Condition & Garage Photos
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Clear photos of the tricycle and garage
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                  Required
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Tricycle overall condition photo",
                    "Garage overall condition photo",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-gray-700"
                    >
                      <CheckCircle
                        size={16}
                        className="text-purple-500 mt-0.5 flex-shrink-0"
                      />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">
                  Optional but recommended
                </p>
                <ul className="space-y-2">
                  {[
                    "Left & Right signal lights",
                    "Head light & tail light",
                    "Ilaw sa loob ng sidecar",
                    "Basurahan sa loob ng sidecar",
                    "Garage photo with tricycle",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-gray-500"
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5 flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Important Reminders */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                📌
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-black text-blue-900 text-xl mb-3">
                  Important Reminders Before You Apply
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle
                      size={16}
                      className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="font-semibold">
                      Only <strong>one active application</strong> (pending or
                      under review) is allowed at a time.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle
                      size={16}
                      className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="font-semibold">
                      Maximum of <strong>3 approved franchises</strong> per
                      applicant.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle
                      size={16}
                      className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="font-semibold">
                      Engine, Chassis, and Plate Numbers must be{" "}
                      <strong>unique</strong> across all approved franchises.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle
                      size={16}
                      className="text-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <span className="font-semibold">
                      A <strong>Franchise Number (SJ-XXXX)</strong> is
                      auto-assigned upon approval for new registrations.
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/register")}
                className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-150 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Apply Now
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          USER ROLES
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="user-roles"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-3 py-1 rounded-full mb-3">
              User Roles
            </span>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
              A Portal Built for Everyone
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
              Whether you're an applicant, a franchise officer, or a municipal
              administrator, the system adapts to your role.
            </p>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "👤",
                color: "border-t-blue-500",
                badgeBg: "bg-blue-100",
                badgeText: "text-blue-700",
                title: "Applicant",
                subtitle:
                  "Tricycle operators and drivers who need to register or renew their franchise.",
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
                badgeBg: "bg-orange-100",
                badgeText: "text-orange-700",
                title: "Staff",
                subtitle:
                  "Franchise division officers responsible for processing and reviewing applications.",
                points: [
                  "Access all submitted applications",
                  "Review and process applications",
                  "Generate franchise reports",
                  "Send notifications and updates",
                ],
              },
              {
                icon: "⚙️",
                color: "border-t-green-500",
                badgeBg: "bg-green-100",
                badgeText: "text-green-700",
                title: "Administrator",
                subtitle:
                  "Municipal office with full oversight of the franchise management system.",
                points: [
                  "Full registration oversight",
                  "Manage staff and user permissions",
                  "View analytics & reports",
                  "Configure system settings",
                ],
              },
            ].map((role, i) => (
              <div
                key={i}
                className={`group bg-white rounded-2xl border-2 border-gray-100 border-t-4 ${role.color} shadow-sm hover:shadow-xl transition-all duration-300 p-6 hover:-translate-y-1`}
              >
                <div className="text-4xl mb-4">{role.icon}</div>
                <span
                  className={`inline-block text-xs font-black px-3 py-1.5 rounded-full ${role.badgeBg} ${role.badgeText} mb-4`}
                >
                  {role.title}
                </span>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                  {role.subtitle}
                </p>
                <ul className="space-y-2.5">
                  {role.points.map((point, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2.5 text-sm text-gray-700"
                    >
                      <CheckCircle
                        size={16}
                        className="text-orange-500 mt-0.5 flex-shrink-0"
                      />
                      <span className="font-medium">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-black mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-200 text-base lg:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Register your account today and apply for your tricycle franchise
            online — fast, easy, and paperless.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-150 shadow-lg shadow-orange-500/30 hover:shadow-xl"
            >
              Create an Account
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all duration-150 border border-white/20 backdrop-blur-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="1"
                      y="1"
                      width="5"
                      height="5"
                      rx="1"
                      fill="white"
                    />
                    <rect
                      x="10"
                      y="1"
                      width="5"
                      height="5"
                      rx="1"
                      fill="white"
                    />
                    <rect
                      x="1"
                      y="10"
                      width="5"
                      height="5"
                      rx="1"
                      fill="white"
                    />
                    <rect
                      x="10"
                      y="10"
                      width="5"
                      height="5"
                      rx="1"
                      fill="white"
                    />
                  </svg>
                </div>
                <span className="font-bold text-white text-sm">
                  San Jose Franchise System
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-4">
                Official online portal for tricycle franchise registration and
                renewal in the Municipality of San Jose, Occidental Mindoro.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                {NAV_LINKS.map(({ label, id }) => (
                  <li key={id}>
                    <button
                      onClick={() => scrollTo(id)}
                      className="hover:text-orange-400 transition-colors flex items-center gap-1.5"
                    >
                      <ChevronRight size={12} />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-white text-sm mb-3">
                Contact Information
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <MapPin
                    size={14}
                    className="text-orange-400 mt-0.5 flex-shrink-0"
                  />
                  <span>Municipal Hall, San Jose, Occidental Mindoro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-orange-400 flex-shrink-0" />
                  <span>(043) XXX-XXXX</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-orange-400 flex-shrink-0" />
                  <span>info@sanjose.gov.ph</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-center sm:text-left">
              © 2025 Municipality of San Jose, Occidental Mindoro. All rights
              reserved.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <button className="hover:text-orange-400 transition-colors">
                Privacy Policy
              </button>
              <span className="text-gray-700">•</span>
              <button className="hover:text-orange-400 transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
