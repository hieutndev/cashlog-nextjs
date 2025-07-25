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
        "84": "21rem",
        "88": "22rem",
        "92": "23rem",
        "94": "23.5rem",
        "100": "25rem",
        "104": "26rem",
        "108": "27rem",
        "112": "28rem",
        "116": "29rem",
        "120": "30rem",
        "124": "31rem",
        "128": "32rem",
      },
      width: {
        "84": "21rem",
        "88": "22rem",
        "92": "23rem",
        "94": "23.5rem",
        "100": "25rem",
        "104": "26rem",
        "108": "27rem",
        "112": "28rem",
        "116": "29rem",
        "120": "30rem",
        "124": "31rem",
        "128": "32rem",
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