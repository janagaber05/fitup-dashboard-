import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import CoachLayout from '../components/CoachLayout';
import { useFitupAdmin } from '../components/FitupAdminContext';
import DashboardPage from '../pages/DashboardPage';
import CoachDashboardPage from '../pages/CoachDashboardPage';
import CoachSchedulePage from '../pages/CoachSchedulePage';
import CoachClassesPage from '../pages/CoachClassesPage';
import CoachClientsPage from '../pages/CoachClientsPage';
import CoachMessagesPage from '../pages/CoachMessagesPage';
import CoachProgramsPage from '../pages/CoachProgramsPage';
import CoachAnalyticsPage from '../pages/CoachAnalyticsPage';
import CoachSettingsPage from '../pages/CoachSettingsPage';
import LoginPage from '../pages/LoginPage';
import ContentPage from '../pages/ContentPage';
import UsersPage from '../pages/UsersPage';
import CoachesPage from '../pages/CoachesPage';
import UserIdsPage from '../pages/UserIdsPage';
import PartnershipsPage from '../pages/PartnershipsPage';
import BookingsPage from '../pages/BookingsPage';
import ClassesPage from '../pages/ClassesPage';
import PartnerGymsPage from '../pages/PartnerGymsPage';
import ContractsPage from '../pages/ContractsPage';
import MessagesPage from '../pages/MessagesPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import RevenuePage from '../pages/RevenuePage';
import SettingsPage from '../pages/SettingsPage';
import EmployeesPage from '../pages/EmployeesPage';
import EquipmentPage from '../pages/EquipmentPage';
import FacilitiesPage from '../pages/FacilitiesPage';

function HomeRedirect() {
  const { isAuthenticated, authRole } = useFitupAdmin();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (authRole === 'coach') return <Navigate to="/coach/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function RequireCoachRole() {
  const { isAuthenticated, authRole } = useFitupAdmin();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (authRole !== 'coach') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function RequireAdminArea() {
  const { isAuthenticated, authRole } = useFitupAdmin();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (authRole === 'coach') {
    return <Navigate to="/coach/dashboard" replace />;
  }
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireCoachRole />}>
        <Route element={<CoachLayout />}>
          <Route path="/coach/dashboard" element={<CoachDashboardPage />} />
          <Route path="/coach/schedule" element={<CoachSchedulePage />} />
          <Route path="/coach/classes" element={<CoachClassesPage />} />
          <Route path="/coach/analytics" element={<CoachAnalyticsPage />} />
          <Route path="/coach/clients" element={<CoachClientsPage />} />
          <Route path="/coach/messages" element={<CoachMessagesPage />} />
          <Route path="/coach/programs" element={<CoachProgramsPage />} />
          <Route path="/coach/settings" element={<CoachSettingsPage />} />
        </Route>
      </Route>
      <Route element={<RequireAdminArea />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/content" element={<ContentPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/coaches" element={<CoachesPage />} />
          <Route path="/user-ids" element={<UserIdsPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/partnerships" element={<PartnershipsPage />} />
          <Route path="/partner-gyms" element={<PartnerGymsPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
