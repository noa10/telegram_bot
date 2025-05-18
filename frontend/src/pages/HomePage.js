import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProducts, getCategories } from '../services/api';
import { useTelegram } from '../context/TelegramContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { createErrorHandler } from '../utils/errorHandler';
import ProductCardNew from '../components/ProductCardNew';
import './HomePage.css';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showMainButton, hideBackButton } = useTelegram();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme(); // Use theme context
  const navigate = useNavigate();
  const { categoryName } = useParams(); // Get category from URL if present

  useEffect(() => {
    // Hide back button
    hideBackButton();

    // Show main button if there are items in cart
    if (totalItems > 0) {
      showMainButton('View Cart', () => navigate('/cart'));
    }

    // Fetch products and categories
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Fetch products and categories in parallel for better performance
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);

        console.log('API response for /api/products:', productsData);
        console.log('API response for /api/categories:', categoriesData);

        // Handle products data
        if (Array.isArray(productsData)) {
          setProducts(productsData);

          // If categoryName is provided in URL, select that category
          if (categoryName) {
            setSelectedCategory(decodeURIComponent(categoryName));
          }

          setError(null);
        } else {
          console.error('Products data is not an array:', productsData);
          setError('Received invalid product data from server. The format is unexpected.');
          setProducts([]);
        }

        // Handle categories data
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error('Categories data is not an array:', categoriesData);
          setCategories([]);
        }
      } catch (err) {
        const handleError = createErrorHandler(
          (message) => setError(message || 'Failed to load data. Please try again.'),
          setLoading
        );
        handleError(err);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false); // Ensure loading is set to false regardless of success or failure
      }
    };

    fetchInitialData();
  }, [hideBackButton, navigate, showMainButton, totalItems, categoryName]);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Filter products by selected category
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Shop</h1>
        <div>
          {totalItems > 0 && (
            <button className="cart-button" onClick={() => navigate('/cart')}>
              Cart ({totalItems})
            </button>
          )}
        </div>
      </header>

      {/* Category filters */}
      <div className="category-filters">
        <button
          key="all-categories-filter"
          className={selectedCategory === null ? 'active' : ''}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={selectedCategory === category ? 'active' : ''}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Display selected category name if one is selected */}
      {selectedCategory && (
        <h2 className="category-title">{selectedCategory}</h2>
      )}

      <div className="products-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCardNew key={product.id} product={product} />
          ))
        ) : (
          <p className="no-products">
            {selectedCategory
              ? `No products available in ${selectedCategory} category.`
              : 'No products available.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
