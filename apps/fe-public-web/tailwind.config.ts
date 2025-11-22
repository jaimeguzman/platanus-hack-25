import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F0F0F',
        foreground: '#E5E5E5',
        card: '#1A1A1A',
        'card-border': '#2A2A2A',
        'text-secondary': '#999999',
        accent: '#3B82F6',
      },
    },
  },
  plugins: [],
};

export default config;
