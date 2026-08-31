import { useEffect, useState, type FormEvent } from 'react';
import { Mail, Lock, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginPage() {
  const { signIn, signUp, session, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (session && !authLoading) {
      navigate({ name: 'dashboard' });
    }
  }, [session, authLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    if (isSignUp) {
      const { error } = await signUp(email.trim(), password);
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        setInfo('Account created! You can now sign in.');
        setIsSignUp(false);
        setPassword('');
      }
    } else {
      const { error } = await signIn(email.trim(), password);
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        navigate({ name: 'dashboard' });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/20">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotations</h1>
          <p className="mt-1 text-sm text-slate-500">Software Quotation Management System</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <h2 className="mb-1 text-xl font-bold text-slate-900">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            {isSignUp ? 'Sign up to start managing quotations.' : 'Sign in to manage your quotations.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-4 w-4" />}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {info}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {isSignUp ? 'Create Account' : 'Sign In'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp((v) => !v);
                setError(null);
                setInfo(null);
              }}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Protected by Supabase Authentication & Row Level Security
        </p>
      </div>
    </div>
  );
}
