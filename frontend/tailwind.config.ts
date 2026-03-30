import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EDF7F9',   // page background
          100: '#C5E8ED',   // light surface
          200: '#8BBFC5',   // Blank Slate 7386 — actual paint colour
          300: '#5BA3AD',   // mid accent
          400: '#2D8796',   // primary — buttons, active nav
          500: '#236878',   // primary hover
          600: '#1A5260',   // dark variant
          700: '#103C47',
        },
        danger: '#E05C5C',
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};

export default config;