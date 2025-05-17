import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserOrders } from '../services/api';
import { useTelegram } from '../context/TelegramContext';
import { createErrorHandler } from '../utils/errorHandler';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showBackButton, hideMainButton, user } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();

  // Get userId from query params or from Telegram user
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('userId') || user?.id || 'anonymous';

  useEffect(() => {
    // Hide main button
    hideMainButton();

    // Show back button
    showBackButton(() => navigate('/'));

    // Fetch orders
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await getUserOrders(userId);
        setOrders(data);
        setError(null);
      } catch (err) {
        const handleError = createErrorHandler(
          (message) => setError(message || 'Failed to load orders. Please try again.'),
          setLoading
        );
        handleError(err);
      } finally {
        setLoading(false); // Ensure loading is set to false regardless of success or failure
      }
    };

    fetchOrders();
  }, [hideMainButton, navigate, showBackButton, userId]);

  if (loading) {
    return <div className="loading">Loading orders...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="empty-orders">
        <h2>No Orders Found</h2>
        <p>You haven't placed any orders yet.</p>
        <button className="shop-button" onClick={() => navigate('/')}>
          Start Shopping
        </button>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="orders-page">
      <header className="orders-header">
        <h1>Your Orders</h1>
      </header>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <span className="order-id">Order #{order.id}</span>
                <span className="order-date">{formatDate(order.created_at)}</span>
              </div>
              <span className="order-status">{order.status}</span>
            </div>

            <div className="order-items">
              {order.products.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                    {item.addons && Object.keys(item.addons).length > 0 && (
                      <div>
                        {Object.entries(item.addons).map(([group, option]) => (
                          <p key={group}>{group}: {option}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="shipping-address">
                <h4>Shipping Address</h4>
                <p>{order.shipping_address.name}</p>
                <p>{order.shipping_address.address}</p>
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                <p>{order.shipping_address.country}</p>
              </div>
              <div className="order-total">
                <span>Total:</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
