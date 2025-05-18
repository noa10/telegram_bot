import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  
  // Ensure product and product.price are defined before using them
  const priceDisplay = product && typeof product.price === 'number'
    ? `$${product.price.toFixed(2)}`
    : 'Price not available';
  const productName = product ? product.name : 'Unnamed Product';
  const productDescription = product ? product.description : 'No description available.';

  if (!product || !product.id) {
    // Render a placeholder if product data is incomplete
    return <div className="product-card-placeholder">Loading...</div>;
  }

  const handleCardClick = () => {
    console.log(`ProductCard clicked for product: ${product.id} - ${productName}`);
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      className="product-card"
      onClick={handleCardClick}
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
          <span className="view-details-text">View Details</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
