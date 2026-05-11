import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeesPage from './pages/personnel/EmployeesPage';
import EmployeeDetailPage from './pages/personnel/EmployeeDetailPage';
import EmployeeFormPage from './pages/personnel/EmployeeFormPage';
import KPIsPage from './pages/kpis/KPIsPage';
import TrainingsPage from './pages/trainings/TrainingsPage';
import ReportsPage from './pages/rapport/ReportsPage';
import UsersPage from './pages/settings/UsersPage';
import AuditLogsPage from './pages/settings/AuditLogsPage';
import ProfilePage from './pages/settings/ProfilePage';
import ReportingCommercialPage from './pages/commercial/ReportingCommercialPage';
import EvaluationsPage from './pages/evaluations/EvaluationsPage';
import RecruitmentPage from './pages/recruitment/RecruitmentPage';
import OrganigrammePage from './pages/organigramme/OrganigrammePage';
import TeamCalendarPage from './pages/calendar/TeamCalendarPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!['DRH', 'DIRECTION_GENERALE'].includes(user?.role || '')) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="personnel" element={<EmployeesPage />} />
        <Route path="personnel/nouveau" element={<AdminRoute><EmployeeFormPage /></AdminRoute>} />
        <Route path="personnel/:id" element={<EmployeeDetailPage />} />
        <Route path="personnel/:id/modifier" element={<AdminRoute><EmployeeFormPage /></AdminRoute>} />
        <Route path="kpis" element={<KPIsPage />} />
        <Route path="formations" element={<TrainingsPage />} />
        <Route path="evaluations" element={<EvaluationsPage />} />
        <Route path="recrutement" element={<RecruitmentPage />} />
        <Route path="organigramme" element={<OrganigrammePage />} />
        <Route path="calendrier" element={<TeamCalendarPage />} />
        <Route path="commercial" element={<ReportingCommercialPage />} />
        <Route path="rapports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="parametres/utilisateurs" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="parametres/audit" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
        <Route path="parametres/profil" element={<ProfilePage />} />
        <Route path="parametres/mot-de-passe" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  );
}
