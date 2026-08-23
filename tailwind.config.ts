import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#4267B2",
          primaryDark: "#365899",
          primaryDeep: "#2A4880",
          primaryLight: "#5C7EC7",
          blue: "#4267B2",
          lightBlue: "#5C7EC7",
          gold: "#B8860B",
          goldLight: "#D4AF37",
          goldDeep: "#996F08",
          charcoal: "#333333",
          navy: "#0F172A",
          deepNavy: "#1E293B",
          surfaceBlue: "#F0F4FA",
        },
        surface: {
          subtle: "#F8FAFC",
          blue: "#F0F4FA",
          card: "#FFFFFF",
          bg: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)",
        card: "0 4px 12px -2px rgba(66, 103, 178, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px -3px rgba(66, 103, 178, 0.35)",
        goldGlow: "0 0 18px -3px rgba(184, 134, 11, 0.35)",
      },
      borderRadius: {
        'ios': '1.25rem',
      }
    },
  },
  plugins: [],
};

export default config;
