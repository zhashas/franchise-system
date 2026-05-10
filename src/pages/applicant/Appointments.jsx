// src/pages/applicant/ApplicantAppointments.jsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import ApplicantLayout from "../../components/ApplicantLayout";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ── Date helpers (no timezone shift) ─────────────────────────────────────────
const parseLocalDate = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (str) => {
  const d = parseLocalDate(str);
  return {
    month: d.toLocaleString("en-US", { month: "short" }),
    day: String(d.getDate()).padStart(2, "0"),
  };
};

const formatFullDate = (str) =>
  parseLocalDate(str).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatDateShort = (str) =>
  parseLocalDate(str).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });

// ── Status config ─────────────────────────────────────────────────────────────
const getStatusConfig = (status) => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        icon: CheckCircle2,
        color: "text-blue-700",
        bg: "bg-blue-100",
        headerGradient: "from-blue-600 to-indigo-800",
        indicatorColor: "bg-blue-500",
      };
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2,
        color: "text-emerald-700",
        bg: "bg-emerald-100",
        headerGradient: "from-emerald-600 to-emerald-800",
        indicatorColor: "bg-emerald-500",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        icon: XCircle,
        color: "text-rose-700",
        bg: "bg-rose-100",
        headerGradient: "from-rose-600 to-rose-800",
        indicatorColor: "bg-rose-500",
      };
    default:
      return {
        label: "Pending",
        icon: AlertCircle,
        color: "text-amber-700",
        bg: "bg-yellow-100",
        headerGradient: "from-amber-600 to-amber-800",
        indicatorColor: "bg-amber-500",
      };
  }
};

