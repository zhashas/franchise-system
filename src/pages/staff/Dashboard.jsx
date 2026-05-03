import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import StaffLayout from "../../components/StaffLayout";
import {
  Shield,
  Clock,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const toDateObj = (str) => new Date(str + "T00:00:00");
const diffDays = (a, b) =>
  Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000);
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = (str) =>
  toDateObj(str).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function StaffDashboard() {
  const [profile, setProfile] = useState(null);
  const [franchises, setFranchises] = useState([]);
  const [applications, setApplications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: fr }, { data: apps }, { data: apts }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase
            .from("franchises")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("applications")
            .select("*, profiles(full_name, email)")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("appointments")
            .select("*, profiles(full_name)")
            .order("scheduled_date", { ascending: true })
            .limit(5),
        ]);

      setProfile(prof);
      setFranchises(fr || []);
      setApplications(apps || []);
      setAppointments(apts || []);
    };

    fetchAll();
  }, []);

  const getDaysUntilExpiry = (d) => (d ? diffDays(d, todayStr()) : null);

  const stats = [
    {
      label: "Total Franchises",
      value: franchises.length,
      icon: Shield,
      color: "text-slate-900",
      bg: "bg-slate-100",
    },
    {
      label: "Active",
      value: franchises.filter((f) => f.status === "active").length,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Expired",
      value: franchises.filter((f) => f.status === "expired").length,
      icon: Clock,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Available Slots",
      value: franchises.filter((f) => f.status === "available").length,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Applications",
      value: applications.filter((a) => a.status === "pending").length,
      icon: FileText,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Today's Appointments",
      value: appointments.filter((a) => a.scheduled_date === todayStr()).length,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const expiringSoon = franchises.filter((f) => {
    if (f.status !== "active") return false;
    const d = getDaysUntilExpiry(f.expiration_date);
    return d !== null && d <= 30 && d > 0;
  });

  const statusColor = (s) => {
    if (s === "approved") return "bg-emerald-100 text-emerald-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    if (s === "under_review") return "bg-blue-100 text-blue-700";
    if (s === "for_release") return "bg-purple-100 text-purple-700";
    return "bg-amber-100 text-amber-700";
  };

  const aptColor = (s) => {
    if (s === "completed") return "bg-emerald-100 text-emerald-700";
    if (s === "cancelled") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <StaffLayout>
      <div className="space-y-8">
        {/* HEADER (Admin Style) */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Staff Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <strong>{profile?.full_name || "Staff"}</strong>.
            Here's today's overview.
          </p>
        </div>

        {/* STATS GRID (Admin Card Style) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
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

        {/* EXPIRING SOON ALERT (Admin Alert Style) */}
        {expiringSoon.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-200 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={24} className="text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-sm text-slate-900 mb-2 uppercase tracking-wide">
                  ⚠️ Franchises Expiring Within 30 Days
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {expiringSoon.map((f) => {
                    const days = getDaysUntilExpiry(f.expiration_date);
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

        {/* QUICK ACTIONS */}

        {/* CONTENT GRID */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* RECENT APPLICATIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
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

            <div className="divide-y divide-slate-100">
              {applications.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">
                  No applications yet.
                </p>
              ) : (
                applications.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/staff/applications/${a.id}`)}
                    className="p-4 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {a.profiles?.full_name || "—"}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {a.type} ·{" "}
                        {new Date(a.created_at).toLocaleDateString("en-PH")}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                        statusColor(a.status),
                      )}
                    >
                      {a.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* UPCOMING APPOINTMENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Appointments
              </h3>
              <button
                onClick={() => navigate("/staff/appointments")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">
                  No appointments yet.
                </p>
              ) : (
                appointments.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {a.profiles?.full_name || "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {a.scheduled_date} · {a.scheduled_time}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                        aptColor(a.status),
                      )}
                    >
                      {a.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
