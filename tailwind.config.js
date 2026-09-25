/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F1E5",
        clean: "#FFFDF8",
        honey: "#D99A19",
        accent: "#F4B928",
        leaf: "#536B43",
        ink: "#292821",
        gold: "#B9A47A",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(41,40,33,0.18)",
      },
    },
  },
  plugins: [],
};
