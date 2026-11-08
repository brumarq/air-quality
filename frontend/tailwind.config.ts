import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"
import { tokens } from "./theme/tokens"

const cssVar = (name: string) => `hsl(var(--${name}))`

export default {
  darkMode: ["class"],
  // Every folder with components. A folder missing here silently loses its classes.
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./map/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    // Replaces Tailwind's palette rather than extending it, so only these colours exist:
    // the shadcn CSS variables plus the semantic tokens. An off-palette class like
    // text-red-500 isn't generated, and lint (tailwindcss/no-custom-classname) rejects it.
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      border: cssVar("border"),
      input: cssVar("input"),
      ring: cssVar("ring"),
      background: cssVar("background"),
      foreground: cssVar("foreground"),
      primary: { DEFAULT: cssVar("primary"), foreground: cssVar("primary-foreground") },
      secondary: { DEFAULT: cssVar("secondary"), foreground: cssVar("secondary-foreground") },
      destructive: { DEFAULT: cssVar("destructive"), foreground: cssVar("destructive-foreground") },
      muted: { DEFAULT: cssVar("muted"), foreground: cssVar("muted-foreground") },
      accent: { DEFAULT: cssVar("accent"), foreground: cssVar("accent-foreground") },
      popover: { DEFAULT: cssVar("popover"), foreground: cssVar("popover-foreground") },
      card: { DEFAULT: cssVar("card"), foreground: cssVar("card-foreground") },

      brand: tokens.ui.brand,
      live: tokens.ui.live,
      ink: { strong: tokens.ui.textStrong, soft: tokens.ui.textSoft, faint: tokens.ui.textFaint },
      limit: { today: tokens.limit.today, target: tokens.limit.target2030 },
      "bar-track": tokens.chart.barTrack,
      no2: { "above-target": tokens.no2.aboveTarget, "below-target": tokens.no2.belowTarget },
      study: {
        "hot-label": tokens.heat.study.hotLabel,
        "cool-label": tokens.heat.study.coolLabel,
        "separation-line": tokens.heat.study.separationLine,
        "separation-text": tokens.heat.study.separationText,
      },
      notice: { DEFAULT: tokens.ui.noticeBackground, foreground: tokens.ui.noticeText },
      control: tokens.ui.controlBackground,
      scrim: tokens.ui.hoverScrim,
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config
