import type { Config } from "tailwindcss";

/**
 * Design tokens do DESIGN.md (estética OpenCode — monospace creme).
 * Uma única fonte (mono), canvas creme, tinta quase-preta, ramp semântico Apple.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#fdfcfc",
        ink: "#201d1d",
        "ink-deep": "#0f0000",
        charcoal: "#302c2c",
        body: "#424245",
        mute: "#646262",
        stone: "#6e6e73",
        ash: "#9a9898",
        "surface-soft": "#f8f7f7",
        "surface-card": "#f1eeee",
        "surface-dark": "#201d1d",
        "surface-dark-elevated": "#302c2c",
        hairline: "rgba(15,0,0,0.12)",
        "hairline-strong": "#646262",
        accent: "#007aff",
        "accent-hover": "#0056b3",
        "accent-active": "#004085",
        danger: "#ff3b30",
        "danger-hover": "#d70015",
        warning: "#ff9f0a",
        success: "#30d158",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "4px",
        full: "9999px",
      },
      maxWidth: {
        content: "960px",
        frame: "1100px",
      },
      spacing: {
        section: "96px",
      },
      fontSize: {
        "display-xl": ["38px", { lineHeight: "1.5", fontWeight: "700" }],
        "heading-md": ["16px", { lineHeight: "1.5", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "1.5" }],
        "caption-md": ["14px", { lineHeight: "2" }],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        blink: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        blink: "blink 1.1s step-end infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
