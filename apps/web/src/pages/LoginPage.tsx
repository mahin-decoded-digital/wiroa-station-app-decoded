import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    const result = login(email.trim(), password);
    setLoading(false);
    if (result.ok) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrors({ form: result.error ?? 'Sign in failed.' });
      toast.error(result.error ?? 'Sign in failed.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1467484/pexels-photo-1467484.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          alt="Wiroa Station pastoral landscape"
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, hsl(217 50% 10% / 0.7) 0%, hsl(217 40% 20% / 0.35) 100%)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <p
              className="text-2xl font-semibold tracking-wide"
              style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.06em' }}
            >
              Wiroa Station
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest opacity-70">
              Private Estate Platform
            </p>
          </div>
          <div className="max-w-sm">
            <blockquote
              className="text-xl leading-relaxed opacity-90"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              "The land endures. Governance should be as considered as the landscape it protects."
            </blockquote>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
        style={{ background: 'var(--surface-parchment)' }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile wordmark */}
          <div className="mb-8 lg:hidden text-center">
            <p
              className="text-xl font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.05em' }}
            >
              Wiroa Station
            </p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">
              Private Estate Platform
            </p>
          </div>

          <div className="mb-8">
            <h2
              className="text-2xl font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your estate account.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {errors.form && (
              <p className="text-xs text-destructive rounded bg-destructive/5 px-3 py-2 border border-destructive/20">
                {errors.form}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to the platform?{' '}
            <Link
              to="/signup"
              className="text-primary font-medium hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
