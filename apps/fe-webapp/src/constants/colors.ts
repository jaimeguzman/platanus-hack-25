/**
 * Color constants - Using shadcn CSS variables
 * NO HARDCODED COLOR VALUES - All colors reference CSS variables
 */
export const COLORS = {
  // Background colors - use CSS variables
  background: 'bg-background',
  card: 'bg-card',
  popover: 'bg-popover',
  sidebar: 'bg-sidebar-bg',
  
  // Text colors - use CSS variables
  foreground: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  
  // Border colors - use CSS variables
  border: 'border-border',
  input: 'border-input',
  ring: 'ring-ring',
  
  // Interactive states - use CSS variables
  hover: 'hover:bg-accent',
  active: 'bg-accent',
  selected: 'bg-secondary',
} as const;

/**
 * Color utilities for inline styles (when CSS classes aren't enough)
 * These reference CSS variables via hsl() function
 */
export const COLOR_VALUES = {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: 'hsl(var(--card))',
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  muted: 'hsl(var(--muted-foreground))',
  sidebar: 'hsl(var(--sidebar-bg))',
} as const;

