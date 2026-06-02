/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        "base-100":
          "color-mix(in oklch, var(--color-base-100) calc(<alpha-value> * 100%), transparent)",
        "base-200":
          "color-mix(in oklch, var(--color-base-200) calc(<alpha-value> * 100%), transparent)",
        "base-300":
          "color-mix(in oklch, var(--color-base-300) calc(<alpha-value> * 100%), transparent)",
        "base-content":
          "color-mix(in oklch, var(--color-base-content) calc(<alpha-value> * 100%), transparent)",
        primary:
          "color-mix(in oklch, var(--color-primary) calc(<alpha-value> * 100%), transparent)",
        "primary-content":
          "color-mix(in oklch, var(--color-primary-content) calc(<alpha-value> * 100%), transparent)",
        secondary:
          "color-mix(in oklch, var(--color-secondary) calc(<alpha-value> * 100%), transparent)",
        "secondary-content":
          "color-mix(in oklch, var(--color-secondary-content) calc(<alpha-value> * 100%), transparent)",
        accent:
          "color-mix(in oklch, var(--color-accent) calc(<alpha-value> * 100%), transparent)",
        "accent-content":
          "color-mix(in oklch, var(--color-accent-content) calc(<alpha-value> * 100%), transparent)",
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
          "0%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(22deg)" },
          "35%": { transform: "rotate(-18deg)" },
          "55%": { transform: "rotate(12deg)" },
          "70%": { transform: "rotate(-7deg)" },
          "85%": { transform: "rotate(3deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
      },
      animation: {
        "bell-swing": "bell-swing 0.55s ease-in-out",
      },
    },
  },
  plugins: [
    require("daisyui").default({
      themes: ["silk --default"],
    }),
  ],
};
