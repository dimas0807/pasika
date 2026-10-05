/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          DEFAULT: "#18181B",
          dark: "#121110",
          card: "#1F1D1B",
          border: "#2E2A27",
          light: "#27272A",
        },
        darkwood: {
          DEFAULT: "#241C18",
          dark: "#1A1411",
          light: "#342823",
        },
        bronze: {
          DEFAULT: "#C88432",
          light: "#DF9E33",
          dark: "#9E5F18",
          hover: "#DB923A",
        },
        gold: {
          DEFAULT: "#E5A93C",
          light: "#F3C469",
          dark: "#B88225",
        },
        meat: {
          DEFAULT: "#B93429",
          dark: "#92231B",
          light: "#DC4538",
        },
        cream: {
          DEFAULT: "#F7F1E5",
          warm: "#FAF6EE",
          soft: "#F2E8D8",
        },
        warmwhite: "#FFFDF8",
        // Backward compatibility mappings so existing components don't break
        honey: "#C88432",
        accent: "#DC4538",
        leaf: "#5B7C4B",
        ink: "#1C1917",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Plus Jakarta Sans'", "'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(0,0,0,0.45)",
        warm: "0 10px 25px -8px rgba(200, 132, 50, 0.2)",
        glow: "0 0 25px rgba(200, 132, 50, 0.25)",
        "2xs": "0 1px 2px rgba(0,0,0,0.12)",
        xs: "0 1px 3px rgba(0,0,0,0.2)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
