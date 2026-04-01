import FranchiseRenewal from "../pages/applicant/FranchiseRenewal";
import ApplicantSettings from "../pages/applicant/Settings";
import ApplicantNotifications from "../pages/applicant/Notifications";
import AdminNotifications from "../pages/admin/Notifications";
import AdminViewApplication from "../pages/admin/ViewApplication";
import ApplicantAppointments from "../pages/applicant/Appointments";
import StaffDashboard from "../pages/staff/Dashboard";
import AdminReports from "../pages/admin/Reports";
import AdminAppointments from "../pages/admin/Appointments";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import Login from "../pages/Login";
import Register from "../pages/Register";

import AdminDashboard from "../pages/admin/Dashboard";
import ApplicantDashboard from "../pages/applicant/Dashboard";
import Apply from "../pages/applicant/Apply";
import AdminApplications from "../pages/admin/Applications";

// Protected Route
function ProtectedRoute({ children, allowedRoles }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(profile?.role);
      setLoading(false);
    };

    getRole();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-orange-500 font-semibold">
        Loading...
      </div>
    );

  if (!role || !allowedRoles.includes(role)) return <Navigate to="/login" />;

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/applications/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminViewApplication />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminNotifications />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Applicant Routes */}
        <Route
          path="/applicant/dashboard"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant/apply"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <Apply />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant/appointments"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant/notifications"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantNotifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant/settings"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant/franchise-renewal"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <FranchiseRenewal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}