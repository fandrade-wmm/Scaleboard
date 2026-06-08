import { Inter, Space_Grotesk } from "next/font/google";

/**
 * Base body font — Inter variable.
 * Used for all body text, nav, buttons, and UI elements.
 */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

/**
 * Label / eyebrow font — Space Grotesk.
 * Used for section labels, badges, CAPS UI labels.
 */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

/**
 * Display / hero font — Satoshi Black (weight 900 only).
 * Loaded locally from /public/fonts/satoshi-black.woff2
 * Place the file there to activate. Falls back to Inter if absent.
 * ⚠ Never use font-display with any weight other than 900.
 */
// Satoshi is declared in globals.css via @font-face to avoid Next.js local-font path issues.
