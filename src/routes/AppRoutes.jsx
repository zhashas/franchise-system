
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Login from "../pages/Login";
import Register from "../pages/Register";

import ApplicantSettings from "../pages/applicant/Settings";
import ApplicantNotifications from "../pages/applicant/Notifications";
import ApplicantDashboard from "../pages/applicant/Dashboard";
import Apply from "../pages/applicant/Apply";
import ApplicantAppointments from "../pages/applicant/Appointments";

import AdminNotifications from "../pages/admin/Notifications";
import AdminReports from "../pages/admin/AdminReports";
import AdminAppointments from "../pages/admin/Appointments";
import AdminSettings from "../pages/admin/Settings";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminApplications from "../pages/admin/Applications";
import AdminApplicationDetail from "../pages/admin/AdminApplicationDetail";

import StaffDashboard from "../pages/staff/Dashboard";
import StaffApplications from "../pages/staff/Applications";
import StaffAppointments from "../pages/staff/Appointments";
import StaffReports from "../pages/staff/Reports";
import StaffNotifications from "../pages/staff/Notifications"; 
import StaffSettings from "../pages/staff/Settings";



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

        {/* Single route for application detail — uses AdminApplicationDetail */}
        <Route
          path="/admin/applications/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminApplicationDetail />
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
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminSettings />
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
        {/* Staff Routes */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/applications"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/appointments"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/reports"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/notifications"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/settings"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffSettings />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}