import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './routes/RequireAuth';
import { RequireRole } from './routes/RequireRole';
import { PublicOnly } from './routes/PublicOnly';
import { canAccessIntercom, canAccessLogs, canAccessParking, canAccessProfile, canAccessUsers } from './lib/rbac';
import LoginPage from './pages/LoginPage';
import Layout from './layouts/Layout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import CCTVPage from './pages/CCTVPage';
import ParkingPage from './pages/ParkingPage';
import IntercomPage from './pages/IntercomPage';
import LogsPage from './pages/LogsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import DownloadPage from './pages/DownloadPage';

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: '/login',
        element: (
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        ),
      },
      {
        element: (
          <RequireAuth>
            <Layout />
          </RequireAuth>
        ),
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          {
            path: '/users',
            element: (
              <RequireRole allow={canAccessUsers}>
                <UsersPage />
              </RequireRole>
            ),
          },
          { path: '/cctv', element: <CCTVPage /> },
          {
            path: '/parking',
            element: (
              <RequireRole allow={canAccessParking}>
                <ParkingPage />
              </RequireRole>
            ),
          },
          // { path: '/gate-control', element: <GateControlPage /> },
          {
            path: '/intercom',
            element: (
              <RequireRole allow={canAccessIntercom}>
                <IntercomPage />
              </RequireRole>
            ),
          },
          {
            path: '/logs',
            element: (
              <RequireRole allow={canAccessLogs}>
                <LogsPage />
              </RequireRole>
            ),
          },
          // { path: '/settings', element: <SettingsPage /> },
          {
            path: '/profile',
            element: (
              <RequireRole allow={canAccessProfile}>
                <ProfilePage />
              </RequireRole>
            ),
          },
        ],
      },
      { path: '/download', element: <DownloadPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
