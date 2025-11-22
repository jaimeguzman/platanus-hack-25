/**
 * Spacing constants - Following Tailwind and shadcn standards
 * NO MAGIC NUMBERS - All spacing values are defined here
 */
export const SPACING = {
  // Header
  header: {
    height: 'h-12',
    paddingX: 'px-6 lg:px-8',
    gap: 'gap-6',
  },
  
  // Sidebar
  sidebar: {
    width: 'w-64',
    widthCollapsed: 'w-16',
    paddingX: 'px-5',
    paddingY: 'py-6',
    gap: 'gap-4',
    logoHeight: 'h-16',
    contentPaddingX: 'px-4',
  },
  
  // Buttons
  button: {
    sm: {
      height: 'h-9',
      paddingX: 'px-3',
      fontSize: 'text-sm',
    },
    md: {
      height: 'h-10',
      paddingX: 'px-4',
      fontSize: 'text-sm',
    },
    icon: {
      size: 'h-9 w-9',
    },
  },
  
  // Inputs
  input: {
    height: 'h-10',
    paddingX: 'px-3',
    paddingLeftWithIcon: 'pl-10',
    paddingRightWithIcon: 'pr-10',
    fontSize: 'text-sm',
    iconSize: 'w-4 h-4',
    iconLeft: 'left-3',
    iconRight: 'right-3',
  },
  
  // Gaps
  gap: {
    xs: 'gap-0.5',
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-4',
    xl: 'gap-6',
  },
  
  // Separators
  separator: {
    height: 'h-6',
    width: 'w-px',
    marginX: 'mx-0.5',
  },
  
  // View mode buttons
  viewMode: {
    container: {
      padding: 'p-0.5',
      gap: 'gap-0.5',
    },
    button: {
      height: 'h-8',
      paddingX: 'px-3',
    },
  },
  
  // Breadcrumbs
  breadcrumb: {
    gap: 'gap-2.5',
    maxWidth: 'max-w-[200px]',
  },
  
  // Search
  search: {
    maxWidth: 'max-w-md',
    marginX: 'mx-6 lg:mx-8',
  },
} as const;

