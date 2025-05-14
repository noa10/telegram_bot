import React, { createContext, useContext, useEffect, useState } from 'react';

// Create context
const TelegramContext = createContext(null);

// Context provider
export const TelegramProvider = ({ children }) => {
  const [telegram, setTelegram] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Initialize the WebApp
      tg.ready();
      
      // Expand the WebApp to full height
      tg.expand();
      
      // Enable closing confirmation if needed
      // tg.enableClosingConfirmation();
      
      // Get user data if available
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      // Set the Telegram WebApp instance
      setTelegram(tg);
      setReady(true);
    }
  }, []);

  // Helper functions for Telegram WebApp
  const showMainButton = (text, onClick) => {
    if (!telegram) return;
    
    telegram.MainButton.setText(text);
    telegram.MainButton.onClick(onClick);
    telegram.MainButton.show();
  };

  const hideMainButton = () => {
    if (!telegram) return;
    telegram.MainButton.hide();
  };

  const showBackButton = (onClick) => {
    if (!telegram) return;
    
    telegram.BackButton.onClick(onClick);
    telegram.BackButton.show();
  };

  const hideBackButton = () => {
    if (!telegram) return;
    telegram.BackButton.hide();
  };

  const showPopup = (message, buttons = []) => {
    if (!telegram) return;
    
    telegram.showPopup({
      message,
      buttons: buttons.length > 0 ? buttons : [{ type: 'close' }]
    });
  };

  const closeApp = () => {
    if (!telegram) return;
    telegram.close();
  };

  // Context value
  const value = {
    telegram,
    user,
    ready,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    showPopup,
    closeApp,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};

// Custom hook to use the Telegram context
export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

export default TelegramContext;
