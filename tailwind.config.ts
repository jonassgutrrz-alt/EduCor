import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Vibrant Indigo Primary Palette
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // Vibrant accent
          600: "#4f46e5", // Primary brand button / link
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
          DEFAULT: "#4f46e5",
        },
        // Neutral Slate / Gray backgrounds and surfaces
        surface: {
          light: "#ffffff",
          muted: "#f8fafc", // slate-50
          border: "#e2e8f0", // slate-200
          dark: "#0f172a", // slate-900
        },
      },
      fontFamily: {
        // Modern primary typeface ('Inter' with system fallbacks)
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
        // Alternative modern typeface ('Poppins')
        poppins: [
          "var(--font-poppins)",
          "Poppins",
          "sans-serif",
        ],
      },
      keyframes: {
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
          },
          "50%": {
            boxShadow: "0 0 25px rgba(99, 102, 241, 0.7)",
          },
        },
      },
      animation: {
        // Smooth entrance animation: fades in (0 to 1) and slides upward (translate-y)
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-up-delay-1": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards",
        "fade-in-up-delay-2": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards",
      },
    },
  },
  plugins: [],
};

export default config;
