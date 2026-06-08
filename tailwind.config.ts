import type { Config } from "tailwindcss";
import { designTokens } from "./lib/design-tokens/tokens";

const { radii, spacing } = designTokens;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // WMM Brand palette
        primary:  "#8fccb6",   // Pearl Aqua
        "primary-dark": "#5aaa94",
        navy:     "#1f2d56",   // Space Cadet
        success:  "#8fccb6",
        warning:  "#E89558",
        danger:   "#e05c6a",

        // Semantic tokens — CSS vars for dark mode
        secondary: "var(--color-secondary)",
        surface:   "var(--color-surface)",
        text:      "var(--color-text)",
        neutral:   "var(--color-bg)",
        muted:     "var(--color-muted)",
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Satoshi", "var(--font-inter)", "ui-sans-serif", "sans-serif"],
        label:   ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
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
        glass:     "20px",
        "glass-lg":"32px",
      },
      backgroundColor: {
        "glass-surface":  "var(--glass-bg)",
        "glass-elevated": "var(--glass-bg-elevated)",
        "glass-hover":    "var(--glass-bg-hover)",
        "glass-active":   "var(--glass-bg-active)",
      },
      borderColor: {
        "glass-border":       "var(--glass-border)",
        "glass-border-strong":"var(--glass-border-strong)",
        "glass-border-teal":  "var(--glass-border-teal)",
      },
      boxShadow: {
        glass:      "var(--shadow-glass)",
        "glass-lg": "var(--shadow-glass-lg)",
        glow:       "var(--shadow-glow)",
        "glow-sm":  "var(--shadow-glow-sm)",
        1:          "var(--shadow-1)",
        2:          "var(--shadow-2)",
        3:          "var(--shadow-3)",
        4:          "var(--shadow-4)",
      },
    },
  },
  plugins: [],
};

export default config;
