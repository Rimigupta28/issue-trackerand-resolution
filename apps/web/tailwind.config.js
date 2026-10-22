/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172b4d",
        muted: "#667085",
        line: "#e5eaf1",
        canvas: "#f6f8fb",
        brand: "#5267e8",
      },
      boxShadow: {
        panel: "0 8px 28px rgba(29, 45, 82, 0.06)",
      },
    },
  },
  plugins: [],
};
