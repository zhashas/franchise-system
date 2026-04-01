import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useNavigate } from "react-router-dom"

export default function StaffDashboard() {
  const [profile, setProfile] = useState(null)
  const [applications, setApplications] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    setProfile(profileData)

    const { data: apps } = await supabase
      .from("applications")
      .select("*, profiles(full_name, email, phone)")
      .order("submitted_at", { ascending: false })
    setApplications(apps || [])

    const { data: apts } = await supabase
      .from("appointments")
      .select("*, profiles(full_name, email)")
      .order("scheduled_date", { ascending: true })
    setAppointments(apts || [])

    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      await fetchData()
    })()
  }, [])

  const updateStatus = async (id, status) => {
    await supabase
      .from("applications")
      .update({ status, updated_at: new Date() })
      .eq("id", id)
    fetchData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login")
  }

  const statusColor = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700"
    if (status === "rejected") return "bg-red-100 text-red-700"
    if (status === "under_review") return "bg-blue-100 text-blue-700"
    return "bg-yellow-100 text-yellow-700"
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-orange-500 font-semibold">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-orange-600 to-orange-400 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">San Jose Franchise System</p>
            <p className="text-orange-100 text-xs">Municipality of San Jose, Occidental Mindoro</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-orange-100">👨‍💼 {profile?.full_name}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-orange-500 hover:bg-orange-50 text-sm px-4 py-1.5 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="bg-blue-900 text-white rounded-xl p-6 mb-6 border-l-4 border-orange-500">
          <h1 className="text-2xl font-bold">Staff Dashboard 👨‍💼</h1>
          <p className="text-blue-200 text-sm mt-1">Review applications and manage appointment schedules.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Applications", value: applications.length, color: "border-blue-500" },
            { label: "Pending", value: applications.filter(a => a.status === "pending").length, color: "border-yellow-500" },
            { label: "Under Review", value: applications.filter(a => a.status === "under_review").length, color: "border-blue-400" },
            { label: "Appointments", value: appointments.length, color: "border-orange-500" },
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border-t-4 ${stat.color}`}>
              <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-blue-900">📋 Applications for Review</h2>
            <p className="text-gray-500 text-xs">Review and update application statuses</p>
          </div>
          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📄</p>
              <p>No applications found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Applicant</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-900">
                      {app.profiles?.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <p>{app.profiles?.email}</p>
                      <p className="text-xs">{app.profiles?.phone}</p>
                    </td>
                    <td className="px-6 py-4 capitalize">{app.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(app.status)}`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {app.status === "pending" && (
                          <button
                            onClick={() => updateStatus(app.id, "under_review")}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded text-xs font-medium transition"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold text-blue-900">📅 Upcoming Appointments</h2>
          </div>
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📅</p>
              <p>No appointments scheduled.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Applicant</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-900">
                      {apt.profiles?.full_name}
                      <p className="text-xs text-gray-400">{apt.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(apt.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{apt.scheduled_time}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}