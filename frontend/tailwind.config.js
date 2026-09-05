/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#030712",
        foreground: "#f9fafb",
        card: {
          DEFAULT: "rgba(17, 24, 39, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(31, 41, 55, 0.8)",
        },
        fintech: {
          emerald: "#10b981",
          emeraldGlow: "rgba(16, 185, 129, 0.2)",
          blue: "#3b82f6",
          purple: "#8b5cf6",
          amber: "#f59e0b",
          rose: "#f43f5e",
          cyan: "#06b6d4",
          slate: "#0f172a",
          dark: "#0b0f19",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(16, 185, 129, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
