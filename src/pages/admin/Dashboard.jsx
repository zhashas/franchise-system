import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
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
  Plus,
  Shield,
  UserCheck,
  Search,
  ArrowUpRight,
  Calendar,
  Bell,
  TrendingUp,
  Users,
} from "lucide-react";

const TOTAL_SLOTS = 5200;

const toDateObj = (str) => new Date(str + "T00:00:00");
const diffDays = (a, b) =>
  Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000);
const todayStr = () => new Date().toISOString().split("T")[0];
const addDays = (str, n) => {
  const d = toDateObj(str);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
const fmtDate = (str) =>
  str
    ? toDateObj(str).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
const isJanuary = () => new Date().getMonth() === 0;

const dedupKey = (type, id, date) => `${type}_${id}_${date}`;
const notifAlreadySent = async (key) => {
  try {
    const { data } = await supabase
      .from("notifications")
      .select("id")
      .eq("dedup_key", key)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
};
const sendNotification = async ({
  recipientId,
  type,
  title,
  message,
  franchiseId,
  key,
}) => {
  if (await notifAlreadySent(key)) return;
  await supabase.from("notifications").insert({
    recipient_id: recipientId,
    recipient_type: "applicant",
    sender_type: "system",
    notification_type: type,
    title,
    message,
    is_read: false,
    dedup_key: key,
    ...(franchiseId ? { franchise_id: franchiseId } : {}),
  });
};

const runScheduledNotifications = async (franchises) => {
  const today = todayStr();
  for (const f of franchises) {
    if (!f.applicant_id || !f.date_issued || !f.expiration_date) continue;
    const rid = f.applicant_id;
    for (const yearN of [1, 2]) {
      const ann = (() => {
        const d = toDateObj(f.date_issued);
        d.setFullYear(d.getFullYear() + yearN);
        return d.toISOString().split("T")[0];
      })();
      const trigger = addDays(ann, -30);
      if (today === trigger) {
        const key = dedupKey("mtop_sticker_reminder", f.id, trigger);
        await sendNotification({
          recipientId: rid,
          type: "mtop_sticker_reminder",
          title: "📋 Annual MTOP Sticker Payment Due Soon",
          message: `Your annual MTOP sticker payment is due on ${fmtDate(ann)} (Year ${yearN} of franchise ${f.franchise_number}). Visit the Municipal Hall to settle your payment.`,
          franchiseId: f.id,
          key,
        });
      }
    }
    const d30 = addDays(f.expiration_date, -30);
    if (today === d30) {
      const key = dedupKey("expiry_warning_30", f.id, today);
      await sendNotification({
        recipientId: rid,
        type: "franchise_expiry_warning_30",
        title: "⚠️ Franchise Expiring in 30 Days",
        message: `Your franchise (${f.franchise_number}) expires on ${fmtDate(f.expiration_date)} – 30 days from now. Please begin your renewal process.`,
        franchiseId: f.id,
        key,
      });
    }
    const d15 = addDays(f.expiration_date, -15);
    if (today === d15) {
      const key = dedupKey("expiry_warning_15", f.id, today);
      await sendNotification({
        recipientId: rid,
        type: "franchise_expiry_warning_15",
        title: "🚨 Franchise Expiring in 15 Days – Urgent",
        message: `URGENT: Your franchise (${f.franchise_number}) expires on ${fmtDate(f.expiration_date)}, only 15 days away. Renew immediately at the Municipal Hall.`,
        franchiseId: f.id,
        key,
      });
    }
  }
};

const freezeExpiredFranchises = async (franchises) => {
  const today = todayStr();
  let recycled = 0;
  for (const f of franchises) {
    if (f.status !== "active" && f.status !== "expired") continue;
    if (!f.expiration_date) continue;
    const daysSinceExpiry = diffDays(today, f.expiration_date);
    if (daysSinceExpiry >= 30) {
      const { error } = await supabase
        .from("franchises")
        .update({ status: "available", applicant_id: null })
        .eq("id", f.id);
      if (!error) {
        recycled++;
        if (f.applicant_id) {
          const key = dedupKey("franchise_recycled", f.id, today);
          await sendNotification({
            recipientId: f.applicant_id,
            type: "franchise_recycled",
            title: "🔄 Franchise Number Recycled",
            message: `Your franchise (${f.franchise_number}) has been inactive for 30+ days after expiration. The slot has been recycled.`,
            franchiseId: f.id,
            key,
          });
        }
      }
    } else if (daysSinceExpiry >= 0 && f.status === "active") {
      await supabase
        .from("franchises")
        .update({ status: "expired" })
        .eq("id", f.id);
      if (f.applicant_id) {
        const key = dedupKey(
          "franchise_expired_notif",
          f.id,
          f.expiration_date,
        );
        await sendNotification({
          recipientId: f.applicant_id,
          type: "franchise_expired",
          title: "⛔ Your Franchise Has Expired",
          message: `Your franchise (${f.franchise_number}) expired on ${fmtDate(f.expiration_date)}. Please renew within 30 days to retain your franchise number.`,
          franchiseId: f.id,
          key,
        });
      }
    }
  }
  return recycled;
};

const normalizeStatus = (status) => (status || "").toLowerCase().trim();

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [franchises, setFranchises] = useState([]);
  const [applications, setApplications] = useState([]);
  const [blasting, setBlasting] = useState({});
  const [blastResult, setBlastResult] = useState({});

  const fetchData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const [{ data: _prof }, { data: fr }, { data: apps }] = await Promise.all([
      supabase.from("profiles").select("*").single(),
      supabase
        .from("franchises")
        .select("*")
        .order("franchise_number", { ascending: true }),
      supabase
        .from("applications")
        .select("*")
        .order("submitted_at", { ascending: true }),
    ]);
    const list = fr || [];
    const appList = apps || [];
    setFranchises(list);
    setApplications(appList);
    return list;
  }, []);

  useEffect(() => {
    (async () => {
      const list = await fetchData();
      if (list.length) {
        const recycled = await freezeExpiredFranchises(list);
        await runScheduledNotifications(list);
        if (recycled > 0) await fetchData();
      }
    })();
  }, [fetchData]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const active = franchises.filter((f) => f.status === "active").length;
  // const expired = franchises.filter((f) => f.status === "expired").length;
  const available = franchises.filter((f) => f.status === "available").length;
  const total = franchises.length;
  const freeSlots = TOTAL_SLOTS - active;

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
  };

  const getDaysLeft = (f) =>
    f.expiration_date ? diffDays(f.expiration_date, todayStr()) : null;

  const expiringSoonList = franchises.filter((f) => {
    const d = getDaysLeft(f);
    return f.status === "active" && d !== null && d > 0 && d <= 30;
  });
  const expiredList = franchises.filter((f) => f.status === "expired");

  // ── Chart data ───────────────────────────────────────────────────────────
  const lineData = applications
    .filter((a) => a?.submitted_at)
    .reduce((acc, app) => {
      const dateObj = new Date(app.submitted_at);
      if (isNaN(dateObj.getTime())) return acc;
      const date = dateObj.toLocaleDateString();
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
    { name: "Rejected", value: appStats.rejected },
  ];

  // ── Blast handlers ───────────────────────────────────────────────────────
  const blastExpiringSoon = async () => {
    setBlasting((p) => ({ ...p, expiry: true }));
    setBlastResult((p) => ({ ...p, expiry: null }));
    const targets = franchises.filter((f) => {
      if (!f.applicant_id || !f.expiration_date || f.status !== "active")
        return false;
      const d = getDaysLeft(f);
      return d !== null && d > 0 && d <= 30;
    });
    let sent = 0;
    for (const f of targets) {
      const days = getDaysLeft(f);
      const key = dedupKey("blast_expiry_soon", f.id, todayStr());
      if (await notifAlreadySent(key)) continue;
      await supabase.from("notifications").insert({
        recipient_id: f.applicant_id,
        recipient_type: "applicant",
        sender_type: "admin",
        notification_type: "franchise_expiry_blast",
        title: "⚠️ Franchise Expiry Notice",
        message: `Your franchise (${f.franchise_number}) will expire on ${fmtDate(f.expiration_date)} — ${days} day${days !== 1 ? "s" : ""} remaining. Please renew at the Municipal Hall before the deadline.`,
        is_read: false,
        dedup_key: key,
        franchise_id: f.id,
      });
      sent++;
    }
    setBlasting((p) => ({ ...p, expiry: false }));
    setBlastResult((p) => ({
      ...p,
      expiry: `✅ Sent to ${sent} franchise holder${sent !== 1 ? "s" : ""}.`,
    }));
  };

  const blastMtopJanuary = async () => {
    setBlasting((p) => ({ ...p, mtop: true }));
    setBlastResult((p) => ({ ...p, mtop: null }));
    const targets = franchises.filter(
      (f) => f.applicant_id && f.status === "active",
    );
    let sent = 0;
    const year = new Date().getFullYear();
    for (const f of targets) {
      const key = dedupKey("blast_mtop_jan", f.id, `${year}-01`);
      if (await notifAlreadySent(key)) continue;
      await supabase.from("notifications").insert({
        recipient_id: f.applicant_id,
        recipient_type: "applicant",
        sender_type: "admin",
        notification_type: "mtop_sticker_annual_blast",
        title: "📋 Annual MTOP Sticker Payment – January Reminder",
        message: `This is a reminder to all franchise holders: January is the annual payment period for your MTOP sticker. Please visit the Municipal Hall to process your sticker update for franchise ${f.franchise_number}.`,
        is_read: false,
        dedup_key: key,
        franchise_id: f.id,
      });
      sent++;
    }
    setBlasting((p) => ({ ...p, mtop: false }));
    setBlastResult((p) => ({
      ...p,
      mtop: `✅ Sent to ${sent} active franchise holder${sent !== 1 ? "s" : ""}.`,
    }));
  };

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
      label: "Available Slots",
      value: available,
      icon: Plus,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Records",
      value: total,
      icon: Shield,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in">
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Real-time overview of the San Jose franchise ecosystem.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500"
                >
                  S{i}
                </div>
              ))}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              3 Staff Active
            </span>
          </div>
        </div>

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
                <span>0 Occupied</span>
                <span>{TOTAL_SLOTS} Total Capacity</span>
              </div>
            </div>
            <div className="md:w-px md:bg-slate-100" />
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-display font-black text-slate-900 leading-none mb-1">
                  {active}
                </p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Active
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-display font-black text-slate-400 leading-none mb-1">
                  {freeSlots}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Open
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── GRID STATS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <s.icon size={24} />
              </div>
              <p className="text-4xl font-display font-black text-slate-900 leading-none mb-2">
                {s.value}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── BULK NOTIFICATIONS ── */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Bell size={20} className="text-slate-900" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
              Bulk Notifications
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Expiry Blast */}
            <div
              className={cn(
                "rounded-2xl border-2 p-6 shadow-sm flex flex-col gap-4",
                expiringSoonList.length > 0
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 bg-slate-50 opacity-80",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-sm text-slate-900 mb-1">
                    Expiry Reminder Blast
                  </p>
                  <p className="text-xs text-slate-500 leading-snug">
                    Send to all franchise holders with{" "}
                    <span className="font-semibold text-orange-600">
                      ≤30 days
                    </span>{" "}
                    left.
                  </p>
                </div>
                <span
                  className={cn(
                    "text-3xl font-black tabular-nums ml-3",
                    expiringSoonList.length > 0
                      ? "text-orange-500"
                      : "text-slate-300",
                  )}
                >
                  {expiringSoonList.length}
                </span>
              </div>
              {blastResult.expiry && (
                <p className="text-xs text-emerald-600 font-semibold">
                  {blastResult.expiry}
                </p>
              )}
              <button
                onClick={blastExpiringSoon}
                disabled={blasting.expiry || expiringSoonList.length === 0}
                className={cn(
                  "mt-auto w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-sm",
                  expiringSoonList.length > 0 && !blasting.expiry
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed",
                )}
              >
                {blasting.expiry
                  ? "⏳ Sending…"
                  : `📤 Send to ${expiringSoonList.length} holders`}
              </button>
            </div>

            {/* MTOP January */}
            <div
              className={cn(
                "rounded-2xl border-2 p-6 shadow-sm flex flex-col gap-4",
                isJanuary()
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-200 bg-slate-50",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-sm text-slate-900 mb-1">
                    Annual MTOP Sticker – January
                  </p>
                  <p className="text-xs text-slate-500 leading-snug">
                    Remind all active holders for their annual MTOP sticker.
                    Sent every January.
                  </p>
                </div>
                <span
                  className={cn(
                    "text-3xl font-black tabular-nums ml-3",
                    isJanuary() ? "text-blue-500" : "text-slate-300",
                  )}
                >
                  {active}
                </span>
              </div>
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-xs font-medium border",
                  isJanuary()
                    ? "bg-blue-100/60 border-blue-200 text-blue-700"
                    : "bg-white/70 border-slate-200 text-slate-400",
                )}
              >
                {isJanuary()
                  ? "✅ January active — blast is enabled."
                  : "⚠️ Not January — manual override available."}
              </div>
              {blastResult.mtop && (
                <p className="text-xs text-emerald-600 font-semibold">
                  {blastResult.mtop}
                </p>
              )}
              <button
                onClick={blastMtopJanuary}
                disabled={blasting.mtop || active === 0}
                className={cn(
                  "mt-auto w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-sm",
                  active > 0 && !blasting.mtop
                    ? isJanuary()
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-slate-700 hover:bg-slate-800 text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed",
                )}
              >
                {blasting.mtop
                  ? "⏳ Sending…"
                  : `📤 Send MTOP Reminder (${active})`}
              </button>
            </div>

            {/* Auto-expired */}
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-sm text-slate-900 mb-1">
                    Auto-Expired Notifications
                  </p>
                  <p className="text-xs text-slate-500 leading-snug">
                    System auto-dispatches when a franchise reaches expiration.
                    No manual action required.
                  </p>
                </div>
                <span className="text-3xl font-black tabular-nums ml-3 text-red-500">
                  {expiredList.length}
                </span>
              </div>
              <div className="bg-red-100 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 font-medium">
                🤖 Slot recycled automatically after <strong>30 days</strong> of
                inactivity.
              </div>
              {expiredList.length > 0 ? (
                <ul className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {expiredList.slice(0, 5).map((f) => (
                    <li
                      key={f.id}
                      className="text-xs text-red-500 flex items-center gap-2"
                    >
                      <span>⛔</span>
                      <span>
                        <strong>{f.franchise_number}</strong> ·{" "}
                        {f.owner_name || "—"} · exp. {f.expiration_date}
                      </span>
                    </li>
                  ))}
                  {expiredList.length > 5 && (
                    <li className="text-xs text-red-300 italic">
                      +{expiredList.length - 5} more…
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-red-300 italic">
                  No expired franchises at this time.
                </p>
              )}
              <div className="mt-auto w-full py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-center bg-red-100 border border-red-200 text-red-500 cursor-default select-none">
                🔒 Automated — no action needed
              </div>
            </div>
          </div>
        </div>

        {/* ── CHARTS & ACTIVITY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Queue Priority
              </h3>
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
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        App ID: #{app.id.slice(-6)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
                        {app.type}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                        app.status === "pending"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-blue-100 text-blue-900",
                      )}
                    >
                      {app.status}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-slate-50/50">
              <button
                onClick={() => navigate("/admin/applications")}
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
      </div>
    </AdminLayout>
  );
}
