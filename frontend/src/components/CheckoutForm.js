import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useTelegram } from '../context/TelegramContext';
import { createOrder } from '../services/api';
import { createErrorHandler } from '../utils/errorHandler';
import './CheckoutForm.css';

const CheckoutForm = ({ onSuccess, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, totalAmount, clearCart } = useCart();
  const { user, showPopup } = useTelegram();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate form
    const requiredFields = ['name', 'address', 'city', 'zip', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);

    if (missingFields.length > 0) {
      setError(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the client secret from props
      if (!clientSecret) {
        throw new Error('Payment not initialized. Please try again.');
      }

      // Confirm card payment
      const cardElement = elements.getElement(CardElement);
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingAddress.name,
            },
          },
        }
      );

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order in database
        const orderData = {
          userId: user?.id || 'anonymous',
          products: items,
          totalAmount,
          paymentIntentId: paymentIntent.id,
          shippingAddress,
        };

        await createOrder(orderData);

        // Clear cart
        clearCart();

        // Show success message
        showPopup('Payment successful! Your order has been placed.');

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      const handleError = createErrorHandler(setError, setLoading);
      handleError(err);
    }
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <h2>Shipping Information</h2>

      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={shippingAddress.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input
          type="text"
          id="address"
          name="address"
          value={shippingAddress.address}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={shippingAddress.city}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="state">State/Province</label>
          <input
            type="text"
            id="state"
            name="state"
            value={shippingAddress.state}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="zip">ZIP/Postal Code</label>
          <input
            type="text"
            id="zip"
            name="zip"
            value={shippingAddress.zip}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="country">Country</label>
          <input
            type="text"
            id="country"
            name="country"
            value={shippingAddress.country}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <h2>Payment Information</h2>

      <div className="form-group">
        <label htmlFor="card-element">Credit or debit card</label>
        <div className="card-element-container">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        className="checkout-button"
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
      </button>
    </form>
  );
};

export default CheckoutForm;
