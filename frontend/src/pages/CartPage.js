import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTelegram } from '../context/TelegramContext';
import CartItem from '../components/CartItem';
import './CartPage.css';

const CartPage = () => {
  const { items, totalItems, totalAmount, clearCart } = useCart();
  const { showMainButton, showBackButton } = useTelegram();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Show back button
    showBackButton(() => navigate('/'));
    
    // Show main button if there are items in cart
    if (totalItems > 0) {
      showMainButton('Checkout', () => navigate('/checkout'));
    }
  }, [navigate, showBackButton, showMainButton, totalItems]);
  
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      navigate('/');
    }
  };
  
  if (totalItems === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some products to your cart to see them here.</p>
        <button className="shop-button" onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>
    );
  }
  
  return (
    <div className="cart-page">
      <header className="cart-header">
        <h1>Your Cart</h1>
        <button className="clear-cart-button" onClick={handleClearCart}>
          Clear Cart
        </button>
      </header>
      
      <div className="cart-items">
        {items.map(item => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
      
      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal ({totalItems} items):</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping:</span>
          <span>Free</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        
        <button 
          className="checkout-button"
          onClick={() => navigate('/checkout')}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
