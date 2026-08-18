import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // A restrained, manuscript-and-tilework palette — teal + a sparing
        // brass accent — instead of the flag-color green+gold cliché most
        // "Islamic competition" sites default to.
        paper: "#FAF7F0",
        ink: { DEFAULT: "#1C1B17", soft: "#4A4740", faint: "#8A8577" },
        teal: { DEFAULT: "#1F5C56", deep: "#123F3B", light: "#2C7A72", tint: "#EAF2F1" },
        brass: { DEFAULT: "#A9803F", light: "#C9A468", tint: "#F6EEE0" },
        success: { DEFAULT: "#3F7D5C", tint: "#EAF3EE" },
        danger: { DEFAULT: "#B3402F", tint: "#FBECE9" },
        line: "#E6E1D6",
      },
      fontFamily: {
        display: ["Amiri", "Georgia", "serif"],
        body: ["Cairo", "Tahoma", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,23,0.04), 0 8px 24px -12px rgba(28,27,23,0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
