
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],

  theme: {
    extend: {
      // AeroRUL brand colors
      colors: {
        primary: {
          DEFAULT: "#0B1F3A",
          50: "#EEF2F7",
          100: "#D8E0EC",
          600: "#132C52",
          700: "#0B1F3A",
          800: "#081730",
          900: "#050F20",
        },

        accent: {
          DEFAULT: "#2D9CDB",
          50: "#EAF6FD",
          100: "#CDEAFB",
          600: "#2589C2",
        },

        // Semantic status colors
        success: "#27AE60",
        warning: "#F2C94C",
        critical: "#EB5757",

        // Neutral UI colors
        neutral: {
          50: "#F8FAFC",
          200: "#E5E7EB",
          500: "#64748B",
        },
      },

      // Typography
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      // Shared shape and spacing
      borderRadius: {
        DEFAULT: "12px",
      },

      spacing: {
        4.5: "18px",
      },
    },
  },

  plugins: [],
};
