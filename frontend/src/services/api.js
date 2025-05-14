import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Get Telegram initData if available
const getTelegramInitData = () => {
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return '';
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add initData to all POST, PUT, PATCH requests
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch'].includes(config.method) && !config.url.includes('validate-telegram-data')) {
    // Add initData to the request body
    config.data = {
      ...config.data,
      initData: getTelegramInitData(),
    };
  }
  return config;
});

// Product API
export const getProducts = () => api.get('/api/products');
export const getProduct = (id) => api.get(`/api/products/${id}`);

// Order API
export const createOrder = (orderData) => api.post('/api/orders', orderData);
export const getUserOrders = (userId) => {
  // For GET requests, we need to add initData as a query parameter
  const initData = getTelegramInitData();
  return api.get(`/api/orders/user/${userId}`, {
    params: { initData }
  });
};

// Payment API
export const createPaymentIntent = (amount, currency = 'usd') =>
  api.post('/api/create-payment-intent', { amount, currency });

// Telegram validation
export const validateTelegramData = (initData) =>
  api.post('/api/validate-telegram-data', { initData });

export default api;
