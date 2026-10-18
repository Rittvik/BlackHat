/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ide: {
          workbench: '#181818',
          sidebar: '#181818',
          editor: '#1e1e1e',
          bg: '#1e1e1e',
          darkest: '#141414',
          panel: '#181818',
          card: '#222222',
          input: '#222222',
          hover: 'rgba(255, 255, 255, 0.06)',
          border: '#2b2b2b',
          borderLight: '#383838',
          text: '#cccccc',
          textBright: '#ffffff',
          muted: '#858585',
          accent: '#0078d4',
          accentHover: '#026ec1',
          blue: '#388bfd',
          cyan: '#58a6ff',
          emerald: '#2ea043',
          amber: '#d29922',
          rose: '#f85149',
          purple: '#bc8cff'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
