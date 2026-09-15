/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        space: {
          50: '#f0f7ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#1d4ed8',
          750: '#10274a',
          800: '#0d203e',
          850: '#08172f',
          900: '#051022',
          950: '#030816',
          975: '#02050e',
        }
      },
      fontFamily: {
        sans: ['Prompt', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Prompt', 'sans-serif'],
        prompt: ['Prompt', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.005em',
        normal: '0.018em',
        wide: '0.035em',
        wider: '0.06em',
        widest: '0.12em',
      },
      lineHeight: {
        relaxed: '1.68',
        loose: '1.85',
      }
    },
  },
  plugins: [],
}
