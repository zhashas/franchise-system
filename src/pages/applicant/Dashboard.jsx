// src/pages/applicant/ApplicantDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import ApplicantLayout from "../../components/ApplicantLayout";
import {
  X,
  Calendar,
  FileText,
  Bell,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
} from "lucide-react";

// ── Utility Functions ────────────────────────────────────────────────────
const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = String(date.getDate()).padStart(2, "0");
  return { month, day };
};

const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
};

// ─── Appointment Detail Modal ─────────────────────────────────────────────
function AppointmentDetailModal({ apt, onClose }) {
  if (!apt) return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case "confirmed":
        return {
          label: "Confirmed",
          color: "text-blue-700",
          bg: "bg-blue-100",
          headerGradient: "from-blue-600 to-indigo-800",
        };
      case "completed":
        return {
          label: "Completed",
          color: "text-emerald-700",
          bg: "bg-emerald-100",
          headerGradient: "from-emerald-600 to-emerald-800",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "text-rose-700",
          bg: "bg-rose-100",
          headerGradient: "from-rose-600 to-rose-800",
        };
      default:
        return {
          label: "Pending",
          color: "text-amber-700",
          bg: "bg-yellow-100",
          headerGradient: "from-amber-600 to-amber-800",
        };
    }
  };

  const cfg = getStatusConfig(apt.status);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white ring-1 ring-white/10 max-w-md w-full max-h-[90vh] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "relative h-32 p-6 flex items-end transition-colors bg-gradient-to-br",
            cfg.headerGradient,
          )}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <X size={16} />
          </button>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-white/80">
              Appointment Details
            </p>
            <h2 className="text-xl font-bold leading-tight mt-1">
              {apt.purpose_description ||
                `Franchise ${apt.applications?.type || "Application"}`}
            </h2>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {apt.message && (
            <section>
              <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-2">
                Instructions
              </h4>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <p className="text-sm leading-relaxed text-slate-300 italic">
                  "{apt.message}"
                </p>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
              Status Tracking
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div className="flex-1 flex justify-between">
                  <span className="text-xs font-medium">Schedule Proposed</span>
                  <span className="text-[10px] text-slate-500">
                    {apt.created_at ? formatDateShort(apt.created_at) : "—"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    apt.status === "completed"
                      ? "bg-emerald-500"
                      : "bg-blue-500",
                  )}
                ></div>
                <div className="flex-1 flex justify-between">
                  <span className="text-xs font-bold capitalize">
                    {apt.status}
                  </span>
                  <span className="text-[10px] text-blue-400">Current</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">
                Time
              </p>
              <p className="text-sm font-bold">{apt.scheduled_time}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">
                Location
              </p>
              <p className="text-sm font-bold">
                {apt.office_location || "TBD"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/40 flex items-center justify-center border-t border-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          ⏰ Arrive 15 minutes early
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
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 ${config.border} animate-in zoom-in-95`}
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
              {notif.sender_type === "system" ? "🤖 System" : "👤 Admin"}
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
              <p>• Visit the Municipal Hall</p>
              <p>• Bring valid ID and documents</p>
              <p>• Claim your Franchise Permit</p>
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

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
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

      const [profileRes, appsRes, aptsRes, notifsRes, franchisesRes] =
        await Promise.allSettled([
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

      if (profileRes.status === "fulfilled") {
        const { data, error: err } = profileRes.value;
        if (err) console.warn("[Dashboard] profiles error:", err.message);
        else setProfile(data);
      }

      if (appsRes.status === "fulfilled") {
        const { data, error: err } = appsRes.value;
        if (err) console.warn("[Dashboard] applications error:", err.message);
        else setApplications(data ?? []);
      }

      if (aptsRes.status === "fulfilled") {
        const { data, error: err } = aptsRes.value;
        if (err) console.warn("[Dashboard] appointments error:", err.message);
        else setAppointments(data ?? []);
      }

      if (notifsRes.status === "fulfilled") {
        const { data, error: err } = notifsRes.value;
        if (err) console.warn("[Dashboard] notifications error:", err.message);
        else setRecentNotifs(data ?? []);
      }

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

  const handleNotifClick = async (n) => {
    setSelectedNotif(n);

    if (n.is_read) return;

    setRecentNotifs((prev) =>
      prev.map((item) =>
        item.id === n.id ? { ...item, is_read: true } : item,
      ),
    );

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", n.id);

    if (updateError) {
      console.error("[Dashboard] markRead failed:", updateError.message);
      setRecentNotifs((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: false } : item,
        ),
      );
      return;
    }

    const current = parseInt(localStorage.getItem("notif_unread") ?? "0", 10);
    const updated = Math.max(0, current - 1);
    localStorage.setItem("notif_unread", String(updated));
    window.dispatchEvent(
      new CustomEvent("notif_unread_update", { detail: updated }),
    );
  };

  if (loading) {
    return (
      <ApplicantLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">
            Loading your dashboard…
          </p>
        </div>
      </ApplicantLayout>
    );
  }

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

  const upcomingApt = appointments.find(
    (a) => a.status === "confirmed" && new Date(a.scheduled_date) >= new Date(),
  );

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

  const getStatusConfig = (status) => {
    switch (status) {
      case "confirmed":
        return {
          label: "Confirmed",
          color: "text-blue-700",
          bg: "bg-blue-100",
        };
      case "completed":
        return {
          label: "Completed",
          color: "text-emerald-700",
          bg: "bg-emerald-100",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "text-rose-700",
          bg: "bg-rose-100",
        };
      default:
        return {
          label: "Pending",
          color: "text-amber-700",
          bg: "bg-yellow-100",
        };
    }
  };

  return (
    <ApplicantLayout>
      {selectedApt && (
        <AppointmentDetailModal
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

      <div className="space-y-8 animate-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Welcome back, {profile?.full_name ?? "Applicant"}! 👋
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {/* STATS CARDS */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Total Applications",
                  val: applications.length,
                  detail:
                    applications.length > 0
                      ? `${applications.filter((a) => a.status === "under_review").length} in review`
                      : "No records",
                  color:
                    applications.length > 0
                      ? "text-blue-600"
                      : "text-slate-400 opacity-60",
                  icon: "📋",
                },
                {
                  label: "Upcoming Sessions",
                  val: appointments.filter((a) => a.status === "confirmed")
                    .length,
                  detail: upcomingApt ? "● Next up" : "— None scheduled",
                  color: upcomingApt
                    ? "text-blue-600"
                    : "text-slate-400 opacity-60",
                  icon: "📅",
                },
                {
                  label: "Active Franchises",
                  val: activeFranchises.length,
                  detail:
                    activeFranchises.length > 0
                      ? "✓ In operation"
                      : "— None active",
                  color:
                    activeFranchises.length > 0
                      ? "text-emerald-600"
                      : "text-slate-400 opacity-60",
                  icon: "✅",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{stat.icon}</span>
                    <p className="text-2xl font-bold text-slate-800">
                      {stat.val}
                    </p>
                  </div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                    {stat.label}
                  </p>
                  <div
                    className={cn(
                      "mt-2 text-[10px] font-bold uppercase tracking-widest",
                      stat.color,
                    )}
                  >
                    {stat.detail}
                  </div>
                </div>
              ))}
            </div>

            {/* EXPIRING FRANCHISES ALERT */}
            {expiringFranchises.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={24} className="text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-rose-800 mb-1">
                      ⚠️ Franchise Expiring Soon
                    </h3>
                    <p className="text-xs text-rose-700 mb-4">
                      {expiringFranchises.length} franchise
                      {expiringFranchises.length > 1 ? "s" : ""} expiring within
                      90 days. Renew now to avoid interruption.
                    </p>
                    <button
                      onClick={() => navigate("/applicant/apply")}
                      className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      Renew Now →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* UPCOMING APPOINTMENTS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Calendar size={14} />
                  Upcoming Sessions
                </h2>
                <button
                  onClick={() => navigate("/applicant/appointments")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold transition"
                >
                  View All →
                </button>
              </div>

              {appointments.length === 0 ? (
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  <div className="text-center py-12">
                    <Calendar
                      size={40}
                      className="text-slate-200 mx-auto mb-4"
                    />
                    <p className="font-semibold text-slate-600 text-sm">
                      No appointments scheduled
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      The admin will schedule an appointment once your
                      application is under review.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {appointments.slice(0, 3).map((apt) => {
                    const cfg = getStatusConfig(apt.status);
                    const { month, day } = formatDate(apt.scheduled_date);

                    return (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedApt(apt)}
                        className={cn(
                          "group flex items-center gap-4 px-6 py-5 cursor-pointer transition-all hover:bg-slate-50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 transition-colors",
                            apt.status === "completed"
                              ? "bg-emerald-50 text-emerald-600"
                              : apt.status === "confirmed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-400",
                          )}
                        >
                          <span className="text-[10px] font-bold uppercase">
                            {month}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {day}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-sm font-bold text-slate-800 truncate">
                              {apt.purpose_description ||
                                `Franchise ${apt.applications?.type || "Application"}`}
                            </h3>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                                cfg.bg,
                                cfg.color,
                              )}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <Clock size={12} />
                            {apt.scheduled_time}
                            {apt.office_location && (
                              <>
                                {" "}
                                •
                                <MapPin size={12} />
                                {apt.office_location}
                              </>
                            )}
                          </p>
                        </div>

                        <ChevronRight
                          size={18}
                          className="text-slate-200 group-hover:text-slate-400 transition-colors"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {appointments.length > 3 && (
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => navigate("/applicant/appointments")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                  >
                    View all {appointments.length} appointments →
                  </button>
                </div>
              )}
            </div>

            {/* RECENT APPLICATIONS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <FileText size={14} />
                  Recent Applications
                </h2>
                <button
                  onClick={() => navigate("/applicant/applications")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold transition"
                >
                  View All →
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FileText
                      size={40}
                      className="text-slate-200 mx-auto mb-4"
                    />
                    <p className="font-semibold text-slate-600 text-sm">
                      No applications yet
                    </p>
                    <p className="text-xs text-slate-400 mt-2 mb-4">
                      Start by submitting your first franchise application
                    </p>
                    <button
                      onClick={() => navigate("/applicant/apply")}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b bg-slate-50">
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Type
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.slice(0, 5).map((app) => (
                        <tr
                          key={app.id}
                          className="border-b last:border-0 hover:bg-slate-50 transition"
                        >
                          <td className="px-6 py-4 capitalize font-semibold text-slate-800">
                            {app.type}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold capitalize border",
                                statusColor(app.status),
                              )}
                            >
                              {app.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {new Date(app.created_at).toLocaleDateString(
                              "en-PH",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() =>
                                navigate("/applicant/applications")
                              }
                              className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                            >
                              View Details →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* RECENT NOTIFICATIONS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Bell size={14} />
                  Notifications
                </h2>
                <button
                  onClick={() => navigate("/applicant/notifications")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold transition"
                >
                  All →
                </button>
              </div>

              {recentNotifs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  <div className="text-center py-12">
                    <Bell size={40} className="text-slate-200 mx-auto mb-4" />
                    <p className="font-semibold text-slate-600 text-sm">
                      No notifications
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      You'll receive updates about your applications here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={cn(
                        "group flex items-start gap-3 px-6 py-4 cursor-pointer transition-all hover:bg-slate-50",
                        !notif.is_read ? "bg-blue-50/30" : "",
                      )}
                    >
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-slate-800 truncate">
                          {notif.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatDateShort(notif.created_at)}
                        </p>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-200 group-hover:text-slate-400 transition-colors flex-shrink-0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK ACTIONS */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/applicant/apply")}
                className="w-full px-4 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <span>➕</span> New Application
              </button>
              <button
                onClick={() => navigate("/applicant/apply")}
                className="w-full px-4 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <FileText size={14} /> Track Applications
              </button>
            </div>
          </div>
        </div>
      </div>
    </ApplicantLayout>
  );
}
