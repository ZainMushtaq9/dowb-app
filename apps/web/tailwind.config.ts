import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101214",
        paper: "#f7f8f5",
        mint: "#2dd4bf",
        coral: "#fb7185"
      },
      boxShadow: {
        soft: "0 12px 40px rgba(16, 18, 20, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
