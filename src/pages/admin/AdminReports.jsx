// pages/admin/AdminReports.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

export default function AdminReports() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  const normalizeStatus = (status) =>
    (status || "").toLowerCase().trim();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: apps, error } = await supabase
          .from("applications")
          .select("*")
          .order("submitted_at", { ascending: true });

        if (error) {
          console.error("Supabase error:", error);
          setApplications([]);
          return;
        }

        const safeApps = Array.isArray(apps) ? apps : [];

        setApplications(safeApps);

        setStats({
          total: safeApps.length,
          pending: safeApps.filter(a =>
            normalizeStatus(a.status) === "pending"
          ).length,
          under_review: safeApps.filter(a =>
            normalizeStatus(a.status) === "under_review"
          ).length,
          approved: safeApps.filter(a =>
            normalizeStatus(a.status) === "approved"
          ).length,
          rejected: safeApps.filter(a =>
            normalizeStatus(a.status) === "rejected"
          ).length,
        });

      } catch (err) {
        console.error("Unexpected error:", err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // SAFE LINE CHART DATA
  const lineData = Array.isArray(applications)
    ? applications
        .filter(a => a?.submitted_at)
        .reduce((acc, app) => {
          const dateObj = new Date(app.submitted_at);

          if (isNaN(dateObj.getTime())) return acc;

          const date = dateObj.toLocaleDateString();

          const existing = acc.find(d => d.date === date);

          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ date, count: 1 });
          }

          return acc;
        }, [])
    : [];

  const barData = [
    { name: "Pending", value: stats.pending },
    { name: "Under Review", value: stats.under_review },
    { name: "Approved", value: stats.approved },
    { name: "Rejected", value: stats.rejected },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex items-center justify-center text-orange-500 font-semibold">
          Loading Reports...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">

        <h1 className="text-2xl font-bold text-blue-900 mb-6">
          📊 Reports & Analytics
        </h1>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total, color: "border-blue-500" },
            { label: "Pending", value: stats.pending, color: "border-yellow-500" },
            { label: "Under Review", value: stats.under_review, color: "border-purple-500" },
            { label: "Approved", value: stats.approved, color: "border-green-500" },
            { label: "Rejected", value: stats.rejected, color: "border-red-500" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl p-4 shadow-sm border-t-4 ${stat.color}`}
            >
              <p className="text-2xl font-bold text-blue-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* LINE CHART */}
          <div className="bg-white p-4 rounded-xl shadow-sm h-[320px]">
            <h2 className="text-lg font-bold text-blue-900 mb-4">
              Applications Over Time
            </h2>

            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-10">
                No valid application dates found.
              </p>
            )}
          </div>

          {/* BAR CHART */}
          <div className="bg-white p-4 rounded-xl shadow-sm h-[320px]">
            <h2 className="text-lg font-bold text-blue-900 mb-4">
              Applications by Status
            </h2>

            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-10">
                No applications to display.
              </p>
            )}
          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-blue-900 mb-4">
            Detailed Applications
          </h2>

          {applications.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No applications found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-blue-900">{app.id}</td>
                    <td className="py-3 capitalize">{app.type || "-"}</td>
                    <td className="py-3 capitalize">{app.status || "-"}</td>
                    <td className="py-3 text-gray-500">
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}