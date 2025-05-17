import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  // Initialize theme based on Telegram WebApp theme
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      // Check if Telegram provides a color scheme
      const telegramTheme = tg.colorScheme || 'light';
      setTheme(telegramTheme);
      console.log('ThemeContext: Initial Telegram theme:', telegramTheme);

      // Listen for theme changes from Telegram
      const handleThemeChange = () => {
        const newTheme = tg.colorScheme || 'light';
        console.log('ThemeContext: Telegram theme changed to:', newTheme);
        setTheme(newTheme);
      };

      // Add event listener for theme changes
      tg.onEvent('themeChanged', handleThemeChange);

      // Clean up event listener
      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    } else {
      // Fallback for when not running in Telegram
      console.log('ThemeContext: Not running in Telegram WebApp, using default theme');

      // Check for system preference
      const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDarkMode ? 'dark' : 'light');

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
