import React from 'react';
import { useCart } from '../context/CartContext';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (newQuantity >= 0) {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.id);
  };

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <img src={item.image_url || 'https://via.placeholder.com/60'} alt={item.name} />
      </div>
      <div className="cart-item-details">
        <h4 className="cart-item-name">{item.name}</h4>
        {item.addons && Object.keys(item.addons).length > 0 && (
          <div className="cart-item-addons">
            {Object.entries(item.addons).map(([group, option]) => (
              <p key={group}>{group}: {option}</p>
            ))}
          </div>
        )}
        <p className="cart-item-price">${item.price.toFixed(2)}</p>
      </div>
      <div className="cart-item-actions">
        <div className="quantity-control">
          <button
            className="quantity-btn"
            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={handleQuantityChange}
            className="quantity-input"
          />
          <button
            className="quantity-btn"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
          >
            +
          </button>
        </div>
        <button className="remove-btn" onClick={handleRemove}>
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;
