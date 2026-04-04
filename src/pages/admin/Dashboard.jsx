import { useEffect, useState, useCallback } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../../components/AdminLayout"

const TOTAL_SLOTS = 5200

const toDateObj = (str) => new Date(str + "T00:00:00")
const diffDays  = (a, b) => Math.round((toDateObj(a) - toDateObj(b)) / 86_400_000)
const todayStr  = () => new Date().toISOString().split("T")[0]
const addDays   = (str, n) => { const d = toDateObj(str); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0] }
const fmtDate   = (str) => str ? toDateObj(str).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"
const isJanuary = () => new Date().getMonth() === 0

const dedupKey         = (type, id, date) => `${type}_${id}_${date}`
const notifAlreadySent = async (key) => {
  try {
    const { data } = await supabase.from("notifications").select("id").eq("dedup_key", key).maybeSingle()
    return !!data
  } catch { return false }
}
const sendNotification = async ({ recipientId, type, title, message, franchiseId, key }) => {
  if (await notifAlreadySent(key)) return
  await supabase.from("notifications").insert({
    recipient_id: recipientId, recipient_type: "applicant", sender_type: "system",
    notification_type: type, title, message, is_read: false,
    dedup_key: key,
    ...(franchiseId ? { franchise_id: franchiseId } : {}),
  })
}

const runScheduledNotifications = async (franchises) => {
  const today = todayStr()
  let count = 0
  for (const f of franchises) {
    if (!f.applicant_id || !f.date_issued || !f.expiration_date) continue
    const rid = f.applicant_id
    for (const yearN of [1, 2]) {
      const ann = (() => { const d = toDateObj(f.date_issued); d.setFullYear(d.getFullYear() + yearN); return d.toISOString().split("T")[0] })()
      const trigger = addDays(ann, -30)
      if (today === trigger) {
        const key = dedupKey("mtop_sticker_reminder", f.id, trigger)
        await sendNotification({ recipientId: rid, type: "mtop_sticker_reminder", title: "📋 Annual MTOP Sticker Payment Due Soon", message: `Your annual MTOP sticker payment is due on ${fmtDate(ann)} (Year ${yearN} of franchise ${f.franchise_number}). Visit the Municipal Hall to settle your payment.`, franchiseId: f.id, key })
        count++
      }
    }
    const d30 = addDays(f.expiration_date, -30)
    if (today === d30) {
      const key = dedupKey("expiry_warning_30", f.id, today)
      await sendNotification({ recipientId: rid, type: "franchise_expiry_warning_30", title: "⚠️ Franchise Expiring in 30 Days", message: `Your franchise (${f.franchise_number}) expires on ${fmtDate(f.expiration_date)} – 30 days from now. Please begin your renewal process.`, franchiseId: f.id, key })
      count++
    }
    const d15 = addDays(f.expiration_date, -15)
    if (today === d15) {
      const key = dedupKey("expiry_warning_15", f.id, today)
      await sendNotification({ recipientId: rid, type: "franchise_expiry_warning_15", title: "🚨 Franchise Expiring in 15 Days – Urgent", message: `URGENT: Your franchise (${f.franchise_number}) expires on ${fmtDate(f.expiration_date)}, only 15 days away. Renew immediately at the Municipal Hall.`, franchiseId: f.id, key })
      count++
    }
  }
  return count
}

