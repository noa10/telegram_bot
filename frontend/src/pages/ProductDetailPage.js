import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useTelegram } from '../context/TelegramContext';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [quantity, setQuantity] = useState(1); // Add quantity state
  const { addToCart } = useCart();
  const { theme } = useTheme();
  const { showPopup } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError(null);

      if (!id) {
        setError('Product ID is missing.');
        setProduct(null); // Explicitly set product to null
        setSelectedAddons({}); // Reset addons
        setLoading(false);
        return;
      }

      console.log(`Fetching product with ID: ${id}`);
      try {
        const productData = await getProduct(id);
        console.log('Product data received:', productData);

        if (!productData) {
          setError('Product not found.');
          setProduct(null); // Explicitly set product to null
          setSelectedAddons({}); // Reset addons
          return;
        }

        setProduct(productData);
        console.log('Product addons:', productData?.addons);

        // Initialize selectedAddons after productData is fetched
        if (productData.addons && typeof productData.addons === 'object' && Object.keys(productData.addons).length > 0) {
          console.log('Product has addons, setting defaults');
          const defaultAddons = {};
          Object.entries(productData.addons).forEach(([group, options]) => {
            if (Array.isArray(options) && options.length > 0) {
              // Prefer an option explicitly marked as default, otherwise the first
              const defaultOption = options.find(opt => typeof opt === 'string' && opt.toLowerCase().includes('(default)')) || options[0];
              defaultAddons[group] = defaultOption;
            }
          });
          console.log('Default addons:', defaultAddons);
          setSelectedAddons(defaultAddons);
        } else {
          console.log('Product has no addons or addons is not properly formatted');
          setSelectedAddons({}); // Ensure it's an empty object if no addons
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError(`Failed to load product: ${err.message}`);
        setProduct(null); // Clear product on error
        setSelectedAddons({}); // Reset addons on error
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddonChange = (group, value) => {
    setSelectedAddons(prev => ({ ...prev, [group]: value }));
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedAddons);
      // Show a popup notification
      showPopup(`${quantity} ${product.name} added to cart!`);
      console.log(`${quantity} ${product.name} added to cart with add-ons:`, selectedAddons);
    }
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div><p>Loading product details...</p></div>;
  if (error) return <div className="error-container"><p>{error}</p><button onClick={() => navigate('/')}>Go Home</button></div>;
  if (!product) return <div className="not-found-container"><p>Product not found.</p><button onClick={() => navigate('/')}>Go Home</button></div>;

  return (
    <div className={`product-detail-page ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      <div className="product-content">
        <div className="product-image-container">
          <img src={product.image_url || 'https://via.placeholder.com/400x300.png?text=No+Image'} alt={product.name} className="product-image" />
        </div>
        <div className="product-info">
          <h1 className="product-name">{product.name}</h1>
          <p className="product-description">{product.description || 'No description available.'}</p>
          <p className="product-price">Price: ${product.price ? parseFloat(product.price).toFixed(2) : 'N/A'}</p>

          {/* Add-ons Section */}
          {product.addons && typeof product.addons === 'object' && Object.keys(product.addons).length > 0 && (
            <div className="addons-section">
              <h2>Customize Your Order</h2>
              {Object.entries(product.addons)
                .filter(([, options]) => Array.isArray(options) && options.length > 0)
                .map(([group, options]) => (
                  <div key={group} className="addon-group">
                    <label htmlFor={`addon-${group}`}>{group}:</label>
                    <select
                      id={`addon-${group}`}
                      value={selectedAddons[group] || ''}
                      onChange={(e) => handleAddonChange(group, e.target.value)}
                    >
                      {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))
              }
            </div>
          )}

          {/* Quantity Selector */}
          <div className="quantity-selector">
            <label htmlFor="quantity">Quantity:</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              min="1"
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))}
            />
          </div>

          <div className="product-actions">
            <button onClick={handleAddToCart} className="add-to-cart-button">Add to Cart</button>
            <button onClick={() => navigate('/')} className="continue-shopping-button">Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;