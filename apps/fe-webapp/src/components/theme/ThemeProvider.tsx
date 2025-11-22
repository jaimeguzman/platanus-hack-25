'use client';

import { useTheme } from '@/hooks/useTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Just initialize the theme hook - it handles the DOM updates
  useTheme();

  return <>{children}</>;
}