const freezeExpiredFranchises = async (franchises) => {
  const today = todayStr()
  let recycled = 0
  for (const f of franchises) {
    if (f.status !== "active" && f.status !== "expired") continue
    if (!f.expiration_date) continue
    const daysSinceExpiry = diffDays(today, f.expiration_date)
    if (daysSinceExpiry >= 30) {
      const { error } = await supabase.from("franchises").update({ status: "available", applicant_id: null }).eq("id", f.id)
      if (!error) {
        recycled++
        if (f.applicant_id) {
          const key = dedupKey("franchise_recycled", f.id, today)
          await sendNotification({
            recipientId: f.applicant_id, type: "franchise_recycled",
            title: "🔄 Franchise Number Recycled",
            message: `Your franchise (${f.franchise_number}) has been inactive for 30+ days after expiration. The slot has been recycled and is now available for new registrations.`,
            franchiseId: f.id, key,
          })
        }
      }
    } else if (daysSinceExpiry >= 0 && f.status === "active") {
      await supabase.from("franchises").update({ status: "expired" }).eq("id", f.id)
      if (f.applicant_id) {
        const key = dedupKey("franchise_expired_notif", f.id, f.expiration_date)
        await sendNotification({
          recipientId: f.applicant_id, type: "franchise_expired",
          title: "⛔ Your Franchise Has Expired",
          message: `Your franchise (${f.franchise_number}) expired on ${fmtDate(f.expiration_date)}. Please renew within 30 days to retain your franchise number, otherwise it will be recycled.`,
          franchiseId: f.id, key,
        })
      }
    }
  }
  return recycled
}

