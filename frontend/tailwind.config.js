module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Couleurs principales
        "primary-green": "#2e7d32",
        "primary-light": "#4caf50",
        "primary-dark": "#1b5e20",
        "teal-500": "#0d9488",
        "teal-600": "#0f766e",
        "teal-700": "#115e59",
        "teal-100": "#ccfbf1",

        // Couleurs secondaires
        "secondary-blue": "#2196f3",
        "accent-pink": "#ff4081",
        "accent-yellow": "#ffc107",

        // Neutres
        white: "#ffffff",
        "gray-50": "#fafafa",
        "gray-100": "#f5f5f5",
        "gray-300": "#e0e0e0",
        "gray-500": "#9e9e9e",
        "gray-700": "#616161",
        "gray-900": "#212121",

        // Statuts
        success: "#4caf50",
        warning: "#ff9800",
        error: "#f44336",
        info: "#2196f3",
      },
    },
  },
  plugins: [],
};