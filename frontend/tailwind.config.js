/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#221D16",
          700: "#3A3226",
          600: "#4F4636",
          500: "#6B6252",
          400: "#9B9382",
          200: "#DEDACE",
          100: "#EDEAE1"
        },
        parchment: {
          DEFAULT: "#F1EDE1",
          dark: "#E7E0CB"
        },
        surface: "#FFFFFF",
        line: "#E1D9C6",
        brass: {
          50: "#FBF3E7",
          100: "#F3E1C0",
          400: "#B98A3E",
          500: "#96662A",
          600: "#7E5320",
          700: "#634117"
        }
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Archivo", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: []
};
