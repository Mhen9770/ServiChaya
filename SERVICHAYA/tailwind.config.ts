import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#2563EB',
          dark: '#1E40AF',
          light: '#3B82F6',
        },
        accent: {
          green: '#10B981',
          orange: '#F59E0B',
        },
        neutral: {
          background: '#F9FAFB',
          surface: '#FFFFFF',
          border: '#E5E7EB',
          textPrimary: '#111827',
          textSecondary: '#6B7280',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
        'primary-md': '0 4px 14px 0 rgba(37, 99, 235, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
