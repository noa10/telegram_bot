import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TelegramProvider } from './context/TelegramContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import './App.css';

function App() {
  // Apply Telegram theme colors
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;

      // Expand to full height
      tg.expand();

      // Set the app ready
      tg.ready();

      // Apply theme colors to CSS variables
      if (tg.themeParams) {
        console.log('Telegram theme params:', tg.themeParams);

        // Function to apply theme parameters
        const applyThemeParams = () => {
          // Set the theme variables
          document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#222222');
          document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
          document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f5f5f5');

          // Set the theme attribute based on colorScheme
          document.documentElement.setAttribute('data-theme', tg.colorScheme || 'light');
        };

        // Apply theme parameters initially
        applyThemeParams();

        // Listen for theme changes
        tg.onEvent('themeChanged', () => {
          console.log('Theme changed, new params:', tg.themeParams);
          console.log('New color scheme:', tg.colorScheme);
          applyThemeParams();
        });
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <TelegramProvider>
        <CartProvider>
          <Router>
            <div className="app-container">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:categoryName" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </TelegramProvider>
    </ThemeProvider>
  );
}

export default App;
