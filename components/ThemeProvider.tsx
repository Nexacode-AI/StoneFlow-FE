'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeCtxType {
  dark: boolean;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxType>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') === 'dark';
    setDark(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggle = () => {
    setDark(d => {
      const next = !d;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  return <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
