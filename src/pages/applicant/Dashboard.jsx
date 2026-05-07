// src/pages/applicant/ApplicantDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import ApplicantLayout from "../../components/ApplicantLayout";
import { X, Calendar, FileText, Bell, AlertTriangle } from "lucide-react";

// ─── Status Steps Builder ─────────────────────────────────────────────────
function getStatusSteps(app) {
  if (!app) return [];
  const s = app.status;

  const steps = [
    {
      key: "submitted",
      label: "Submitted",
      desc: "Application received",
      icon: "📤",
      done: true,
      active: s === "pending",
    },
    {
      key: "under_review",
      label: "Under Review",
      desc: "Documents being verified",
      icon: "🔍",
      done: [
        "under_review",
        "approved",
        "rejected",
        "for_release",
        "released",
      ].includes(s),
      active: s === "under_review",
    },
    {
      key: "decision",
      label:
        s === "rejected"
          ? "Rejected"
          : s === "approved" || s === "for_release" || s === "released"
            ? "Approved"
            : "Pending Decision",
      desc:
        s === "approved"
          ? "Franchise approved!"
          : s === "rejected"
            ? "Application declined"
            : s === "for_release"
              ? "Ready for release"
              : s === "released"
                ? "Permit released"
                : "Awaiting decision",
      icon:
        s === "approved" || s === "for_release" || s === "released"
          ? "✅"
          : s === "rejected"
            ? "❌"
            : "⏳",
      done: ["approved", "rejected", "for_release", "released"].includes(s),
      active: ["approved", "for_release", "released"].includes(s),
      isRejected: s === "rejected",
    },
    {
      key: "release",
      label: s === "released" ? "Released" : "For Release",
      desc: s === "released" ? "Permit claimed" : "Ready to claim",
      icon: s === "released" ? "✓" : "🏛️",
      done: s === "released",
      active: s === "for_release" || s === "released",
      skip: !["for_release", "released"].includes(s),
    },
  ];

  return steps.filter((step) => !step.skip);
}

