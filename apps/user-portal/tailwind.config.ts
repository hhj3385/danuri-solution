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
        // DANURI Brand Colors (Local definition - No external CDN)
        danuri: {
          primary: '#1E40AF',
          secondary: '#3B82F6',
          accent: '#06B6D4',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          text: {
            primary: '#1E293B',
            secondary: '#64748B',
            disabled: '#94A3B8',
          },
        },
      },
      fontFamily: {
        // Local fonts only - No Google Fonts CDN
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
