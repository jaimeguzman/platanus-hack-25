// Elegant Dark Matte Theme - No blue/purple colors
export const theme = {
  // Backgrounds - Matte dark tones
  background: {
    primary: '#0D0D0D',      // Almost black
    secondary: '#141414',     // Slightly lighter
    tertiary: '#1A1A1A',     // Card backgrounds
    elevated: '#1F1F1F',     // Hover states
    border: '#2A2A2A',       // Subtle borders
  },
  
  // Text - High contrast, easy on eyes
  text: {
    primary: '#E5E5E5',       // Almost white
    secondary: '#B8B8B8',     // Medium gray
    muted: '#888888',         // Subtle gray
    disabled: '#666666',      // Very subtle
  },
  
  // Accent colors - Warm, natural tones
  accent: {
    green: '#4A5C4A',         // Muted forest green
    orange: '#8B5A2B',        // Warm earth orange
    amber: '#A67C52',         // Sophisticated amber
    red: '#8B4B4B',          // Muted red for warnings
  },
  
  // Interactive states
  interactive: {
    hover: '#252525',         // Subtle hover
    active: '#2F2F2F',        // Active state
    selected: '#3A3A3A',      // Selected items
  },
  
  // Status colors
  status: {
    success: '#4A5C4A',       // Muted green
    warning: '#8B5A2B',       // Muted orange
    error: '#8B4B4B',        // Muted red
    info: '#5A6A7A',         // Muted blue-gray (not blue!)
  }
};

// Utility function to apply theme
export const getThemeColor = (path: string): string => {
  const keys = path.split('.');
  let current: Record<string, unknown> | string = theme;

  for (const key of keys) {
    if (typeof current === 'object' && current !== null && key in current) {
      current = current[key] as Record<string, unknown> | string;
    } else {
      return theme.text.primary;
    }
  }

  return typeof current === 'string' ? current : theme.text.primary;
};