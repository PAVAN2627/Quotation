import { FileText, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';

interface HeaderProps {
  onSignOut?: () => void;
}

export function Header({ onSignOut }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { navigate } = useRouter();

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await signOut();
      navigate({ name: 'login' });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate({ name: 'dashboard' })}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Quotations</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-slate-500">Signed in as</p>
            <p className="max-w-[200px] truncate text-sm font-semibold text-slate-700">
              {user?.email}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 sm:hidden">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
