import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  // Ensure product and product.price are defined before using them
  const priceDisplay = product && typeof product.price === 'number'
    ? `$${product.price.toFixed(2)}`
    : 'Price not available';
  const productName = product ? product.name : 'Unnamed Product';
  const productDescription = product ? product.description : 'No description available.';

  const handleAddToCartClick = (e) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event from bubbling to the Link
    if (product) {
      // Adding to cart from product card might mean adding with default or no addons.
      // For products with mandatory addons, this button might be disabled or removed,
      // forcing users to the detail page.
      addToCart(product, 1, {}); // Assuming default quantity 1 and no specific addons selected here
      // Add user feedback
      alert(`${productName} added to cart!`);
    }
  };

  if (!product || !product.id) {
    // Render a placeholder if product data is incomplete
    return <div className="product-card-placeholder">Loading...</div>;
  }

  return (
    <Link
      to={`/product/${product.id}`}
      className="product-card"
      aria-label={`View details for ${productName}`}
    >
      <div className="product-image">
        <img src={product.image_url || 'https://via.placeholder.com/150'} alt={productName} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{productName}</h3>
        <p className="product-description">{productDescription}</p>
        <div className="product-price-action">
          <span className="product-price">{priceDisplay}</span>
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCartClick}
            aria-label={`Add ${productName} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