export default function AdminDashboard() {
  const [profile,     setProfile]     = useState(null)
  const [franchises,  setFranchises]  = useState([])
  const [blasting,    setBlasting]    = useState({})
  const [blastResult, setBlastResult] = useState({})
  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const [{ data: prof }, { data: fr }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("franchises").select("*").order("franchise_number", { ascending: true }),
    ])
    setProfile(prof)
    const list = fr || []
    setFranchises(list)
    return list
  }, [])

  useEffect(() => {
    (async () => {
      const list = await fetchData()
      if (list.length) {
        const recycled = await freezeExpiredFranchises(list)
        await runScheduledNotifications(list)
        if (recycled > 0) await fetchData()
      }
    })()
  }, [fetchData])

  const active    = franchises.filter(f => f.status === "active").length
  const expired   = franchises.filter(f => f.status === "expired").length
  const available = franchises.filter(f => f.status === "available").length
  const total     = franchises.length
  const freeSlots = TOTAL_SLOTS - active

  const getDaysLeft = (f) => f.expiration_date ? diffDays(f.expiration_date, todayStr()) : null

  const expiringSoonList = franchises.filter(f => {
    const d = getDaysLeft(f)
    return f.status === "active" && d !== null && d > 0 && d <= 30
  })
  const expiredList = franchises.filter(f => f.status === "expired")

  const blastExpiringSoon = async () => {
    setBlasting(p => ({ ...p, expiry: true }))
    setBlastResult(p => ({ ...p, expiry: null }))
    const targets = franchises.filter(f => {
      if (!f.applicant_id || !f.expiration_date || f.status !== "active") return false
      const d = getDaysLeft(f)
      return d !== null && d > 0 && d <= 30
    })
    let sent = 0
    for (const f of targets) {
      const days = getDaysLeft(f)
      const key  = dedupKey("blast_expiry_soon", f.id, todayStr())
      if (await notifAlreadySent(key)) continue
      await supabase.from("notifications").insert({
        recipient_id: f.applicant_id, recipient_type: "applicant", sender_type: "admin",
        notification_type: "franchise_expiry_blast",
        title: "⚠️ Franchise Expiry Notice",
        message: `Your franchise (${f.franchise_number}) will expire on ${fmtDate(f.expiration_date)} — ${days} day${days !== 1 ? "s" : ""} remaining. Please renew at the Municipal Hall before the deadline to avoid penalty.`,
        is_read: false, dedup_key: key, franchise_id: f.id,
      })
      sent++
    }
    setBlasting(p => ({ ...p, expiry: false }))
    setBlastResult(p => ({ ...p, expiry: `✅ Sent to ${sent} franchise holder${sent !== 1 ? "s" : ""} expiring within 30 days.` }))
  }

  const blastMtopJanuary = async () => {
    setBlasting(p => ({ ...p, mtop: true }))
    setBlastResult(p => ({ ...p, mtop: null }))
    const targets = franchises.filter(f => f.applicant_id && f.status === "active")
    let sent = 0
    const year = new Date().getFullYear()
    for (const f of targets) {
      const key = dedupKey("blast_mtop_jan", f.id, `${year}-01`)
      if (await notifAlreadySent(key)) continue
      await supabase.from("notifications").insert({
        recipient_id: f.applicant_id, recipient_type: "applicant", sender_type: "admin",
        notification_type: "mtop_sticker_annual_blast",
        title: "📋 Annual MTOP Sticker Payment – January Reminder",
        message: `This is a reminder to all franchise holders: January is the annual payment period for your Motorized Tricycle Operator's Permit (MTOP) sticker. Please visit the Municipal Hall, San Jose, Occidental Mindoro to process your sticker update for franchise ${f.franchise_number}.`,
        is_read: false, dedup_key: key, franchise_id: f.id,
      })
      sent++
    }
    setBlasting(p => ({ ...p, mtop: false }))
    setBlastResult(p => ({ ...p, mtop: `✅ Sent to ${sent} active franchise holder${sent !== 1 ? "s" : ""}.` }))
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 px-1">

        {/* ── HEADER ── */}
       <div className="rounded-xl px-6 py-5 bg-orange-50 border border-orange-200 shadow-sm">
          <h1 className="text-2xl font-bold text-black tracking-tight">Admin Dashboard</h1>
          <p className="text-xs font-semibold text-black-100 uppercase tracking-widest mb-0.5">Municipal Franchise Management System</p>
          <p className="text-sm text-black-100 mt-0.5">Welcome back, <span className="font-semibold">{profile?.full_name ?? "Administrator"}</span>.</p>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Franchise Records",    value: total,     icon: "🏢", ring: "ring-orange-300",  num: "text-orange-600",  bg: "bg-orange-50"  },
            { label: "Active Franchises",           value: active,    icon: "✅", ring: "ring-emerald-300", num: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Expired Franchises",          value: expired,   icon: "⛔", ring: "ring-red-300",     num: "text-red-600",     bg: "bg-red-50"     },
            { label: "Available / Recycled Slots",  value: available, icon: "🔄", ring: "ring-blue-300",   num: "text-blue-600",    bg: "bg-blue-50"    },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} ring-1 ${s.ring} rounded-xl p-5 shadow-sm flex flex-col gap-2`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                <span className={`text-4xl font-black ${s.num} tabular-nums`}>{s.value}</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── SLOT PROGRESS BAR ── */}
        <div className="bg-white ring-1 ring-gray-200 rounded-xl px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Franchise Slot Usage</span>
            <span className="text-xs text-gray-400">{active} used · <span className="text-blue-600 font-semibold">{freeSlots} free</span> · {TOTAL_SLOTS} total</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700"
              style={{ width: `${Math.min((active / TOTAL_SLOTS) * 100, 100).toFixed(2)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-right">{((active / TOTAL_SLOTS) * 100).toFixed(1)}% occupied</p>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/admin/applications")}
            className="group relative overflow-hidden p-5 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-white text-base shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-left">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl opacity-20 group-hover:opacity-30 transition">📝</span>
            <span className="relative">APPLICATIONS</span>
            <p className="text-xs font-normal text-emerald-100 mt-0.5 relative">View and manage all franchise applications</p>
          </button>
          <button
            onClick={() => navigate("/admin/appointments")}
            className="group relative overflow-hidden p-5 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold text-white text-base shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-left">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl opacity-20 group-hover:opacity-30 transition">📅</span>
            <span className="relative">APPOINTMENTS</span>
            <p className="text-xs font-normal text-blue-100 mt-0.5 relative">Schedule and track applicant appointments</p>
          </button>
        </div>

        {/* ── BULK NOTIFICATIONS ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📣</span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Bulk Notifications</h2>
            <span className="text-xs text-gray-400 italic">(SMS / Email / In-App — dispatched from applicant file)</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">

            {/* Card 1 — Expiring ≤30 days */}
            <div className={`rounded-xl border-2 p-5 shadow-sm flex flex-col gap-3 transition-all ${expiringSoonList.length > 0 ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-gray-50 opacity-80"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-extrabold text-sm text-gray-800">Expiry Reminder Blast</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">Send to all franchise holders with <span className="font-semibold text-orange-600">≤30 days</span> left. Message includes days left and exact expiration date.</p>
                </div>
                <span className={`text-3xl font-black tabular-nums ml-3 ${expiringSoonList.length > 0 ? "text-orange-500" : "text-gray-300"}`}>{expiringSoonList.length}</span>
              </div>
              <div className="bg-white/70 border border-orange-200 rounded-lg px-3 py-2 text-xs text-gray-500 italic">
                Notification includes: franchise number, expiry date, days remaining, renewal instruction.
              </div>
              {blastResult.expiry && <p className="text-xs text-emerald-600 font-semibold">{blastResult.expiry}</p>}
              <button
                onClick={blastExpiringSoon}
                disabled={blasting.expiry || expiringSoonList.length === 0}
                className={`mt-auto w-full py-2.5 rounded-lg text-sm font-bold transition ${expiringSoonList.length > 0 && !blasting.expiry ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                {blasting.expiry ? "⏳ Sending…" : `📤 Send to ${expiringSoonList.length} holders`}
              </button>
            </div>

            {/* Card 2 — Annual MTOP January */}
            <div className={`rounded-xl border-2 p-5 shadow-sm flex flex-col gap-3 transition-all ${isJanuary() ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-extrabold text-sm text-gray-800">Annual MTOP Sticker – January</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">Remind all active holders to pay for their Motorized Tricycle Operator's Permit sticker. Sent annually every January 1–31.</p>
                </div>
                <span className={`text-3xl font-black tabular-nums ml-3 ${isJanuary() ? "text-blue-500" : "text-gray-300"}`}>{active}</span>
              </div>
              <div className={`rounded-lg px-3 py-2 text-xs italic border ${isJanuary() ? "bg-blue-100/60 border-blue-200 text-blue-700" : "bg-white/70 border-gray-200 text-gray-400"}`}>
                {isJanuary() ? "✅ January active — blast is enabled." : "⚠️ Not January — manual override available."}
              </div>
              {blastResult.mtop && <p className="text-xs text-emerald-600 font-semibold">{blastResult.mtop}</p>}
              <button
                onClick={blastMtopJanuary}
                disabled={blasting.mtop || active === 0}
                className={`mt-auto w-full py-2.5 rounded-lg text-sm font-bold transition ${active > 0 && !blasting.mtop ? (isJanuary() ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" : "bg-gray-700 hover:bg-gray-800 text-white shadow-sm") : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                {blasting.mtop ? "⏳ Sending…" : `📤 Send MTOP Reminder (${active})`}
              </button>
            </div>

            {/* Card 3 — Auto-expired (read-only) */}
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-extrabold text-sm text-gray-800">Auto-Expired Notifications</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">Automatically dispatched when a franchise reaches its expiration date. No manual action required.</p>
                </div>
                <span className="text-3xl font-black tabular-nums ml-3 text-red-500">{expiredList.length}</span>
              </div>
              <div className="bg-red-100 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                🤖 System auto-notifies applicants on expiry. Slot is recycled automatically after <strong>30 days</strong> of inactivity.
              </div>
              {expiredList.length > 0 ? (
                <ul className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {expiredList.slice(0, 6).map(f => (
                    <li key={f.id} className="text-xs text-red-500 flex items-center gap-1.5">
                      <span>⛔</span>
                      <span><span className="font-bold">{f.franchise_number}</span> · {f.owner_name || "—"} · exp. {f.expiration_date}</span>
                    </li>
                  ))}
                  {expiredList.length > 6 && <li className="text-xs text-red-300 italic">+{expiredList.length - 6} more…</li>}
                </ul>
              ) : (
                <p className="text-xs text-red-300 italic">No expired franchises at this time.</p>
              )}
              <div className="mt-auto w-full py-2 rounded-lg text-xs font-semibold text-center bg-red-100 border border-red-200 text-red-500 cursor-default select-none">
                🔒 Automated — no action needed
              </div>
            </div>

          </div>
        </div>

      </div>
    </AdminLayout>
  )
}