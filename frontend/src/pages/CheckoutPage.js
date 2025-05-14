import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '../context/CartContext';
import { useTelegram } from '../context/TelegramContext';
import { createErrorHandler } from '../utils/errorHandler';
import CheckoutForm from '../components/CheckoutForm';
import './CheckoutPage.css';

// Load Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutPage = () => {
  const { items, totalItems, totalAmount } = useCart();
  const { showBackButton, hideMainButton } = useTelegram();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Hide main button
    hideMainButton();

    // Show back button
    showBackButton(() => navigate('/cart'));

    // Redirect to home if cart is empty
    if (totalItems === 0) {
      navigate('/');
    }
  }, [hideMainButton, navigate, showBackButton, totalItems]);

  // Create a payment intent when the component mounts
  useEffect(() => {
    const fetchPaymentIntent = async () => {
      if (totalAmount <= 0) {
        return;
      }

      try {
        // Convert amount to cents for Stripe
        const amountInCents = Math.round(totalAmount * 100);

        // Create payment intent
        const { data } = await createPaymentIntent(amountInCents, 'usd');

        if (data && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error('No client secret returned from API');
        }
      } catch (error) {
        const handleError = createErrorHandler(
          (message) => console.error('Payment intent error:', message)
        );
        handleError(error);
      }
    };

    fetchPaymentIntent();
  }, [totalAmount]);

  const handleCheckoutSuccess = () => {
    navigate('/order-success');
  };

  if (totalItems === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <h1>Checkout</h1>
      </header>

      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="order-items">
          {items.map(item => (
            <div key={item.id} className="order-item">
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">x{item.quantity}</span>
              </div>
              <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="order-total">
          <span>Total:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm
            onSuccess={handleCheckoutSuccess}
            clientSecret={clientSecret}
          />
        </Elements>
      )}
    </div>
  );
};

export default CheckoutPage;
