import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quartz: {
          light: "#FAFAFA",
          white: "#FFFFFF",
          soft: "#F2F2F2",
          gray: "#E5E7EB",
        },
        charcoal: {
          DEFAULT: "#1A1A1A",
          soft: "#2C2C2C",
          deep: "#0F0F0F",
          black: "#0B0B0B",
        },
        gold: {
          DEFAULT: "#F3C969",
          dark: "#E9B949",
          deep: "#D9A93C",
        },
        mint: {
          DEFAULT: "#86E3C3",
          soft: "#A8F0D4",
          dark: "#4FB892",
        },
        carbon: "#111111",
        cloud: "#6B7280",
        // CSS Variables for Light/Dark Theme
        "accent-gold": "var(--accent-gold)",
        "accent-gold-soft": "var(--accent-gold-soft)",
        "accent-gold-dark": "var(--accent-gold-dark)",
        "mint-soft": "var(--mint-soft)",
        "mint-dark": "var(--mint-dark)",
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-soft": "var(--surface-soft)",
        "text-main": "var(--text-main)",
        "text-soft": "var(--text-soft)",
      },

      boxShadow: {
        quartz: "0 4px 20px rgba(0,0,0,0.04)",
        gold: "0 4px 12px rgba(243, 201, 105, 0.3)",
        mint: "0 4px 12px rgba(134, 227, 195, 0.25)",
        card: "0 2px 14px rgba(0,0,0,0.06)",
      },

      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },

      transitionDuration: {
        300: "300ms",
        500: "500ms",
        700: "700ms",
      },

      fontFamily: {
        sans: ["Geist Sans", "Inter", "sans-serif"],
      },

      // Animation improvements
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        "smooth-in": "cubic-bezier(0.4, 0, 1, 1)",
        "smooth-out": "cubic-bezier(0, 0, 0.2, 1)",
        "smooth-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
