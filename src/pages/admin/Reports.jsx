import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import AdminLayout from "../../components/AdminLayout"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

export default function AdminReports() {
  const [applications, setApplications] = useState([])
  const [appointments, setAppointments] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeFilter, setTimeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    const fetchData = async () => {
      const { data: apps } = await supabase
        .from("applications")
        .select("*, profiles(full_name, email, phone)")
        .order("submitted_at", { ascending: false })
      setApplications(apps || [])

      const { data: apts } = await supabase
        .from("appointments")
        .select("*, profiles(full_name, email)")
        .order("scheduled_date", { ascending: false })
      setAppointments(apts || [])

      const { data: profs } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "applicant")
        .order("created_at", { ascending: false })
      setProfiles(profs || [])

      setLoading(false)
    }
    fetchData()
  }, [])

  const filterByTime = (items, dateField) => {
    if (timeFilter === "all") return items
    const now = new Date()
    return items.filter(item => {
      const date = new Date(item[dateField])
      if (timeFilter === "this_month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      if (timeFilter === "this_week") {
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        return date >= weekAgo
      }
      if (timeFilter === "today") return date.toDateString() === now.toDateString()
      return true
    })
  }

  const filteredApps = filterByTime(applications, "submitted_at")

  const stats = {
    total: filteredApps.length,
    active: filteredApps.filter(a => a.status === "approved").length,
    pending: filteredApps.filter(a => a.status === "pending").length,
    rejected: filteredApps.filter(a => a.status === "rejected").length,
    under_review: filteredApps.filter(a => a.status === "under_review").length,
    registration: filteredApps.filter(a => a.type === "registration").length,
    renewal: filteredApps.filter(a => a.type === "renewal").length,
    total_appointments: appointments.length,
    completed_appointments: appointments.filter(a => a.status === "completed").length,
    total_applicants: profiles.length,
  }

  // Bar chart data - applications per month
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const barData = months.map((month, i) => ({
    month,
    count: applications.filter(a => new Date(a.submitted_at).getMonth() === i).length,
  }))

  // Pie chart data
  const pieData = [
    { name: "Approved", value: stats.active, color: "#22c55e" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Under Review", value: stats.under_review, color: "#3b82f6" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
  ].filter(d => d.value > 0)

  const statusColor = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700"
    if (status === "rejected") return "bg-red-100 text-red-700"
    if (status === "under_review") return "bg-blue-100 text-blue-700"
    return "bg-yellow-100 text-yellow-700"
  }

  // Recent activities - filtered + searched + paginated
  const recentActivities = filteredApps.filter(app =>
    app.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.status?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(recentActivities.length / itemsPerPage)
  const paginatedActivities = recentActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePrint = () => window.print()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-orange-500 font-semibold">
      Loading...
    </div>
  )

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-orange-500">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-blue-900 uppercase tracking-wide">
                📊 Reports and Analytics Overview
              </h1>
              <p className="text-gray-400 text-xs mt-1">Municipality of San Jose, Occidental Mindoro</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1) }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="all">All Time</option>
                <option value="this_month">This Month</option>
                <option value="this_week">This Week</option>
                <option value="today">Today</option>
              </select>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
              >
                🖨️ Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Registered", value: stats.total, color: "border-orange-500", text: "text-orange-600", bg: "bg-orange-50" },
            { label: "Active", value: stats.active, color: "border-green-500", text: "text-green-600", bg: "bg-green-50" },
            { label: "Pending", value: stats.pending, color: "border-yellow-500", text: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Under Review", value: stats.under_review, color: "border-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
            { label: "Rejected", value: stats.rejected, color: "border-red-500", text: "text-red-600", bg: "bg-red-50" },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} rounded-xl p-4 shadow-sm border-t-4 ${stat.color} text-center`}>
              <p className={`text-3xl font-bold ${stat.text}`}>{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1 font-medium uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
              📊 Number of Applications per Month
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
              🥧 Franchise Status Distribution
            </h2>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Registrations", value: stats.registration, color: "border-orange-400", text: "text-orange-600" },
            { label: "Renewals", value: stats.renewal, color: "border-purple-400", text: "text-purple-600" },
            { label: "Total Appointments", value: stats.total_appointments, color: "border-blue-400", text: "text-blue-600" },
            { label: "Registered Applicants", value: stats.total_applicants, color: "border-green-400", text: "text-green-600" },
          ].map((stat, i) => (
            <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border-t-4 ${stat.color}`}>
              <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              📋 Recent Activities
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-48"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 flex gap-2 flex-wrap">
            {["overview", "applications", "appointments", "applicants"].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1) }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition capitalize ${
                  activeTab === tab
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-orange-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 pt-4">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Operator Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedActivities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">No records found.</td>
                    </tr>
                  ) : paginatedActivities.map((app) => (
                    <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(app.submitted_at).toLocaleDateString("en-PH")}
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-900">
                        {app.profiles?.full_name}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">{app.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(app.status)}`}>
                          {app.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/admin/applications/${app.id}`}
                          className="text-orange-500 hover:underline text-xs font-medium"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-900">
                        {app.profiles?.full_name}
                        <p className="text-xs text-gray-400">{app.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{app.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(app.status)}`}>
                          {app.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-900">
                        {apt.profiles?.full_name}
                        <p className="text-xs text-gray-400">{apt.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date(apt.scheduled_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{apt.scheduled_time}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Applicants Tab */}
            {activeTab === "applicants" && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Date Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-blue-900">{profile.full_name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{profile.email}</td>
                      <td className="px-4 py-3 text-gray-500">{profile.phone}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination — Overview only */}
            {activeTab === "overview" && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  ← Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition ${
                      currentPage === page
                        ? "bg-orange-500 text-white border-orange-500"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}