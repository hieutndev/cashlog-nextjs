import { heroui } from "@heroui/theme";

/** @type {import("tailwindcss").Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      maxHeight: {
        "84": "21rem"
      }
    }
  },
  darkMode: "class",
  plugins: [heroui({
      themes: {
        light: {
          colors: {
            warning: {
              foreground: "#f2f1ef",
            },
            danger: {
              foreground: "#f2f1ef",
            },
            success: {
              foreground: "#f2f1ef",
            },
          }
        }
      }
    })]
};

module.exports = config;