export default function ApplicantAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ── Fetch applicant's own appointments ────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          applications!appointments_application_id_fkey (type, status)
        `,
        )
        .eq("applicant_id", user.id)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error("[ApplicantAppointments] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Realtime: watch own appointments for updates ──────────────────────────
  useEffect(() => {
    let channel = null;
    let isMounted = true;

    const setup = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        const channelName = `applicant-appointments-${user.id}-${Date.now()}`;

        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "appointments",
              filter: `applicant_id=eq.${user.id}`,
            },
            (payload) => {
              if (!isMounted) return;
              if (payload.eventType === "INSERT") {
                fetchAppointments();
              } else if (payload.eventType === "UPDATE") {
                setAppointments((prev) =>
                  prev.map((a) =>
                    a.id === payload.new.id ? { ...a, ...payload.new } : a,
                  ),
                );
                // Keep detail panel in sync
                setSelectedAppointment((prev) =>
                  prev?.id === payload.new.id
                    ? { ...prev, ...payload.new }
                    : prev,
                );
              } else if (payload.eventType === "DELETE") {
                setAppointments((prev) =>
                  prev.filter((a) => a.id !== payload.old.id),
                );
                setSelectedAppointment((prev) =>
                  prev?.id === payload.old.id ? null : prev,
                );
              }
            },
          )
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR")
              console.error("[ApplicantAppointments] Realtime error");
          });
      } catch (err) {
        console.error("[ApplicantAppointments] Realtime setup error:", err);
      }
    };

    setup();
    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel).catch(console.error);
    };
  }, [fetchAppointments]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Active Sessions",
      val: appointments.filter((a) => a.status === "confirmed").length,
      detail: "● Coming up",
      color: "text-blue-600",
    },
    {
      label: "Completed",
      val: appointments.filter((a) => a.status === "completed").length,
      detail: "✓ completed sessions",
      color: "text-emerald-600",
    },
    {
      label: "Cancelled",
      val: appointments.filter((a) => a.status === "cancelled").length,
      detail:
        appointments.filter((a) => a.status === "cancelled").length > 0
          ? "⚠️ Cancelled sessions"
          : "— No records",
      color:
        appointments.filter((a) => a.status === "cancelled").length > 0
          ? "text-red-600"
          : "text-slate-400 opacity-60",
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ApplicantLayout>
      <div className="space-y-8 animate-in max-w-8xl mx-auto">
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
              Appointments
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Manage your scheduled sessions with the TFU offices.
            </p>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-12 gap-8">
          {/* ── LEFT ── */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl border border-green-500 shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">
                    {stat.val}
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

            {/* Appointments list */}
            <div className="bg-white rounded-2xl border border-green-500 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Schedule Pipeline
                </h2>
                <div className="flex gap-2">
                  <span className="p-1 px-3 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400">
                    {appointments.length} total
                  </span>
                </div>
              </div>

              {/* Content */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-medium">
                      Loading appointments…
                    </p>
                  </div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center py-12">
                    <Calendar
                      size={40}
                      className="text-slate-200 mx-auto mb-4"
                    />
                    <p className="font-semibold text-slate-600 text-sm">
                      No appointments scheduled yet
                    </p>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
                      The admin will schedule an appointment once your
                      application is under review.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 divide-y divide-slate-100">
                  {appointments.map((apt) => {
                    const cfg = getStatusConfig(apt.status);
                    const isActive = selectedAppointment?.id === apt.id;
                    const { month, day } = formatDate(apt.scheduled_date);

                    return (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className={cn(
                          "group flex items-center gap-4 px-6 py-5 cursor-pointer transition-all",
                          isActive
                            ? "bg-blue-50/50 border-l-4 border-blue-600"
                            : "hover:bg-slate-50",
                        )}
                      >
                        {/* Date badge */}
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
                              Franchise{" "}
                              {apt.applications?.type
                                ? apt.applications.type
                                    .charAt(0)
                                    .toUpperCase() +
                                  apt.applications.type.slice(1)
                                : "Application"}{" "}
                              Appointment
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
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {apt.scheduled_time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDateShort(apt.scheduled_date)}
                            </span>
                            {apt.notes && (
                              <span className="text-slate-400 truncate max-w-[140px]">
                                📝 {apt.notes}
                              </span>
                            )}
                          </p>
                        </div>

                        <ChevronRight
                          size={18}
                          className={cn(
                            "transition-colors flex-shrink-0",
                            isActive
                              ? "text-blue-600"
                              : "text-slate-200 group-hover:text-slate-400",
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="p-4 bg-slate-50 text-[10px] text-center font-bold text-slate-400 italic border-t border-slate-100">
                ⏰ Ensure you arrive 15 minutes before your scheduled inspection
                time.
              </div>
            </div>
          </div>

          {/* ── RIGHT: Detail Card ── */}
          <div className="col-span-12 lg:col-span-4 flex flex-col lg:sticky lg:top-8">
            {!selectedAppointment ? (
              <div className="flex-1 bg-slate-100 rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 shadow-sm min-h-[300px]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                  <Calendar size={32} />
                </div>
                <h4 className="text-sm font-bold text-slate-600">
                  No Appointment Selected
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Select a session from the list to view its details and
                  instructions.
                </p>
              </div>
            ) : (
              <div className="flex-1 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white ring-1 ring-white/10">
                {/* Gradient header */}
                <div
                  className={cn(
                    "relative h-32 p-6 flex items-end bg-gradient-to-br",
                    getStatusConfig(selectedAppointment.status).headerGradient,
                  )}
                >
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <X size={16} />
                  </button>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/80">
                      Session Insight
                    </p>
                    <h2 className="text-xl font-bold leading-tight mt-1">
                      Franchise{" "}
                      {selectedAppointment.applications?.type
                        ? selectedAppointment.applications.type
                            .charAt(0)
                            .toUpperCase() +
                          selectedAppointment.applications.type.slice(1)
                        : "Application"}{" "}
                      Appointment
                    </h2>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Instructions / Notes */}
                  <section>
                    <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-2">
                      Instructions
                    </h4>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <p className="text-sm leading-relaxed text-slate-300 italic">
                        "
                        {selectedAppointment.notes ||
                          "No specific instructions provided. Please proceed to the Municipal Hall, San Jose, Occidental Mindoro."}
                        "
                      </p>
                    </div>
                  </section>

                  {/* Status tracking */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                      Status Tracking
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <div className="flex-1 flex justify-between">
                          <span className="text-xs font-medium">
                            Schedule Proposed
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {selectedAppointment.created_at
                              ? new Date(
                                  selectedAppointment.created_at,
                                ).toLocaleDateString("en-PH", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            getStatusConfig(selectedAppointment.status)
                              .indicatorColor,
                          )}
                        />
                        <div className="flex-1 flex justify-between">
                          <span className="text-xs font-bold capitalize">
                            {selectedAppointment.status}
                          </span>
                          <span className="text-[10px] text-blue-400">
                            Current
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                      <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">
                        Time
                      </p>
                      <p className="text-sm font-bold">
                        {selectedAppointment.scheduled_time}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                      <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">
                        Type
                      </p>
                      <p className="text-sm font-bold capitalize">
                        {selectedAppointment.applications?.type || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Scheduled date */}
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <p className="text-[8px] text-slate-400 font-bold uppercase mb-1">
                      Scheduled Date
                    </p>
                    <p className="text-sm font-bold">
                      {formatFullDate(selectedAppointment.scheduled_date)}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <p className="text-[8px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1">
                      <MapPin size={8} /> Location
                    </p>
                    <p className="text-sm font-bold">
                      Municipal Hall, San Jose, Occidental Mindoro
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/40 flex items-center justify-between border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-600 flex items-center justify-center text-[10px] font-bold">
                      👤
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                    Officer on duty
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ApplicantLayout>
  );
}
