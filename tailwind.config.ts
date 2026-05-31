import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18211d",
        moss: "#184c38",
        leaf: "#2f7d59",
        oat: "#f4f1e8",
        mist: "#edf3ef",
        line: "#d8e0da",
        brass: "#b77c2f"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(24, 33, 29, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
