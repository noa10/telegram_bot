import axios from 'axios';

console.log('Current REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
console.log('Effective API_URL for axios baseURL:', API_URL);

// Ensure the API URL has the correct format
const BACKEND_URL = 'https://backend-iwur2aw18-noa10s-projects.vercel.app';
console.log('Using direct backend URL:', BACKEND_URL);

// Get Telegram initData if available
const getTelegramInitData = () => {
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return '';
};

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
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
      console.log('API response for products:', response.data);
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
      console.log('API response for product detail:', response.data);
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
    const requestUrl = `${api.defaults.baseURL}/api/categories`;
    console.log('Axios requesting categories from URL:', requestUrl);
    const response = await api.get('/api/categories');
    console.log('API response for categories:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Order API
export const createOrder = (orderData) => {
  console.log('Creating order with data:', orderData);
  return api.post('/api/orders', orderData);
};

export const getUserOrders = (userId) => {
  // For GET requests, we need to add initData as a query parameter
  const initData = getTelegramInitData();
  console.log(`Fetching orders for user ${userId}`);
  return api.get(`/api/orders/user/${userId}`, {
    params: { initData }
  });
};

// Payment API
export const createPaymentIntent = (amount, currency = 'usd') => {
  console.log(`Creating payment intent for amount: ${amount} ${currency}`);
  return api.post('/api/create-payment-intent', { amount, currency });
};

// Telegram validation
export const validateTelegramData = (initData) => {
  console.log('Validating Telegram data');
  return api.post('/api/validate-telegram-data', { initData });
};

export default api;
