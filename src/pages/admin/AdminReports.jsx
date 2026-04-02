// pages/admin/AdminReports.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminLayout from "../../components/AdminLayout";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

const tokens = {
  primary: "#FECE14",
  border: "#E5E7EB",
  paper: "#FFF7ED",
  paperBorder: "#FED7AA",
};

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

  const lineData = Array.isArray(applications)
    ? applications
        .filter(a => a?.submitted_at)
        .reduce((acc, app) => {
          const dateObj = new Date(app.submitted_at);
          if (isNaN(dateObj.getTime())) return acc;

          const date = dateObj.toLocaleDateString();
          const existing = acc.find(d => d.date === date);

          if (existing) existing.count += 1;
          else acc.push({ date, count: 1 });

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
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl p-6 border bg-white text-center text-orange-500 font-semibold">
            Loading Reports...
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER (MATCHING APPLICATION STYLE) */}
        <div
          className="rounded-xl p-6 border"
          style={{
            background: tokens.paper,
            border: `1px solid ${tokens.paperBorder}`,
          }}
        >
          <h1 className="text-xl font-bold text-black tracking-tight">
            REPORTS & ANALYTICS
          </h1>

          <p className="text-sm text-black mt-1">
            Overview of application trends and system performance.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, color: "#000", bg: "#F3F4F6" },
            { label: "Pending", value: stats.pending, color: "#D97706", bg: "#FFFBEB" },
            { label: "Under Review", value: stats.under_review, color: "#2563EB", bg: "#EFF6FF" },
            { label: "Approved", value: stats.approved, color: "#16A34A", bg: "#ECFDF5" },
            { label: "Rejected", value: stats.rejected, color: "#DC2626", bg: "#FEF2F2" },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border"
              style={{
                background: stat.bg,
                borderColor: stat.color,
              }}
            >
              <p className="text-2xl font-semibold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs font-medium mt-1" style={{ color: stat.color }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LINE CHART */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-black mb-4">
              Applications Over Time
            </h2>

            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#FECE14"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-400 py-10">
                No valid application dates found.
              </p>
            )}
          </div>

          {/* BAR CHART */}
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-black mb-4">
              Applications by Status
            </h2>

            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#FECE14" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-gray-400 py-10">
                No applications to display.
              </p>
            )}
          </div>

        </div>

        {/* TABLE (MATCH APPLICATION STYLE) */}
        <div className="bg-white rounded-xl border overflow-hidden">

          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-black">
              Detailed Applications
            </h2>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No applications found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead className="bg-gray-50 text-black">
                  <tr>
                    <th className="text-left px-4 py-2">ID</th>
                    <th className="text-left px-4 py-2">Type</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Submitted</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map(app => (
                    <tr key={app.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-black">{app.id}</td>
                      <td className="px-4 py-3 capitalize text-black">{app.type || "-"}</td>
                      <td className="px-4 py-3 capitalize text-black">{app.status || "-"}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}