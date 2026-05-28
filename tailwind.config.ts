import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        suave: "0 20px 60px rgba(50, 20, 0, 0.15)"
      }
    }
  },
  plugins: []
};

export default config;
