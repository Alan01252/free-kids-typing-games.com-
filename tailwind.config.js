/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layouts/**/*.{html,js}",
    "./content/**/*.{html,md}",
    "./static/js/**/*.{js,ts}",
    "./assets/js/**/*.{js,ts}",
    "./data/**/*.{yaml,yml,toml,json}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
