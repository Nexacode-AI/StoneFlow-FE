'use client';

import { Bell, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Header({ title, subtitle, action }: HeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // User info from localStorage
  const [userName, setUserName] = useState('Administrator');
  const [userRole, setUserRole] = useState('Admin');

  // Live alert count
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.name) setUserName(u.name);
        if (u.role) setUserRole(u.role);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`);
        const json = await res.json();
        setAlertCount(json?.data?.stats?.alertCount ?? 0);
      } catch {}
    };
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    document.cookie = 'auth_token=; path=/; max-age=0';
    router.push('/sign-in');
  }

  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {action}

        {/* Live alert bell — click to go to /alerts */}
        <button
          onClick={() => router.push('/alerts')}
          title="View alerts"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative pl-1 border-l border-slate-200" ref={dropdownRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: '#f59e0b' }}
            >
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{userName}</p>
              <p className="text-xs text-slate-400 capitalize leading-tight">{userRole.toLowerCase()}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: '#f59e0b' }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{userName}</p>
                    <p className="text-xs text-slate-500 capitalize">{userRole.toLowerCase()} · Stone Co.</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

