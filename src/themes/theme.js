export const THEMES = {
  light: {
    primary: '#22c55e',
    background: '#ffffff',
    card: '#f9f9f9',
    text: '#121212',
    accent: '#eab308',
  },
  dark: {
    primary: '#4ade80',
    background: '#121212',
    card: '#1e1e1e',
    text: '#f1f1f1',
    accent: '#facc15',
  },
};

export const getTheme = (isDark = false) => THEMES[isDark ? 'dark' : 'light'];
