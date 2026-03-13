/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#F9A7B0',      // Soft pink - for buttons & accents
        secondary: '#AEC6CF',    // Light blue - main backgrounds
        success: '#B5EAD7',      // Soft green - verified, success states
        accent: '#B3A7C6',       // Soft purple - headers, cards
        light: '#F8F9FA',        // Very light background
      },
    },
  },
  plugins: [],
}
