import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";
import {
  Calendar,
  X,
  ChevronRight,
  Check,
  Edit2,
  Clock,
  MapPin,
  User,
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// ── Date helpers (no timezone shift) ─────────────────────────────────────────
const parseLocalDate = (str) => {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatFullDate = (str) =>
  parseLocalDate(str).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatMonthDay = (str) => {
  const d = parseLocalDate(str);
  return {
    month: d.toLocaleString("en-US", { month: "short" }),
    day: String(d.getDate()).padStart(2, "0"),
  };
};

// ── Status config (shared with applicant styling) ─────────────────────────────
const getStatusConfig = (status) => {
  switch (status) {
    case "confirmed":
      return {
        label: "Confirmed",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
        cardBg: "bg-blue-50",
        headerGradient: "from-blue-600 to-indigo-800",
      };
    case "completed":
      return {
        label: "Completed",
        badge: "bg-green-100 text-green-700 border-green-200",
        dot: "bg-green-500",
        cardBg: "bg-green-50",
        headerGradient: "from-emerald-600 to-emerald-800",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        badge: "bg-red-100 text-red-600 border-red-200",
        dot: "bg-red-500",
        cardBg: "bg-red-50",
        headerGradient: "from-rose-600 to-rose-800",
      };
    default:
      return {
        label: "Pending",
        badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
        dot: "bg-yellow-500",
        cardBg: "bg-yellow-50",
        headerGradient: "from-amber-600 to-amber-800",
      };
  }
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    applicant_id: "",
    application_id: "",
    scheduled_date: "",
    scheduled_time: "",
    notes: "",
    status: "confirmed",
  });
  const [selectedApplicantApps, setSelectedApplicantApps] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeConfirmed, setTimeConfirmed] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [adminId, setAdminId] = useState(null);

  // ── Get current admin user ────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAdminId(user.id);
    });
  }, []);

  // ── Fetch all appointments ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const { data: apts, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          profiles!appointments_applicant_id_fkey (full_name, email),
          applications!appointments_application_id_fkey (type, status)
        `,
        )
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setAppointments(apts || []);

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "applicant")
        .order("full_name", { ascending: true });

      setApplicants(profs || []);
    } catch (err) {
      console.error("[AdminAppointments] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    let channel = null;
    let isMounted = true;

    const channelName = `admin-appointments-${Date.now()}`;

    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === "INSERT") {
            fetchData();
          } else if (payload.eventType === "UPDATE") {
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? { ...a, ...payload.new } : a,
              ),
            );
            // Keep detail panel in sync
            setSelectedAppointment((prev) =>
              prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev,
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
          console.error("[AdminAppointments] Realtime error");
      });

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel).catch(console.error);
    };
  }, [fetchData]);

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleTimeChange = (e) => {
    setFormData((p) => ({ ...p, scheduled_time: e.target.value }));
    setTimeConfirmed(false);
  };

  const handleApplicantChange = async (e) => {
    const applicantId = e.target.value;
    setFormData((p) => ({
      ...p,
      applicant_id: applicantId,
      application_id: "",
    }));
    if (!applicantId) {
      setSelectedApplicantApps([]);
      return;
    }
    const { data } = await supabase
      .from("applications")
      .select("id, type, status, submitted_at")
      .eq("applicant_id", applicantId)
      .order("submitted_at", { ascending: false });
    setSelectedApplicantApps(data || []);
  };

  const handleEditClick = async (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      applicant_id: appointment.applicant_id,
      application_id: appointment.application_id || "",
      scheduled_date: appointment.scheduled_date,
      scheduled_time: appointment.scheduled_time,
      notes: appointment.notes || "",
      status: appointment.status,
    });
    setTimeConfirmed(true);
    const { data } = await supabase
      .from("applications")
      .select("id, type, status, submitted_at")
      .eq("applicant_id", appointment.applicant_id)
      .order("submitted_at", { ascending: false });
    setSelectedApplicantApps(data || []);
    setShowModal(true);
  };

  // ── Submit (create or update) ─────────────────────────────────────────────
  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!timeConfirmed && formData.scheduled_time) {
      alert('Please confirm the time by clicking "Okay".');
      return;
    }
    setSubmitting(true);

    try {
      const dateLabel = formatFullDate(formData.scheduled_date);
      const notifMessage = `Your appointment has been ${
        editingAppointment ? "updated" : "scheduled"
      } on ${dateLabel} at ${formData.scheduled_time}. ${
        formData.notes
          ? "Note: " + formData.notes
          : "Please proceed to the Municipal Hall, San Jose, Occidental Mindoro."
      }`;

      if (editingAppointment) {
        // ── UPDATE ──
        const { error } = await supabase
          .from("appointments")
          .update({
            applicant_id: formData.applicant_id,
            application_id: formData.application_id || null,
            scheduled_date: formData.scheduled_date,
            scheduled_time: formData.scheduled_time,
            notes: formData.notes,
            status: formData.status,
          })
          .eq("id", editingAppointment.id);
        if (error) throw error;
      } else {
        // ── INSERT ──
        const { error } = await supabase.from("appointments").insert({
          applicant_id: formData.applicant_id,
          application_id: formData.application_id || null,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          notes: formData.notes,
          status: "confirmed",
        });
        if (error) throw error;

        // Move application to under_review if still pending
        if (formData.application_id) {
          const selectedApp = selectedApplicantApps.find(
            (a) => a.id === formData.application_id,
          );
          if (selectedApp?.status === "pending") {
            await supabase
              .from("applications")
              .update({ status: "under_review" })
              .eq("id", formData.application_id);
          }
        }
      }

      // ── Notify applicant (sender_id required by FK) ──
      if (adminId) {
        await supabase.from("notifications").insert({
          recipient_id: formData.applicant_id,
          recipient_type: "applicant",
          sender_id: adminId,
          sender_type: "admin",
          notification_type: "appointment",
          title: editingAppointment
            ? "📅 Appointment Updated!"
            : "📅 Appointment Scheduled!",
          message: notifMessage,
          application_id: formData.application_id || null,
          is_read: false,
        });
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error("[AdminAppointments] submit error:", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Quick status update ───────────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      setSelectedAppointment((prev) =>
        prev?.id === id ? { ...prev, status } : prev,
      );
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedApplicantApps([]);
    setTimeConfirmed(false);
    setEditingAppointment(null);
    setFormData({
      applicant_id: "",
      application_id: "",
      scheduled_date: "",
      scheduled_time: "",
      notes: "",
      status: "confirmed",
    });
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split("T")[0];
  const todayDay = new Date().getDate().toString().padStart(2, "0");
  const todayApts = appointments.filter(
    (a) => a.scheduled_date === todayStr && a.status !== "cancelled",
  );
  const remaining = todayApts.filter((a) => a.status !== "completed").length;

  const filtered = appointments
    .filter((a) => statusFilter === "all" || a.status === statusFilter)
    .filter((a) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        a.profiles?.full_name?.toLowerCase().includes(q) ||
        a.profiles?.email?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q) ||
        a.scheduled_date?.includes(q)
      );
    });

  const statusTabs = [
    { key: "all", label: "ALL" },
    { key: "confirmed", label: "CONFIRMED" },
    { key: "completed", label: "COMPLETED" },
    { key: "cancelled", label: "CANCELLED" },
  ];

  const stats = [
    {
      label: "Today",
      value: todayApts.length,
      detail: `${remaining} remaining`,
      color: "text-blue-600",
      dot: "bg-blue-400",
    },
    {
      label: "Confirmed",
      value: appointments.filter((a) => a.status === "confirmed").length,
      detail: "Upcoming",
      color: "text-green-600",
      dot: "bg-green-400",
    },
    {
      label: "Completed",
      value: appointments.filter((a) => a.status === "completed").length,
      detail: "Done",
      color: "text-gray-600",
      dot: "bg-gray-400",
    },
    {
      label: "Cancelled",
      value: appointments.filter((a) => a.status === "cancelled").length,
      detail: "Voided",
      color: "text-red-600",
      dot: "bg-red-400",
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* ── PAGE HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">
              <span className="text-gray-900">APPOINTMENT</span>
              <span className="text-green-500">COMMAND.</span>
            </h1>
            <div className="mt-1 h-0.5 w-52 bg-gradient-to-r from-green-500 to-transparent rounded-full" />
            <p className="text-sm text-gray-400 font-medium mt-2 tracking-wide">
              Orchestrate applicant on-site verifications.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-black text-sm px-5 py-3 rounded-xl shadow-md transition-all"
          >
            <span className="text-lg leading-none">+</span>
            <span>Create Schedule</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── TODAY BANNER ── */}
        <div className="bg-gray-900 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Today
              </p>
              <p className="text-4xl font-black text-white leading-none tabular-nums">
                {todayDay}
              </p>
            </div>
            <div className="h-10 w-px bg-gray-700" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              {remaining} Appointment{remaining !== 1 ? "s" : ""} Remaining
            </p>
          </div>
          <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl">
            {statusTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === key
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, detail, color, dot }) => (
            <div
              key={label}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm text-center"
            >
              <div className={`text-2xl font-black tabular-nums ${color}`}>
                {value}
              </div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {label}
                </span>
              </div>
              <p className="text-[9px] text-gray-300 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID: List + Detail ── */}
        <div className="grid grid-cols-12 gap-5">
          {/* ── LEFT: Appointments List ── */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
              {/* Search */}
              {appointments.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                  <span className="text-gray-300 text-lg">⌕</span>
                  <input
                    type="text"
                    placeholder="Search by name, email, date or notes…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-[11px] font-bold text-gray-400 hover:text-gray-600 bg-gray-100 px-2 py-1 rounded-lg transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* Panel header */}
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"
                    }`}
                  />
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.18em]">
                    Schedule Pipeline
                  </p>
                </div>
                <span className="text-[10px] text-gray-300 font-mono">
                  {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Body */}
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                    Loading schedule…
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                  <Calendar size={40} className="text-gray-200" />
                  <p className="text-base font-black text-gray-600">
                    No Appointments Found
                  </p>
                  <p className="text-sm text-gray-400 text-center max-w-xs">
                    {searchQuery
                      ? `No results for "${searchQuery}"`
                      : "Schedule an applicant using the Initialize Schedule button."}
                  </p>
                </div>
              ) : (
                <div className="flex-1 divide-y divide-gray-50">
                  {filtered.map((apt) => {
                    const cfg = getStatusConfig(apt.status);
                    const isActive = selectedAppointment?.id === apt.id;
                    const { month, day } = formatMonthDay(apt.scheduled_date);

                    return (
                      <div
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className={cn(
                          "group flex items-center gap-4 px-6 py-5 cursor-pointer transition-all",
                          isActive
                            ? "bg-blue-50/50 border-l-4 border-blue-600"
                            : "hover:bg-gray-50/70",
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
                                : "bg-gray-100 text-gray-400",
                          )}
                        >
                          <span className="text-[10px] font-bold uppercase">
                            {month}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {day}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-black text-gray-900">
                              {apt.profiles?.full_name || "Unknown"}
                            </p>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                cfg.badge,
                              )}
                            >
                              {cfg.label}
                            </span>
                            {apt.applications?.type && (
                              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                                {apt.applications.type}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {apt.scheduled_time}
                            </span>
                            {apt.profiles?.email && (
                              <span>{apt.profiles.email}</span>
                            )}
                            {apt.notes && (
                              <span className="truncate max-w-[160px]">
                                📝 {apt.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Edit hint */}
                        <Edit2
                          size={14}
                          className="text-gray-200 group-hover:text-gray-400 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              {!loading && appointments.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                    {filtered.length} / {appointments.length} records
                  </span>
                  <button
                    onClick={fetchData}
                    className="text-[10px] font-bold text-gray-400 hover:text-green-500 transition uppercase tracking-widest"
                  >
                    ↻ Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Detail Panel (same styling as applicant) ── */}
          <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-8">
            {!selectedAppointment ? (
              <div className="bg-gray-100 rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200 shadow-sm min-h-[300px]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 mb-4 shadow-sm">
                  <Calendar size={32} />
                </div>
                <h4 className="text-sm font-bold text-gray-600">
                  No Appointment Selected
                </h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Click any appointment from the list to view details and
                  actions.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white ring-1 ring-white/10">
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
                      Appointment Detail
                    </p>
                    <h2 className="text-xl font-bold leading-tight mt-1">
                      {selectedAppointment.profiles?.full_name || "Applicant"}
                    </h2>
                    <p className="text-xs text-white/60 mt-0.5">
                      {selectedAppointment.profiles?.email}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                  {/* Status tracking */}
                  <section>
                    <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-3">
                      Status Tracking
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <div className="flex-1 flex justify-between">
                          <span className="text-xs font-medium">
                            Schedule Created
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
                            getStatusConfig(selectedAppointment.status).dot,
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

                  {/* Notes */}
                  <section>
                    <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-2">
                      Notes
                    </h4>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <p className="text-sm leading-relaxed text-slate-300 italic">
                        "
                        {selectedAppointment.notes ||
                          "No specific notes provided. Please contact the office for details."}
                        "
                      </p>
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
                        Application
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

                  {/* Quick actions */}
                  <section>
                    <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-3">
                      Quick Actions
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEditClick(selectedAppointment)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <Edit2 size={13} /> Edit Appointment
                      </button>

                      {selectedAppointment.status !== "completed" &&
                        selectedAppointment.status !== "cancelled" && (
                          <button
                            onClick={() =>
                              updateStatus(selectedAppointment.id, "completed")
                            }
                            className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            <Check size={13} /> Mark as Completed
                          </button>
                        )}

                      {selectedAppointment.status !== "cancelled" &&
                        selectedAppointment.status !== "completed" && (
                          <button
                            onClick={() =>
                              updateStatus(selectedAppointment.id, "cancelled")
                            }
                            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                          >
                            <X size={13} /> Cancel Appointment
                          </button>
                        )}

                      {(selectedAppointment.status === "completed" ||
                        selectedAppointment.status === "cancelled") && (
                        <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-bold py-2">
                          🔒 Appointment Locked
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800/40 flex items-center justify-between border-t border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-600 flex items-center justify-center">
                      <User size={12} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Admin
                    </span>
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

      {/* ══════════════════════════════════════════════════════════
          SCHEDULE MODAL
      ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-black text-gray-900">
                  {editingAppointment
                    ? "Edit Appointment"
                    : "Initialize Schedule"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingAppointment
                    ? "Update appointment details below."
                    : "Fill in the details to notify the applicant."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg">
                  {editingAppointment ? "✏️" : "📅"}
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-300 hover:text-gray-500 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSchedule}
              className="px-6 py-5 flex flex-col gap-4"
            >
              {/* Applicant */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                  Applicant <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.applicant_id}
                  onChange={handleApplicantChange}
                  required
                  disabled={!!editingAppointment}
                  className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">— Select applicant —</option>
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name} — {a.email}
                    </option>
                  ))}
                </select>
                {editingAppointment && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Applicant cannot be changed when editing.
                  </p>
                )}
              </div>

              {/* Application */}
              {selectedApplicantApps.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                    Application{" "}
                    <span className="text-gray-300 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <select
                    value={formData.application_id}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        application_id: e.target.value,
                      }))
                    }
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 bg-gray-50 transition"
                  >
                    <option value="">— Select application —</option>
                    {selectedApplicantApps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.type} · {app.status} ·{" "}
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.applicant_id && selectedApplicantApps.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700 font-medium">
                  ⚠️ No applications found for this applicant. You can still
                  schedule.
                </div>
              )}

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 bg-gray-50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                    Time <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      name="scheduled_time"
                      value={formData.scheduled_time}
                      onChange={handleTimeChange}
                      required
                      className={cn(
                        "w-full text-sm text-gray-700 border rounded-xl px-3 py-2.5 outline-none transition",
                        timeConfirmed
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 bg-gray-50 focus:border-gray-400",
                      )}
                    />
                    {formData.scheduled_time && (
                      <button
                        type="button"
                        onClick={() => setTimeConfirmed(true)}
                        disabled={timeConfirmed}
                        className={cn(
                          "absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition",
                          timeConfirmed
                            ? "bg-green-500 text-white cursor-default"
                            : "bg-orange-500 hover:bg-orange-600 text-white",
                        )}
                      >
                        {timeConfirmed ? (
                          <span className="flex items-center gap-1">
                            <Check size={12} /> Set
                          </span>
                        ) : (
                          "Okay"
                        )}
                      </button>
                    )}
                  </div>
                  {formData.scheduled_time && !timeConfirmed && (
                    <p className="text-[10px] text-orange-500 font-medium mt-1">
                      Click "Okay" to confirm the time
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                  Notes{" "}
                  <span className="text-gray-300 font-normal normal-case">
                    (optional)
                  </span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional instructions for the applicant…"
                  rows={3}
                  className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 bg-gray-50 resize-none transition"
                />
              </div>

              {/* Status — only when editing */}
              {editingAppointment && (
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                    Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 bg-gray-50 transition"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-black text-sm py-3 rounded-xl transition shadow"
                >
                  {submitting
                    ? editingAppointment
                      ? "Updating…"
                      : "Scheduling…"
                    : editingAppointment
                      ? "Update & Notify"
                      : "Schedule & Notify"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl border border-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
