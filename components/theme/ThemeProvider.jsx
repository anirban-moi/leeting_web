'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'dark',
  mounted: false,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      return localStorage.getItem('leeting_theme') || 'system';
    } catch {
      return 'system';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem('leeting_theme');
      if (saved === 'light') return 'light';
      if (saved === 'dark') return 'dark';
      if (document.documentElement.classList.contains('light')) return 'light';
      if (document.documentElement.classList.contains('dark')) return 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  const [mounted, setMounted] = useState(false);

  // Load initial theme from localStorage and sync state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('leeting_theme');
      if (saved && ['dark', 'light', 'system'].includes(saved)) {
        setThemeState(saved);
        let active = saved;
        if (saved === 'system') {
          active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        setResolvedTheme(active);
      }
    } catch (e) {
      console.warn('Failed to read theme from localStorage', e);
    }
    setMounted(true);
  }, []);

  // Update DOM classes and resolve theme
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let active = theme;
      if (theme === 'system') {
        active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      setResolvedTheme(active);

      if (active === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    if (!['dark', 'light', 'system'].includes(newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem('leeting_theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
