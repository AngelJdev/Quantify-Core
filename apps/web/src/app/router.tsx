import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { DashboardPage } from '@/features/dashboard/ui/DashboardPage';
import { HabitsPage } from '@/features/habits/ui/HabitsPage';
import { CheckInsPage } from '@/features/checkins/ui/CheckInsPage';
import { AnalyticsPage } from '@/features/analytics/ui/AnalyticsPage';
import { ProfilePage } from '@/features/identity/ui/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'habits',
        element: <HabitsPage />,
      },
      {
        path: 'checkins',
        element: <CheckInsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});
