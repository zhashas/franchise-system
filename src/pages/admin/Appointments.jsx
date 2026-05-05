import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";
import {
  Calendar,
  X,
  ChevronRight,
  ClipboardList,
  Check,
  Edit2,
} from "lucide-react";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    const { data: apts } = await supabase
      .from("appointments")
      .select("*, profiles(full_name, email)")
      .order("scheduled_date", { ascending: true });
    setAppointments(apts || []);

    const { data: profs } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "applicant")
      .order("full_name", { ascending: true });
    setApplicants(profs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Form handlers ──────────────────────────────────────────────────────────
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
    const { data: apps } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_id", applicantId)
      .order("submitted_at", { ascending: false });
    setSelectedApplicantApps(apps || []);
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

    // Fetch applications for this applicant
    const { data: apps } = await supabase
      .from("applications")
      .select("*")
      .eq("applicant_id", appointment.applicant_id)
      .order("submitted_at", { ascending: false });
    setSelectedApplicantApps(apps || []);

    setShowModal(true);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!timeConfirmed && formData.scheduled_time) {
      alert("Please confirm the time by clicking the 'Okay' button.");
      return;
    }
    setSubmitting(true);
    try {
      const selectedApp = selectedApplicantApps.find(
        (a) => a.id === formData.application_id,
      );

      if (editingAppointment) {
        // Update existing appointment
        await supabase
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

        await supabase.from("notifications").insert({
          recipient_id: formData.applicant_id,
          recipient_type: "applicant",
          sender_type: "admin",
          notification_type: "appointment",
          title: "📅 Appointment Updated!",
          message: `Your appointment has been updated to ${new Date(
            formData.scheduled_date,
          ).toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })} at ${formData.scheduled_time}. ${
            formData.notes
              ? "Note: " + formData.notes
              : "Please proceed to the Municipal Hall, San Jose, Occidental Mindoro."
          }`,
          is_read: false,
        });
      } else {
        // Create new appointment
        await supabase.from("appointments").insert({
          applicant_id: formData.applicant_id,
          application_id: formData.application_id || null,
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
          notes: formData.notes,
          status: "confirmed",
        });

        await supabase.from("notifications").insert({
          recipient_id: formData.applicant_id,
          recipient_type: "applicant",
          sender_type: "admin",
          notification_type: "appointment",
          title: "📅 Appointment Scheduled!",
          message: `Your appointment has been scheduled on ${new Date(
            formData.scheduled_date,
          ).toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })} at ${formData.scheduled_time}. ${
            formData.notes
              ? "Note: " + formData.notes
              : "Please proceed to the Municipal Hall, San Jose, Occidental Mindoro."
          }`,
          is_read: false,
        });

        if (selectedApp?.status === "pending") {
          await supabase
            .from("applications")
            .update({ status: "under_review" })
            .eq("id", formData.application_id);
        }
      }

      closeModal();
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    fetchData();
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

  // ── Derived state ──────────────────────────────────────────────────────────
  const todayDay = new Date().getDate().toString().padStart(2, "0");
  const todayStr = new Date().toISOString().split("T")[0];
  const todayApts = appointments.filter(
    (a) => a.scheduled_date === todayStr && a.status !== "cancelled",
  );
  const remaining = todayApts.filter((a) => a.status !== "completed").length;

  const filtered = appointments
    .filter((apt) =>
      statusFilter === "all" ? true : apt.status === statusFilter,
    )
    .filter((apt) => {
      const q = searchQuery.toLowerCase();
      return (
        apt.profiles?.full_name?.toLowerCase().includes(q) ||
        apt.profiles?.email?.toLowerCase().includes(q) ||
        apt.notes?.toLowerCase().includes(q) ||
        apt.scheduled_date?.includes(q)
      );
    });

  const statusTabs = [
    { key: "all", label: "ALL" },
    { key: "confirmed", label: "CONFIRMED" },
    { key: "completed", label: "COMPLETED" },
    { key: "cancelled", label: "CANCELLED" },
  ];

  const statusBadge = (status) => {
    if (status === "confirmed") return "bg-blue-100 text-blue-700";
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "cancelled") return "bg-red-100 text-red-600";
    return "bg-yellow-100 text-yellow-700";
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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

          {/* Initialize Schedule button */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-5 py-3 rounded-xl shadow-md transition-all"
          >
            <span className="text-lg leading-none">+</span>
            <span>Initialize Schedule</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── TODAY BANNER with filter tabs ── */}
        <div className="bg-gray-900 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          {/* Left: today info */}
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

          {/* Right: status filter tabs */}
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

        {/* ── APPOINTMENTS LIST PANEL ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[340px] flex flex-col">
          {/* Optional search bar */}
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

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                Loading schedule…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            /* ── EMPTY STATE matching design ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <Calendar size={40} className="text-gray-200" />
              <p className="text-base font-black text-gray-600">
                No Appointments Booked
              </p>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Start by scheduling an applicant from the applications repository."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Applicant",
                      "Date",
                      "Time",
                      "Notes",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((apt) => (
                    <tr
                      key={apt.id}
                      onClick={() => handleEditClick(apt)}
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">
                              {apt.profiles?.full_name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {apt.profiles?.email}
                            </p>
                          </div>
                          <Edit2
                            size={14}
                            className="text-gray-300 group-hover:text-gray-500 transition opacity-0 group-hover:opacity-100"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {new Date(apt.scheduled_date).toLocaleDateString(
                          "en-PH",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 font-mono whitespace-nowrap">
                        {apt.scheduled_time}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 max-w-[180px]">
                        <span className="line-clamp-2">{apt.notes || "—"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(apt.status)}`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {apt.status !== "completed" &&
                            apt.status !== "cancelled" && (
                              <button
                                onClick={() =>
                                  updateStatus(apt.id, "completed")
                                }
                                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition uppercase tracking-wide"
                              >
                                Complete
                              </button>
                            )}
                          {apt.status !== "cancelled" &&
                            apt.status !== "completed" && (
                              <button
                                onClick={() =>
                                  updateStatus(apt.id, "cancelled")
                                }
                                className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition uppercase tracking-wide"
                              >
                                Cancel
                              </button>
                            )}
                          {(apt.status === "completed" ||
                            apt.status === "cancelled") && (
                            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                              Locked
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && appointments.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-end">
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                {filtered.length} / {appointments.length} records shown
              </span>
            </div>
          )}
        </div>

        {/* ── REQUIREMENT PROTOCOL CARD ── */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-6 py-5 flex items-center gap-5">
          <div className="w-12 h-12 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={22} className="text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-orange-700 mb-0.5">
              Requirement Protocol
            </p>
            <p className="text-xs text-orange-500 leading-relaxed">
              Remind applicants to bring their original documents and valid
              identification. Verification usually takes between 15–20 minutes
              depending on unit condition.
            </p>
          </div>
          <button className="flex-shrink-0 text-[10px] font-black uppercase tracking-[0.18em] px-4 py-2.5 rounded-xl border-2 border-orange-300 text-orange-600 hover:bg-orange-100 transition bg-white whitespace-nowrap">
            Download Protocol.pdf
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SCHEDULE MODAL
      ══════════════════════════════════════════════════════════════ */}
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
                    ? "Update appointment details"
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
              {/* Select Applicant */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                  Applicant <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.applicant_id}
                  onChange={handleApplicantChange}
                  required
                  disabled={editingAppointment !== null}
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
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">
                    Applicant cannot be changed when editing
                  </p>
                )}
              </div>

              {/* Select Application */}
              {selectedApplicantApps.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-1.5">
                    Application{" "}
                    <span className="text-gray-300 font-medium normal-case">
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
                      className={`w-full text-sm text-gray-700 border rounded-xl px-3 py-2.5 outline-none transition ${
                        timeConfirmed
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 bg-gray-50 focus:border-gray-400"
                      }`}
                    />
                    {formData.scheduled_time && (
                      <button
                        type="button"
                        onClick={() => setTimeConfirmed(true)}
                        disabled={timeConfirmed}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                          timeConfirmed
                            ? "bg-green-500 text-white cursor-default"
                            : "bg-orange-500 hover:bg-orange-600 text-white"
                        }`}
                      >
                        {timeConfirmed ? (
                          <span className="flex items-center gap-1">
                            <Check size={12} />
                            Set
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
                  <span className="text-gray-300 font-medium normal-case">
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

              {/* Status (only when editing) */}
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

              {/* Submit buttons */}
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
