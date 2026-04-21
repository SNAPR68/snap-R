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
        // shadcn semantic tokens — resolved from CSS custom properties
        background: "var(--surface)",
        foreground: "var(--on-surface)",
        card: {
          DEFAULT: "var(--surface-container-low)",
          foreground: "var(--on-surface)",
        },
        popover: {
          DEFAULT: "var(--surface-container-high)",
          foreground: "var(--on-surface)",
        },
        primary: {
          DEFAULT: "var(--gold)",
          foreground: "#0E0E0E",
          container: "var(--gold-warm)",
        },
        secondary: {
          DEFAULT: "var(--surface-container)",
          foreground: "var(--on-surface)",
        },
        muted: {
          DEFAULT: "var(--surface-container)",
          foreground: "var(--on-surface-muted)",
        },
        accent: {
          DEFAULT: "var(--surface-container-high)",
          foreground: "var(--on-surface)",
        },
        destructive: {
          DEFAULT: "hsl(0 62.8% 30.6%)",
          foreground: "hsl(0 0% 98%)",
        },
        border: "rgba(211, 197, 174, 0.12)",
        input: "rgba(211, 197, 174, 0.15)",
        ring: "var(--gold)",

        // Design system surface tokens (used directly in components)
        surface: {
          DEFAULT: "var(--surface)",
          base: "var(--surface-base)",
          "container-low": "var(--surface-container-low)",
          container: "var(--surface-container)",
          "container-high": "var(--surface-container-high)",
          "container-highest": "var(--surface-container-highest)",
        },

        // Gold palette
        gold: {
          DEFAULT: "var(--gold)",
          bright: "var(--gold-bright)",
          warm: "var(--gold-warm)",
          muted: "var(--gold-muted)",
        },

        // On-surface text
        "on-surface": {
          DEFAULT: "var(--on-surface)",
          muted: "var(--on-surface-muted)",
        },

        "outline-variant": "rgba(211, 197, 174, 0.15)",

        // Legacy aliases (keep for backwards compat with existing components)
        charcoal: {
          DEFAULT: "#1A1A1A",
          soft: "#2C2C2C",
          deep: "#0F0F0F",
          black: "#0B0B0B",
        },
        quartz: {
          light: "#FAFAFA",
          white: "#FFFFFF",
          soft: "#F2F2F2",
          gray: "#E5E7EB",
        },
        mint: {
          DEFAULT: "#86E3C3",
          soft: "#A8F0D4",
          dark: "#4FB892",
        },
        carbon: "#111111",
        cloud: "#6B7280",
        "accent-gold": "var(--gold)",
        "accent-gold-soft": "var(--gold-bright)",
        "accent-gold-dark": "var(--gold-warm)",
        "mint-soft": "var(--mint-soft)",
        "mint-dark": "var(--mint-dark)",
        "text-main": "var(--on-surface)",
        "text-soft": "var(--on-surface-muted)",
      },

      boxShadow: {
        sm: "0 1px 3px rgba(0,0,0,0.3)",
        md: "0 4px 12px rgba(0,0,0,0.4)",
        lg: "0 8px 24px rgba(0,0,0,0.5)",
        xl: "0 16px 40px rgba(0,0,0,0.6)",
        gold: "0 4px 16px rgba(232,168,32,0.35)",
        "gold-lg": "0 8px 32px rgba(232,168,32,0.45)",
        ambient: "0px 24px 48px -12px rgba(0, 0, 0, 0.5)",
        "glow-gold": "0px 8px 32px rgba(232, 168, 32, 0.28)",
        // legacy
        quartz: "0 4px 20px rgba(0,0,0,0.04)",
        mint: "0 4px 12px rgba(134, 227, 195, 0.25)",
        card: "0 2px 14px rgba(0,0,0,0.06)",
      },

      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        editorial: "0.5rem",
      },

      transitionDuration: {
        300: "300ms",
        500: "500ms",
        700: "700ms",
      },

      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
      },

      letterSpacing: {
        tighter: "-0.02em",
        wide: "0.05em",
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
