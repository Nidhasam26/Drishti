import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ConnectivityProvider } from "./context/ConnectivityContext.jsx";
import { SyncProvider } from "./context/SyncContext.jsx";
import { PatientProvider } from "./context/PatientContext.jsx";
import { AppointmentProvider } from "./context/AppointmentContext.jsx";
import { seedDBIfEmpty } from "./data/db.js";
import { DEMO_PATIENTS, DEMO_SCANS, DEMO_APPOINTMENTS } from "./data/seedData.js";

import ConnectivityBanner from "./components/ui/ConnectivityBanner.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NewScan from "./pages/NewScan.jsx";
import ScanResult from "./pages/ScanResult.jsx";
import PatientList from "./pages/PatientList.jsx";
import PatientDetail from "./pages/PatientDetail.jsx";
import AppointmentsList from "./pages/AppointmentsList.jsx";
import BookAppointment from "./pages/BookAppointment.jsx";
import AppointmentDetail from "./pages/AppointmentDetail.jsx";
import DistrictAnalytics from "./pages/DistrictAnalytics.jsx";
import DatasetExplorer from "./pages/DatasetExplorer.jsx";
import ClinicalValidation from "./pages/ClinicalValidation.jsx";
import Settings from "./pages/Settings.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import NotFound from "./pages/NotFound.jsx";

// Role-based route guard
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#061a22",
          color: "#38bdf8",
          fontFamily: 'var(--font-heading, "Figtree", sans-serif)',
          fontWeight: 600,
        }}
      >
        Verifying Session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppContent() {
  const { isLoading } = useAuth();
  const [dbSeeded, setDbSeeded] = useState(false);

  useEffect(() => {
    seedDBIfEmpty(DEMO_PATIENTS, DEMO_SCANS, DEMO_APPOINTMENTS).then(() => {
      setDbSeeded(true);
    });
  }, []);

  if (isLoading || !dbSeeded) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#061a22",
          color: "#38bdf8",
          fontFamily: 'var(--font-heading, "Figtree", sans-serif)',
          fontWeight: 600,
        }}
      >
        Initializing DRISHTI AI Engine...
      </div>
    );
  }

  return (
    <>
      <ConnectivityBanner />
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Home */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Scans */}
        <Route
          path="/scan/new"
          element={
            <ProtectedRoute allowedRoles={["patient", "user", "admin", "doctor"]}>
              <NewScan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scan/:id"
          element={
            <ProtectedRoute>
              <ScanResult />
            </ProtectedRoute>
          }
        />

        {/* Appointments — Preserved Exactly */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={["patient", "user", "admin", "doctor"]}>
              <AppointmentsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/book"
          element={
            <ProtectedRoute allowedRoles={["patient", "user", "admin", "doctor"]}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/:id"
          element={
            <ProtectedRoute allowedRoles={["patient", "user", "admin", "doctor"]}>
              <AppointmentDetail />
            </ProtectedRoute>
          }
        />

        {/* Patients */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={["patient", "user", "admin", "doctor"]}>
              <PatientList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute>
              <PatientDetail />
            </ProtectedRoute>
          }
        />

        {/* District Analytics */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin", "user", "doctor"]}>
              <DistrictAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Dataset Explorer */}
        <Route
          path="/dataset"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <DatasetExplorer />
            </ProtectedRoute>
          }
        />

        {/* Clinical Validation */}
        <Route
          path="/validation"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <ClinicalValidation />
            </ProtectedRoute>
          }
        />

        {/* System Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["patient", "user", "admin", "doctor"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ConnectivityProvider>
      <SyncProvider>
        <AuthProvider>
          <PatientProvider>
            <AppointmentProvider>
              <AppContent />
            </AppointmentProvider>
          </PatientProvider>
        </AuthProvider>
      </SyncProvider>
    </ConnectivityProvider>
  );
}
