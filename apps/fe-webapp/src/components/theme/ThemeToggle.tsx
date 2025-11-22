'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';
import { SPACING } from '@/constants/spacing';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'relative text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all',
          SPACING.button.icon.size
        )}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all',
        SPACING.button.icon.size
      )}
    >
      <Sun className={cn(
        'h-4 w-4 absolute rotate-0 scale-100 transition-all duration-300',
        theme === 'dark' && 'rotate-90 scale-0 opacity-0'
      )} aria-hidden="true" />
      <Moon className={cn(
        'h-4 w-4 absolute rotate-90 scale-0 opacity-0 transition-all duration-300',
        theme === 'dark' && 'rotate-0 scale-100 opacity-100'
      )} aria-hidden="true" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

