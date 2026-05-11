import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import StaffLayout from "../../components/StaffLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Activity,
  Clock,
  Shield,
  UserCheck,
  Search,
  ArrowUpRight,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
  Eye,
} from "lucide-react";

// ─── Helpers
const toDateObj = (str) => new Date(str + "T00:00:00");
const diffDays = (a, b) =>
  Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000);
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = (str) =>
  str
    ? toDateObj(str).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
const normalizeStatus = (s) => (s || "").toLowerCase().trim();
const cn = (...classes) => classes.filter(Boolean).join(" ");

const TOTAL_SLOTS = 5200;

// ─── Status color helpers
const appStatusColor = (s) => {
  const map = {
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    under_review: "bg-blue-100 text-blue-700",
    for_release: "bg-purple-100 text-purple-700",
    released: "bg-gray-100 text-gray-600",
    pending: "bg-amber-100 text-amber-700",
  };
  return map[normalizeStatus(s)] || "bg-amber-100 text-amber-700";
};

const aptStatusColor = (s) => {
  const map = {
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700",
    confirmed: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
  };
  return map[normalizeStatus(s)] || "bg-blue-100 text-blue-700";
};

// ─── Main Component
export default function StaffDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [franchises, setFranchises] = useState([]);
  const [applications, setApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Single effect: fetch everything once on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      const [{ data: prof }, { data: fr }, { data: apps }, { data: apts }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase
            .from("franchises")
            .select("*")
            .order("franchise_number", { ascending: true }),
          supabase
            .from("applications")
            .select("*, profiles(full_name, email)")
            .order("submitted_at", { ascending: true }),
          supabase
            .from("appointments")
            .select("*, profiles(full_name)")
            .order("scheduled_date", { ascending: true }),
        ]);

      if (cancelled) return; // component unmounted while awaiting

      setProfile(prof ?? null);
      setFranchises(fr ?? []);
      setApplications(apps ?? []);
      setAppointments(apts ?? []);
      setLoading(false);
    }

    load();

    // cleanup: ignore stale responses if component unmounts
    return () => {
      cancelled = true;
    };
  }, []); // ← empty array: runs once on mount, no dependencies needed

  // ── Derived stats (pure calculations — no setState) ─────────────────────
  const active = franchises.filter((f) => f.status === "active").length;
  const expired = franchises.filter((f) => f.status === "expired").length;
  const available = franchises.filter((f) => f.status === "available").length;
  const total = franchises.length;
  const freeSlots = TOTAL_SLOTS - active;

  const getDaysLeft = (f) =>
    f.expiration_date ? diffDays(f.expiration_date, todayStr()) : null;

  const appStats = {
    total: applications.length,
    pending: applications.filter((a) => normalizeStatus(a.status) === "pending")
      .length,
    under_review: applications.filter(
      (a) => normalizeStatus(a.status) === "under_review",
    ).length,
    approved: applications.filter(
      (a) => normalizeStatus(a.status) === "approved",
    ).length,
    rejected: applications.filter(
      (a) => normalizeStatus(a.status) === "rejected",
    ).length,
    for_release: applications.filter(
      (a) => normalizeStatus(a.status) === "for_release",
    ).length,
  };

  const todayApts = appointments.filter(
    (a) => a.scheduled_date === todayStr(),
  ).length;

  const expiringSoonList = franchises.filter((f) => {
    const d = getDaysLeft(f);
    return f.status === "active" && d !== null && d > 0 && d <= 30;
  });

  const upcomingApts = appointments.filter((a) => {
    if (!a.scheduled_date) return false;
    const d = diffDays(a.scheduled_date, todayStr());
    return (
      d >= 0 &&
      d <= 7 &&
      normalizeStatus(a.status) !== "cancelled" &&
      normalizeStatus(a.status) !== "completed"
    );
  });

  // ── Chart data (pure transforms — no setState)
  const lineData = applications
    .filter((a) => a?.submitted_at)
    .reduce((acc, app) => {
      const dateObj = new Date(app.submitted_at);
      if (isNaN(dateObj.getTime())) return acc;
      const date = dateObj.toLocaleDateString("en-PH");
      const existing = acc.find((d) => d.date === date);
      if (existing) existing.count += 1;
      else acc.push({ date, count: 1 });
      return acc;
    }, [])
    .slice(-7);

  const barData = [
    { name: "Pending", value: appStats.pending },
    { name: "Under Review", value: appStats.under_review },
    { name: "Approved", value: appStats.approved },
    { name: "For Release", value: appStats.for_release },
    { name: "Rejected", value: appStats.rejected },
  ];

  // ── Stat cards
  const stats = [
    {
      label: "Active Holders",
      value: active,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Pending Review",
      value: appStats.pending,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Expiring Soon",
      value: expiringSoonList.length,
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Available Slots",
      value: available,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Franchises",
      value: total,
      icon: Shield,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
    {
      label: "Today's Appointments",
      value: todayApts,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Total Applications",
      value: appStats.total,
      icon: FileText,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Expired Franchises",
      value: expired,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  // ── Loading state
  if (loading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64 gap-3 text-orange-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <span className="font-semibold text-sm">Loading dashboard…</span>
        </div>
      </StaffLayout>
    );
  }

  // ── Render
  return (
    <StaffLayout>
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 -mx-8 px-8 py-6 mb-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
                Staff Dashboard
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Welcome back, <strong>{profile?.full_name || "Staff"}</strong>.
                Here's today's overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                <Eye size={14} className="text-blue-500" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  View-Only Access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT WITH MAX WIDTH ── */}
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* ── SLOT PROGRESS BAR ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1 relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 p-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Franchise Slot Utilization
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {((active / TOTAL_SLOTS) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-900 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(active / TOTAL_SLOTS) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>{active} Occupied</span>
                <span>{TOTAL_SLOTS} Total Capacity</span>
              </div>
            </div>
            <div className="md:w-px md:bg-slate-100" />
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-slate-900 leading-none mb-1">
                  {active}
                </p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Active
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-slate-400 leading-none mb-1">
                  {freeSlots}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Open
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400 leading-none mb-1">
                  {expired}
                </p>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                  Expired
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 group cursor-default hover:-translate-y-1 transition-transform duration-200"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110",
                  s.bg,
                  s.color,
                )}
              >
                <s.icon size={22} />
              </div>
              <p className="text-4xl font-black text-slate-900 leading-none mb-2">
                {s.value}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── EXPIRING SOON ALERT ── */}
        {expiringSoonList.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-200 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={24} className="text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                    ⚠️ Franchises Expiring Within 30 Days
                  </h3>
                  <span className="text-xs text-orange-600 font-bold bg-orange-100 px-3 py-1 rounded-full">
                    {expiringSoonList.length} total
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Please inform the Admin to send renewal reminders. Staff
                  cannot send bulk notifications.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {expiringSoonList.map((f) => {
                    const days = getDaysLeft(f);
                    return (
                      <div
                        key={f.id}
                        className="bg-white rounded-xl px-4 py-3 border border-orange-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {f.franchise_number} — {f.owner_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Expires: {fmtDate(f.expiration_date)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-black whitespace-nowrap",
                            days <= 7
                              ? "bg-red-100 text-red-700"
                              : days <= 15
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700",
                          )}
                        >
                          {days} day{days !== 1 ? "s" : ""} left
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CHARTS & QUEUE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application Velocity Line Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Application Velocity
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Daily submissions over the last 7 days.
                </p>
              </div>
              <Activity size={18} className="text-slate-300" />
            </div>
            <div className="h-[300px] w-full">
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                        padding: "12px",
                      }}
                      labelStyle={{
                        fontWeight: "bold",
                        marginBottom: "4px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0F172A"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#0F172A" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-center text-sm text-slate-400">
                    No application data yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Queue Priority */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Queue Priority
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-widest">
                  View only
                </p>
              </div>
              <ArrowUpRight size={14} className="text-slate-400" />
            </div>
            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {applications.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <Search size={32} className="text-slate-200 mb-4" />
                  <p className="text-xs text-slate-400 font-medium tracking-tight">
                    Empty application queue
                  </p>
                </div>
              ) : (
                applications.slice(0, 5).map((app, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/staff/applications/${app.id}`)}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {app.profiles?.full_name || `#${app.id.slice(-6)}`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
                        {app.type}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                        appStatusColor(app.status),
                      )}
                    >
                      {app.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-slate-50/50">
              <button
                onClick={() => navigate("/staff/applications")}
                className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              >
                View Full Queue
              </button>
            </div>
          </div>
        </div>

        {/* ── APPLICATION STATUS BAR CHART ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Applications by Status
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Breakdown of current application states.
              </p>
            </div>
            <TrendingUp size={18} className="text-slate-300" />
          </div>
          {appStats.total > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    padding: "12px",
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#0F172A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-slate-400 py-10">
              No applications to display.
            </p>
          )}
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Applications
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View only — status changes require Admin
                </p>
              </div>
              <button
                onClick={() => navigate("/staff/applications")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition"
              >
                View All →
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {applications.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">
                  No applications yet.
                </p>
              ) : (
                [...applications]
                  .sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at),
                  )
                  .slice(0, 8)
                  .map((a) => (
                    <div
                      key={a.id}
                      onClick={() => navigate(`/staff/applications/${a.id}`)}
                      className="p-4 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {a.profiles?.full_name || "—"}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {a.type} ·{" "}
                          {new Date(a.created_at).toLocaleDateString("en-PH")}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ml-3 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap",
                          appStatusColor(a.status),
                        )}
                      >
                        {a.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Upcoming Appointments
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Next 7 days · {upcomingApts.length} scheduled
                </p>
              </div>
              <button
                onClick={() => navigate("/staff/appointments")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition"
              >
                View All →
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {upcomingApts.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">
                  No upcoming appointments in the next 7 days.
                </p>
              ) : (
                upcomingApts.map((a) => {
                  const isToday = a.scheduled_date === todayStr();
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "p-4 flex justify-between items-center transition",
                        isToday ? "bg-blue-50/50" : "hover:bg-slate-50",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {a.profiles?.full_name || "—"}
                          </p>
                          {isToday && (
                            <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {fmtDate(a.scheduled_date)}
                          {a.scheduled_time ? ` · ${a.scheduled_time}` : ""}
                        </p>
                        {a.notes && (
                          <p className="text-xs text-slate-400 italic mt-0.5 truncate">
                            {a.notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "ml-3 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap",
                          aptStatusColor(a.status),
                        )}
                      >
                        {a.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── FRANCHISE HEALTH OVERVIEW ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Franchise Health Overview
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                At-a-glance status of all franchise records
              </p>
            </div>
            <button
              onClick={() => navigate("/staff/franchises")}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition"
            >
              View All →
            </button>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            {[
              {
                label: "Active",
                value: active,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                icon: CheckCircle,
              },
              {
                label: "Expiring ≤30d",
                value: expiringSoonList.length,
                color: "text-orange-600",
                bg: "bg-orange-50",
                icon: Clock,
              },
              {
                label: "Expired",
                value: expired,
                color: "text-red-600",
                bg: "bg-red-50",
                icon: AlertCircle,
              },
            ].map((item, i) => (
              <div key={i} className="p-6 flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    item.bg,
                    item.color,
                  )}
                >
                  <item.icon size={18} />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-2xl font-black leading-none mb-1",
                      item.color,
                    )}
                  >
                    {item.value}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Expiring soon list preview */}
          {expiringSoonList.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {expiringSoonList.slice(0, 6).map((f) => {
                const days = getDaysLeft(f);
                return (
                  <div
                    key={f.id}
                    className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {f.franchise_number} — {f.owner_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Expires: {fmtDate(f.expiration_date)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "ml-3 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap",
                        days <= 7
                          ? "bg-red-100 text-red-700"
                          : days <= 15
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {days}d left
                    </span>
                  </div>
                );
              })}
              {expiringSoonList.length > 6 && (
                <div className="px-6 py-3 text-xs text-slate-400 italic">
                  +{expiringSoonList.length - 6} more expiring soon…
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle
                size={32}
                className="text-emerald-300 mx-auto mb-2"
              />
              <p className="text-sm text-slate-400 font-medium">
                All franchises are in good standing 🎉
              </p>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
