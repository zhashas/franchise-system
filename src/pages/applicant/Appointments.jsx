import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ApplicantLayout from "../../components/ApplicantLayout"

export default function ApplicantAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from("appointments")
        .select("*, applications(type)")
        .eq("applicant_id", user.id)
        .order("scheduled_date", { ascending: true })
      setAppointments(data || [])
      setLoading(false)
    }
    fetchAppointments()
  }, [])

  const statusColor = (status) => {
    if (status === "confirmed") return "bg-blue-100 text-blue-700"
    if (status === "completed") return "bg-green-100 text-green-700"
    if (status === "cancelled") return "bg-red-100 text-red-700"
    return "bg-yellow-100 text-yellow-700"
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-500 font-semibold">Loading...</div>

  return (
    <ApplicantLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-900">📅 My Appointments</h1>
          <p className="text-gray-500 text-sm">View your scheduled appointments with the franchise office</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Upcoming", value: appointments.filter(a => a.status === "confirmed").length, color: "border-blue-500" },
            { label: "Completed", value: appointments.filter(a => a.status === "completed").length, color: "border-green-500" },
            { label: "Cancelled / Rescheduled", value: appointments.filter(a => a.status === "cancelled").length, color: "border-red-500" },
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border-t-4 ${stat.color}`}>
              <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            <p className="text-5xl mb-3">📅</p>
            <p className="font-medium">No appointments scheduled yet.</p>
            <p className="text-sm mt-1">The admin will schedule an appointment once your application is under review.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Purpose</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(apt.scheduled_date).toLocaleDateString("en-PH", { month: "numeric", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{apt.scheduled_time}</td>
                    <td className="px-6 py-4 capitalize text-blue-900 font-medium">
                      {apt.applications?.type ? `Franchise ${apt.applications.type}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-6 py-4 bg-gray-50 border-t text-sm text-gray-500">
              💡 Need help? Contact the Tricycle Franchising Unit for schedule changes.
            </div>
          </div>
        )}
      </div>
    </ApplicantLayout>
  )
}