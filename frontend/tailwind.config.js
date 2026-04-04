/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f9f9f7",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#f1f1ef",
        "inverse-primary": "#a4c9ff",
        "inverse-surface": "#2f3130",
        "on-background": "#1a1c1b",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "on-primary-container": "#c1d9ff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#64635e",
        "on-surface": "#1a1c1b",
        "on-surface-variant": "#424751",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#aee97f",
        outline: "#727782",
        "outline-variant": "#c2c6d2",
        primary: "#004782",
        "primary-container": "#185fa5",
        "primary-fixed": "#d4e3ff",
        secondary: "#5f5e5a",
        "secondary-container": "#e2dfda",
        surface: "#f9f9f7",
        "surface-bright": "#f9f9f7",
        "surface-container": "#eeeeec",
        "surface-container-high": "#e8e8e6",
        "surface-container-highest": "#e2e3e1",
        "surface-container-low": "#f4f4f2",
        "surface-container-lowest": "#ffffff",
        "surface-dim": "#dadad8",
        tertiary: "#265000",
        "tertiary-container": "#386a0d",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        ambient: '0 12px 32px rgba(26, 28, 27, 0.04)',
      },
      backgroundImage: {
        'cta-gradient': 'linear-gradient(135deg, #004782, #185fa5)',
      }
    },
  },
  plugins: [],
};