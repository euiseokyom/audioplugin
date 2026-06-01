/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        "card-hover":
          "0 20px 32px -4px rgba(0,0,0,0.40), 0 10px 18px -4px rgba(0,0,0,0.28), 6px 0 14px -6px rgba(0,0,0,0.18), -6px 0 14px -6px rgba(0,0,0,0.18), 0 -4px 10px -6px rgba(0,0,0,0.10)",
      },
      keyframes: {
        "bell-swing": {
          "0%":   { transform: "rotate(0deg)" },
          "15%":  { transform: "rotate(22deg)" },
          "35%":  { transform: "rotate(-18deg)" },
          "55%":  { transform: "rotate(12deg)" },
          "70%":  { transform: "rotate(-7deg)" },
          "85%":  { transform: "rotate(3deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "bell-swing": "bell-swing 0.55s ease-in-out",
      },
    },
  },
  plugins: [require("daisyui")],
};
