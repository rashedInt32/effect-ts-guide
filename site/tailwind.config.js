module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tokyo: {
          bg: '#011627',
          fg: '#d6deeb',
          blue: '#7aa2f7',
          purple: '#bb9af7',
          green: '#9ece6a',
          red: '#f7768e',
          orange: '#ff9e64',
          yellow: '#e0af68',
          cyan: '#7dcfff',
          gray: '#565f89',
          dark: '#01111d',
          darker: '#000e1a',
        }
      }
    },
  },
  plugins: [],
}
