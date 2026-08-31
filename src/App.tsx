import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NewQuotationPage } from '@/pages/NewQuotationPage';
import { ViewQuotationPage } from '@/pages/ViewQuotationPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ name: 'login' });
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}

function AppRoutes() {
  const { route } = useRouter();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <svg className="h-8 w-8 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (route.name === 'login') {
    if (session) {
      return <DashboardPage />;
    }
    return <LoginPage />;
  }

  if (route.name === 'dashboard') {
    return (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    );
  }

  if (route.name === 'new-quotation') {
    return (
      <ProtectedRoute>
        <NewQuotationPage />
      </ProtectedRoute>
    );
  }

  if (route.name === 'view-quotation') {
    return (
      <ProtectedRoute>
        <ViewQuotationPage id={route.id} />
      </ProtectedRoute>
    );
  }

  return <LoginPage />;
}

export default function App() {
  return <AppRoutes />;
}
