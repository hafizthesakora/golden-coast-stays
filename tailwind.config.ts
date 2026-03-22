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
        gold: {
          primary: "#c9a961",
          light: "#e8d5a3",
          dark: "#9a7b3c",
        },
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body: ["Poppins", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "30px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
