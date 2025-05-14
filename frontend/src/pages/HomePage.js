import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/api';
import { useTelegram } from '../context/TelegramContext';
import { useCart } from '../context/CartContext';
import { createErrorHandler } from '../utils/errorHandler';
import ProductCard from '../components/ProductCard';
import './HomePage.css';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showMainButton, hideBackButton } = useTelegram();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Hide back button
    hideBackButton();

    // Show main button if there are items in cart
    if (totalItems > 0) {
      showMainButton('View Cart', () => navigate('/cart'));
    }

    // Log for testing automatic deployment
    console.log('Testing automatic deployment to Vercel');

    // Fetch products
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await getProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        const handleError = createErrorHandler(
          (message) => setError(message || 'Failed to load products. Please try again.'),
          setLoading
        );
        handleError(err);
      } finally {
        setLoading(false); // Ensure loading is set to false regardless of success or failure
      }
    };

    fetchProducts();
  }, [hideBackButton, navigate, showMainButton, totalItems]);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Shop</h1>
        {totalItems > 0 && (
          <button className="cart-button" onClick={() => navigate('/cart')}>
            Cart ({totalItems})
          </button>
        )}
      </header>

      <div className="products-grid">
        {products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="no-products">No products available.</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
