import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount (client-side only)
  useEffect(() => {
    setMounted(true);
    // Check if there's a saved theme preference or use system preference
    const savedTheme = document.documentElement.classList.contains('light') ? 'light' : 
                      document.documentElement.classList.contains('dark') ? 'dark' :
                      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(savedTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(savedTheme);
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    mounted
  };
} 