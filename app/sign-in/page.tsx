'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, Layers } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      // Store token (localStorage + cookie for middleware)
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      document.cookie = `auth_token=${data.token}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax`;

      router.push('/');
    } catch {
      setError('Unable to connect to server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-screen flex" style={{ background: '#0f172a' }}>
      {/* Left panel – branding */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Top logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#f59e0b' }}
          >
            <Layers size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Stone Co.</span>
        </div>

        {/* Center content */}
        <div className="relative space-y-6">
          <div className="space-y-2">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase">
              Admin Portal
            </p>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Factory Workflow &amp;
              <br />
              <span style={{ color: '#f59e0b' }}>Automation System</span>
            </h1>
          </div>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Manage jobs, track workflows, coordinate workers, and monitor every
            step of your stone operations — all from one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Job Tracking', 'WhatsApp Alerts', 'Live Dashboard', 'Analytics'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium text-amber-300 border"
                style={{ borderColor: '#f59e0b44', background: '#f59e0b11' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <p className="relative text-slate-600 text-sm">
          © {new Date().getFullYear()} Stone Co. All rights reserved.
        </p>
      </div>

      {/* Right panel – sign-in form */}
      <div className="flex-1 h-full flex items-center justify-center p-6 lg:p-12" style={{ background: '#f1f5f9' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#f59e0b' }}
            >
              <Layers size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">Stone Co. Admin</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">
                Sign in to access the admin portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={16} className="text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 text-xs font-bold">!</span>
                  </div>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-105 active:scale-[0.99]"
                style={{ background: loading ? '#d97706' : '#f59e0b' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="mt-6 text-center text-xs text-slate-400">
              Access is managed by your administrator.
              <br />
              Contact admin if you need help logging in.
            </p>
          </div>

          {/* Hint for demo */}
          <div className="mt-4 p-3 rounded-xl border border-dashed border-slate-300 bg-white/60 text-center">
            <p className="text-xs text-slate-500">
              <span className="font-mono font-semibold text-slate-700">admin</span>
              {' / '}
              <span className="font-mono font-semibold text-slate-700">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
