import axios from 'axios';

console.log('Current REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
console.log('Effective API_URL for axios baseURL:', API_URL);

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
export const getProducts = () => {
  const requestUrl = `${api.defaults.baseURL}/api/products`;
  console.log('Axios requesting from URL:', requestUrl);
  return api.get('/api/products')
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Error fetching products:', error);
      throw error;
    });
};

export const getProduct = (id) => {
  console.log(`Fetching product with ID: ${id} from ${api.defaults.baseURL}/api/products/${id}`);
  return api.get(`/api/products/${id}`)
    .then(response => {
      console.log('API response:', response);
      return response.data;
    })
    .catch(error => {
      console.error(`Error fetching product with ID: ${id}:`, error);
      throw error;
    });
};

// Categories API
export const getCategories = async () => {
  try {
    const response = await api.get('/api/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

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
