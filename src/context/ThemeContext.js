import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

const makeColors = (dark) => ({
  bg:          dark ? '#111214' : '#F9F8F6',
  card:        dark ? '#1C1E22' : '#FFFFFF',
  border:      dark ? '#2A2D32' : '#E5E5E7',
  text:        dark ? '#F9F8F6' : '#111214',
  subtext:     dark ? '#A0A4AE' : '#6B7280',
  gold:        '#D4AF37',
  cardShadow:  dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.06)',
  inputBg:     dark ? '#2A2D32' : '#F9F8F6',
  inputText:   dark ? '#FFFFFF' : '#111214',
  sider:       dark ? '#0D0F11' : '#FFFFFF',
  siderBorder: dark ? '#1C1E22' : '#E5E5E7',
});

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('aivora_theme') === 'dark'
  );

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('aivora_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, colors: makeColors(darkMode) }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
