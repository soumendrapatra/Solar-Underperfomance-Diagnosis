import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: {
          DEFAULT: "#111111",
          muted: "#161616",
          subtle: "#1c1c1c",
          highlight: "#262626",
        },
        border: {
          DEFAULT: "#222222",
          dark: "#181818",
          light: "#2f2f2f",
          active: "#444444",
        },
        text: {
          primary: "#e5e5e5",
          secondary: "#888888",
          muted: "#555555",
        },
        "active-green": "#00ff41",
        "warning-amber": "#ffb000",
        "fault-red": "#ff3333",
        "expected-gray": "#555555",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "0px",
      },
      boxShadow: {
        none: "none",
        DEFAULT: "none",
        sm: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
      },
    },
  },
  plugins: [],
};

export default config;