// ─── Appointment Detail Modal ─────────────────────────────────────────────
function AppointmentModal({ apt, onClose }) {
  if (!apt) return null;

  const statusConfig =
    apt.status === "confirmed"
      ? { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" }
      : apt.status === "completed"
        ? {
            bg: "bg-green-100",
            text: "text-green-700",
            border: "border-green-300",
          }
        : apt.status === "cancelled"
          ? { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" }
          : {
              bg: "bg-yellow-100",
              text: "text-yellow-700",
              border: "border-yellow-300",
            };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-blue-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-blue-50 px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-3xl">
            <Calendar size={32} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-extrabold text-blue-800">
              Appointment Details
            </h2>
            <p className="text-xs text-blue-500 mt-0.5">
              Franchise Office · San Jose, Occidental Mindoro
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-500 mb-1 flex items-center gap-1">
                <Calendar size={12} /> Date
              </p>
              <p className="text-sm font-bold text-blue-800">
                {new Date(apt.scheduled_date).toLocaleDateString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-semibold text-blue-500 mb-1">
                🕐 Time
              </p>
              <p className="text-sm font-bold text-blue-800">
                {apt.scheduled_time}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">Status</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}
            >
              {apt.status}
            </span>
          </div>

          {apt.notes && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                📝 Notes
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {apt.notes}
              </p>
            </div>
          )}

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold mb-2">
              <AlertTriangle size={12} />
              <span>Important Reminders:</span>
            </div>
            <p>• Visit the Municipal Hall – Business Permits Office</p>
            <p>• Bring your valid ID and original documents</p>
            <p>• Arrive at least 15 minutes before your scheduled time</p>
            <p>• Contact the office if you need to reschedule</p>
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Detail Modal ────────────────────────────────────────────
function NotificationModal({ notif, onClose }) {
  if (!notif) return null;

  const title = (notif.title || "").toLowerCase();
  const config = title.includes("approved")
    ? {
        icon: "✅",
        header: "bg-green-50",
        border: "border-green-500",
        titleColor: "text-green-800",
        showNextSteps: true,
      }
    : title.includes("rejected")
      ? {
          icon: "❌",
          header: "bg-red-50",
          border: "border-red-500",
          titleColor: "text-red-800",
          showNextSteps: false,
        }
      : title.includes("release")
        ? {
            icon: "🏛️",
            header: "bg-purple-50",
            border: "border-purple-500",
            titleColor: "text-purple-800",
            showNextSteps: true,
          }
        : {
            icon: "🔔",
            header: "bg-orange-50",
            border: "border-orange-400",
            titleColor: "text-orange-800",
            showNextSteps: false,
          };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${config.border}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${config.header} px-6 py-5 flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 text-3xl">
            {config.icon}
          </div>
          <div className="flex-1">
            <h2 className={`text-base font-extrabold ${config.titleColor}`}>
              {notif.title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              From:{" "}
              {notif.sender_type === "system"
                ? "🤖 System"
                : "👤 Admin / Staff"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed">
              {notif.message}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              {new Date(notif.created_at).toLocaleDateString("en-PH", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>{notif.is_read ? "Read" : "Unread"}</span>
          </div>

          {config.showNextSteps && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-xs text-orange-800 space-y-1">
              <p className="font-bold mb-1 flex items-center gap-1">
                <FileText size={12} /> Next Steps:
              </p>
              <p>• Visit the Municipal Hall – Business Permits Office</p>
              <p>• Bring a valid ID and required documents</p>
              <p>• Claim your official Franchise Permit</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────
export default function ApplicantDashboard() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [selectedApt, setSelectedApt] = useState(null);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // ── Fetch all dashboard data ──────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get the authenticated user first — never skip this step
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("[Dashboard] Auth error:", authError.message);
        navigate("/login");
        return;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      const uid = user.id;

      // 2. Fetch each table individually so one failure doesn't kill the rest.
      //    profiles MUST use .eq("id", uid).single() — no unfiltered selects.
      const [profileRes, appsRes, aptsRes, notifsRes, franchisesRes] =
        await Promise.allSettled([
          // ✅ Scoped to logged-in user only → avoids 406 from RLS
          supabase.from("profiles").select("*").eq("id", uid).single(),

          supabase
            .from("applications")
            .select("*")
            .eq("applicant_id", uid)
            .order("created_at", { ascending: false }),

          supabase
            .from("appointments")
            .select("*, applications(type)")
            .eq("applicant_id", uid)
            .order("scheduled_date", { ascending: true }),

          supabase
            .from("notifications")
            .select("*")
            .eq("recipient_id", uid)
            .eq("recipient_type", "applicant")
            .order("created_at", { ascending: false })
            .limit(5),

          supabase.from("franchises").select("*").eq("applicant_id", uid),
        ]);

      // ── Profile ──────────────────────────────────────────────────────
      if (profileRes.status === "fulfilled") {
        const { data, error: err } = profileRes.value;
        if (err) {
          // 406 means no row found OR RLS blocked it
          console.warn(
            "[Dashboard] profiles query error:",
            err.code,
            err.message,
          );
        } else {
          setProfile(data);
        }
      } else {
        console.error(
          "[Dashboard] profiles fetch rejected:",
          profileRes.reason,
        );
      }

      // ── Applications ─────────────────────────────────────────────────
      if (appsRes.status === "fulfilled") {
        const { data, error: err } = appsRes.value;
        if (err) console.warn("[Dashboard] applications error:", err.message);
        else setApplications(data ?? []);
      }

      // ── Appointments ─────────────────────────────────────────────────
      if (aptsRes.status === "fulfilled") {
        const { data, error: err } = aptsRes.value;
        if (err) console.warn("[Dashboard] appointments error:", err.message);
        else setAppointments(data ?? []);
      }

      // ── Notifications ─────────────────────────────────────────────────
      if (notifsRes.status === "fulfilled") {
        const { data, error: err } = notifsRes.value;
        if (err) console.warn("[Dashboard] notifications error:", err.message);
        else setRecentNotifs(data ?? []);
      }

      // ── Franchises ───────────────────────────────────────────────────
      if (franchisesRes.status === "fulfilled") {
        const { data, error: err } = franchisesRes.value;
        if (err) console.warn("[Dashboard] franchises error:", err.message);
        else setFranchises(data ?? []);
      }
    } catch (err) {
      console.error("[Dashboard] Unexpected error:", err);
      setError("Something went wrong loading your dashboard. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Mark notification as read + sync bell badge ───────────────────────
  const handleNotifClick = async (n) => {
    // Open the modal immediately for a snappy UX
    setSelectedNotif(n);

    if (n.is_read) return; // nothing to do

    // Optimistic local update
    setRecentNotifs((prev) =>
      prev.map((item) =>
        item.id === n.id ? { ...item, is_read: true } : item,
      ),
    );

    // Persist to Supabase
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", n.id);

    if (updateError) {
      console.error("[Dashboard] markRead failed:", updateError.message);
      // Revert optimistic update on error
      setRecentNotifs((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: false } : item,
        ),
      );
      return;
    }

    // Sync bell badge stored in localStorage
    const current = parseInt(localStorage.getItem("notif_unread") ?? "0", 10);
    const updated = Math.max(0, current - 1);
    localStorage.setItem("notif_unread", String(updated));
    window.dispatchEvent(
      new CustomEvent("notif_unread_update", { detail: updated }),
    );
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <ApplicantLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading your dashboard…</p>
        </div>
      </ApplicantLayout>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <ApplicantLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
          <AlertTriangle size={40} className="text-red-400" />
          <p className="text-sm text-red-600 font-semibold">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition"
          >
            Try Again
          </button>
        </div>
      </ApplicantLayout>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────
  const latestApp = applications[0] ?? null;
  const upcomingApt = appointments.find(
    (a) => a.status === "confirmed" && new Date(a.scheduled_date) >= new Date(),
  );
  const steps = getStatusSteps(latestApp);

  const activeFranchises = franchises.filter((f) => f.status === "active");
  const expiringFranchises = franchises.filter(
    (f) =>
      f.status === "active" &&
      new Date(f.expiration_date) <=
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  );

  const statusColor = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-700 border-green-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
      under_review: "bg-blue-100 text-blue-700 border-blue-300",
      for_release: "bg-purple-100 text-purple-700 border-purple-300",
      released: "bg-gray-100 text-gray-700 border-gray-300",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
    };
    return colors[status] ?? "bg-gray-100 text-gray-700 border-gray-300";
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <ApplicantLayout>
      {/* ── Modals ── */}
      {selectedApt && (
        <AppointmentModal
          apt={selectedApt}
          onClose={() => setSelectedApt(null)}
        />
      )}
      {selectedNotif && (
        <NotificationModal
          notif={selectedNotif}
          onClose={() => setSelectedNotif(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        {/* ── WELCOME BANNER ── */}
        <div className="rounded-xl px-6 py-5 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Good day, {profile?.full_name ?? "Applicant"}! 👋
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Welcome to your eFranchise Dashboard — manage your applications
                and appointments.
              </p>
            </div>
            <div className="hidden md:block text-6xl opacity-20">🛺</div>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Applications",
              value: applications.length,
              color: "border-blue-400",
              bgColor: "bg-blue-50",
              textColor: "text-blue-700",
              icon: "📋",
            },
            {
              label: "Pending Review",
              value: applications.filter((a) =>
                ["pending", "under_review"].includes(a.status),
              ).length,
              color: "border-yellow-400",
              bgColor: "bg-yellow-50",
              textColor: "text-yellow-700",
              icon: "⏳",
            },
            {
              label: "Active Franchises",
              value: activeFranchises.length,
              color: "border-green-400",
              bgColor: "bg-green-50",
              textColor: "text-green-700",
              icon: "✅",
            },
            {
              label: "Appointments",
              value: appointments.filter((a) => a.status === "confirmed")
                .length,
              color: "border-orange-400",
              bgColor: "bg-orange-50",
              textColor: "text-orange-700",
              icon: "📅",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`${stat.bgColor} rounded-xl p-5 shadow-sm border-t-4 ${stat.color} transition hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{stat.icon}</span>
                <p className={`text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── EXPIRING FRANCHISES ALERT ── */}
        {expiringFranchises.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800 mb-1">
                ⚠️ Franchise Expiring Soon
              </h3>
              <p className="text-xs text-red-700 mb-3">
                You have {expiringFranchises.length} franchise
                {expiringFranchises.length > 1 ? "s" : ""} expiring within 90
                days. Renew now to avoid interruption.
              </p>
              <button
                onClick={() => navigate("/applicant/apply")}
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              >
                Renew Now →
              </button>
            </div>
          </div>
        )}

        {/* ── APPLICATION STATUS TRACKER ── */}
        {latestApp && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
                  <FileText size={18} className="text-orange-500" />
                  Latest Application Status
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                  {latestApp.type} · Submitted{" "}
                  {new Date(latestApp.created_at).toLocaleDateString("en-PH")}
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize border ${statusColor(latestApp.status)}`}
              >
                {latestApp.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Progress Steps */}
            <div className="flex items-start justify-between mb-5">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const circleCls = !step.done
                  ? "bg-gray-100 text-gray-400 border-2 border-gray-200"
                  : step.isRejected
                    ? "bg-red-500 text-white shadow-sm"
                    : "bg-orange-500 text-white shadow-sm";
                const lineCls =
                  step.done && !step.isRejected
                    ? "bg-orange-400"
                    : "bg-gray-200";
                const labelCls = !step.done
                  ? "text-gray-400"
                  : step.isRejected
                    ? "text-red-600"
                    : "text-gray-800";

                return (
                  <div
                    key={step.key}
                    className="flex-1 flex flex-col items-center relative"
                  >
                    {!isLast && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-1 ${lineCls} z-0`}
                      />
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 text-base flex-shrink-0 transition ${circleCls} ${
                        step.active
                          ? "ring-4 ring-offset-2 ring-orange-300"
                          : ""
                      }`}
                    >
                      {step.done ? (
                        step.icon
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <p
                      className={`text-xs font-bold mt-2 text-center leading-tight ${labelCls}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-gray-400 text-center mt-0.5 px-1 hidden sm:block">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Status Messages */}
            {latestApp.status === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-700 font-medium flex items-start gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-bold mb-1">
                    Congratulations! Your franchise application has been
                    approved.
                  </p>
                  <p>
                    Your franchise is now active. Please wait for the "For
                    Release" notification to claim your permit at the Municipal
                    Hall.
                  </p>
                </div>
              </div>
            )}
            {latestApp.status === "rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 font-medium flex items-start gap-2">
                <span className="text-lg">❌</span>
                <div>
                  <p className="font-bold mb-1">
                    Your application was not approved.
                  </p>
                  <p>
                    Please check your notifications for the reason. You may
                    contact the Franchising Unit for clarification or submit a
                    new application.
                  </p>
                </div>
              </div>
            )}
            {latestApp.status === "for_release" && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-700 font-medium flex items-start gap-2">
                <span className="text-lg">🏛️</span>
                <div>
                  <p className="font-bold mb-1">
                    Your franchise permit is ready for release!
                  </p>
                  <p>
                    Visit the Municipal Hall during office hours (8AM - 5PM,
                    Mon-Fri) to claim your permit. Bring a valid ID.
                  </p>
                </div>
              </div>
            )}
            {latestApp.status === "released" && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 font-medium flex items-start gap-2">
                <span className="text-lg">✓</span>
                <div>
                  <p className="font-bold mb-1">
                    Your franchise permit has been successfully released.
                  </p>
                  <p>
                    Released on{" "}
                    {latestApp.release_date
                      ? new Date(latestApp.release_date).toLocaleDateString(
                          "en-PH",
                        )
                      : "N/A"}
                    . Keep your permit safe and ensure compliance with all
                    regulations.
                  </p>
                </div>
              </div>
            )}
            {latestApp.status === "under_review" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 font-medium flex items-start gap-2">
                <span className="text-lg">🔍</span>
                <div>
                  <p className="font-bold mb-1">
                    Your application is currently under review.
                  </p>
                  <p>
                    Our team is verifying your documents. You may be contacted
                    for an appointment or additional requirements.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/applicant/apply")}
            className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl p-6 text-left transition shadow-md hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold mb-1">➕ New Application</p>
                <p className="text-xs text-orange-100">
                  Submit a franchise registration or renewal
                </p>
              </div>
              <div className="text-4xl opacity-50 group-hover:opacity-100 transition">
                📝
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/applicant/appointments")}
            className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl p-6 text-left transition shadow-md hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold mb-1">📅 My Appointments</p>
                <p className="text-xs text-blue-100">
                  View and manage your scheduled appointments
                </p>
              </div>
              <div className="text-4xl opacity-50 group-hover:opacity-100 transition">
                📆
              </div>
            </div>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* ── UPCOMING APPOINTMENT ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Upcoming Appointment
              </h2>
              <button
                onClick={() => navigate("/applicant/appointments")}
                className="text-xs text-orange-500 hover:underline font-semibold"
              >
                View All →
              </button>
            </div>

            {!upcomingApt ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No upcoming appointments</p>
                <p className="text-xs mt-1">
                  You'll be notified when an appointment is scheduled
                </p>
              </div>
            ) : (
              <div
                onClick={() => setSelectedApt(upcomingApt)}
                className="cursor-pointer hover:bg-orange-50 rounded-xl p-4 border border-orange-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">
                      {new Date(upcomingApt.scheduled_date).toLocaleDateString(
                        "en-PH",
                        { month: "long", day: "numeric", year: "numeric" },
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {upcomingApt.scheduled_time} ·{" "}
                      <span className="capitalize">{upcomingApt.status}</span>
                    </p>
                  </div>
                  <span className="text-xs text-orange-500 font-semibold group-hover:underline whitespace-nowrap">
                    View Details →
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── RECENT NOTIFICATIONS ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                <Bell size={16} className="text-orange-600" />
                Recent Notifications
              </h2>
              <button
                onClick={() => navigate("/applicant/notifications")}
                className="text-xs text-orange-500 hover:underline font-semibold"
              >
                View All →
              </button>
            </div>

            {recentNotifs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">
                  You'll receive updates about your applications here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`cursor-pointer rounded-xl px-3 py-3 border transition hover:scale-[1.01] ${
                      n.is_read
                        ? "bg-white border-gray-100 hover:border-orange-200"
                        : "bg-orange-50 border-orange-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {n.message}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(n.created_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── ALL APPLICATIONS TABLE ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <FileText size={18} className="text-gray-600" />
              All Applications
            </h2>
            <button
              onClick={() => navigate("/applicant/applications")}
              className="text-xs text-orange-500 hover:underline font-semibold"
            >
              View All →
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium mb-1">No applications yet</p>
              <p className="text-sm mb-4">
                Start by submitting your first franchise application
              </p>
              <button
                onClick={() => navigate("/applicant/apply")}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold text-sm transition"
              >
                Apply Now
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Submitted
                    </th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 5).map((app) => (
                    <tr
                      key={app.id}
                      className="border-b last:border-0 hover:bg-orange-50 transition"
                    >
                      <td className="py-3 capitalize font-semibold text-gray-800">
                        {app.type}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${statusColor(app.status)}`}
                        >
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-xs">
                        {new Date(app.created_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate("/applicant/applications")}
                          className="text-xs text-orange-500 hover:text-orange-600 font-semibold hover:underline"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {applications.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate("/applicant/applications")}
                    className="text-sm text-orange-500 hover:text-orange-600 font-semibold hover:underline"
                  >
                    View all {applications.length} applications →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ApplicantLayout>
  );
}
