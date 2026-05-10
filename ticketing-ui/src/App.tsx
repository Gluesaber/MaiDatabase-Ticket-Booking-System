import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventListPage } from './pages/EventListPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BookingHistoryPage } from './pages/BookingHistoryPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { AdminVenuePage } from './pages/AdminVenuePage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';

type Page = 'events' | 'login' | 'register' | 'history' | 'dashboard' | 'admin-venues' | 'admin-reports' | 'admin-users';

function Router() {
  const { user } = useAuth();

  const defaultPage = (): Page => {
    if (!user) return 'events';
    if (user.role === 'organizer' || user.role === 'admin') return 'dashboard';
    return 'events';
  };

  const [page, setPage] = useState<Page>(defaultPage);

  function navigate(p: string) {
    setPage(p as Page);
  }

  if (page === 'login') return <LoginPage onNavigate={navigate} />;
  if (page === 'register') return <RegisterPage onNavigate={navigate} />;

  if (page === 'history') {
    if (!user) { setPage('login'); return null; }
    return <BookingHistoryPage onNavigate={navigate} />;
  }

  if (page === 'admin-venues') {
    if (!user || user.role !== 'admin') { setPage('dashboard'); return null; }
    return <AdminVenuePage onNavigate={navigate} />;
  }

  if (page === 'admin-reports') {
    if (!user || user.role !== 'admin') { setPage('dashboard'); return null; }
    return <AdminReportsPage onNavigate={navigate} />;
  }

  if (page === 'admin-users') {
    if (!user || user.role !== 'admin') { setPage('dashboard'); return null; }
    return <AdminUsersPage onNavigate={navigate} />;
  }

  if (page === 'dashboard') {
    if (!user) { setPage('login'); return null; }
    if (user.role !== 'organizer' && user.role !== 'admin') { setPage('events'); return null; }
    return <OrganizerDashboardPage onNavigate={navigate} />;
  }

  return <EventListPage onNavigate={navigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
