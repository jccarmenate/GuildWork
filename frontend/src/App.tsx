import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Spinner } from "./components/Spinner";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// Everything behind the login gate is code-split — a first-time visitor only
// pays for the login screen, not for Recharts, the PDF/report plumbing, etc.
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() =>
  import("./pages/ProjectDetailPage").then((m) => ({ default: m.ProjectDetailPage }))
);
const ClientsPage = lazy(() => import("./pages/ClientsPage").then((m) => ({ default: m.ClientsPage })));
const TeamPage = lazy(() => import("./pages/TeamPage").then((m) => ({ default: m.TeamPage })));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));
const AuditLogPage = lazy(() => import("./pages/AuditLogPage").then((m) => ({ default: m.AuditLogPage })));

export function App() {
  return (
    <Suspense fallback={<Spinner label="Loading..." />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route
            path="/clients"
            element={
              <ProtectedRoute allow={["ADMIN", "PROJECT_MANAGER"]}>
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/team" element={<TeamPage />} />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allow={["ADMIN", "PROJECT_MANAGER"]}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute allow={["ADMIN"]}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
