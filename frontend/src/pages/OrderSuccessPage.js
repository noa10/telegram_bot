import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../context/TelegramContext';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const { showMainButton, hideBackButton } = useTelegram();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Hide back button
    hideBackButton();
    
    // Show main button
    showMainButton('Continue Shopping', () => navigate('/'));
  }, [hideBackButton, navigate, showMainButton]);
  
  return (
    <div className="order-success-page">
      <div className="success-icon">✓</div>
      <h1>Order Placed Successfully!</h1>
      <p>Thank you for your purchase. Your order has been received and is being processed.</p>
      <p>You will receive a confirmation message shortly.</p>
      <button className="continue-button" onClick={() => navigate('/')}>
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderSuccessPage;
