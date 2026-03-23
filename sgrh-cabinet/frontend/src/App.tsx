import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeesPage from './pages/personnel/EmployeesPage';
import EmployeeDetailPage from './pages/personnel/EmployeeDetailPage';
import EmployeeFormPage from './pages/personnel/EmployeeFormPage';
import KPIsPage from './pages/kpis/KPIsPage';
import TrainingsPage from './pages/trainings/TrainingsPage';
import ReportsPage from './pages/rapport/ReportsPage';
import UsersPage from './pages/settings/UsersPage';
import AuditLogsPage from './pages/settings/AuditLogsPage';
import ReportingCommercialPage from './pages/commercial/ReportingCommercialPage';

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
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="personnel" element={<EmployeesPage />} />
        <Route path="personnel/nouveau" element={<AdminRoute><EmployeeFormPage /></AdminRoute>} />
        <Route path="personnel/:id" element={<EmployeeDetailPage />} />
        <Route path="personnel/:id/modifier" element={<AdminRoute><EmployeeFormPage /></AdminRoute>} />
        <Route path="kpis" element={<KPIsPage />} />
        <Route path="formations" element={<TrainingsPage />} />
        <Route path="commercial" element={<ReportingCommercialPage />} />
        <Route path="rapports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="parametres/utilisateurs" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="parametres/audit" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
