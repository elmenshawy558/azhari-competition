import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        green: { deep: "#0B4429", DEFAULT: "#146C43", light: "#1E8F5A" },
        gold: { DEFAULT: "#C89B3C", light: "#E4C878" },
        cream: "#FAF6EC",
      },
    },
  },
  plugins: [],
};
export default config;
