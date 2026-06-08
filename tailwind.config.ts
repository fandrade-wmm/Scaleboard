import type { Config } from "tailwindcss";
import { designTokens } from "./lib/design-tokens/tokens";

const { colors, spacing, radii, typography } = designTokens;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — unchanged
        primary:  colors.primary,   // #1856FF
        success:  colors.success,   // #07CA6B
        warning:  colors.warning,   // #E89558
        danger:   colors.danger,    // #EA2143

        // Semantic tokens — driven by CSS vars (adapt to dark theme)
        secondary: "var(--color-secondary)",
        surface:   "var(--color-surface)",
        text:      "var(--color-text)",
        neutral:   "var(--color-neutral)",
        muted:     "var(--color-muted)",
      },
      fontFamily: {
        sans:    ["var(--font-plus-jakarta-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        h1:            typography.h1.fontSize,
        body:          typography.bodyMd.fontSize,
        "label-caps":  typography.labelCaps.fontSize,
      },
      spacing: {
        "sm-token": spacing.sm,
        "md-token": spacing.md,
      },
      borderRadius: {
        "sm-token": radii.sm,
        "md-token": radii.md,
      },
      backdropBlur: {
        glass:    "20px",
        "glass-lg": "32px",
      },
      backgroundColor: {
        "glass-surface":  "var(--glass-bg)",
        "glass-elevated": "var(--glass-bg-elevated)",
        "glass-hover":    "var(--glass-bg-hover)",
        "glass-active":   "var(--glass-bg-active)",
      },
      borderColor: {
        "glass-border":        "var(--glass-border)",
        "glass-border-strong": "var(--glass-border-strong)",
      },
      boxShadow: {
        glass:      "var(--shadow-glass)",
        "glass-lg": "var(--shadow-glass-lg)",
        glow:       "var(--shadow-glow)",
        "glow-sm":  "var(--shadow-glow-sm)",
      },
      animation: {
        spin: "spin 0.6s linear infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
