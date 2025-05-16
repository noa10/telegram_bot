import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/api'; // Assuming api.js exports getProduct
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css'; // Create this CSS file

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }
      console.log(`Fetching product with ID: ${id}`);
      try {
        // Assuming getProduct returns the product data directly or { data: productData }
        const productData = await getProduct(id);
        // If getProduct returns { data: ... }, uncomment next line
        // setProduct(productData.data);
        setProduct(productData); // If getProduct returns product directly
        if (!productData) {
          setError('Product not found.');
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError(`Failed to load product: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1);
      // Optionally, navigate to cart or show a notification
      // navigate('/cart');
      // alert(`${product.name} added to cart!`);
      console.log(`Product ${product.name} added to cart.`);
    }
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div><p>Loading product details...</p></div>;
  if (error) return <div className="error-container"><p>{error}</p><button onClick={() => navigate('/')}>Go Home</button></div>;
  if (!product) return <div className="not-found-container"><p>Product not found.</p><button onClick={() => navigate('/')}>Go Home</button></div>;

  return (
    <div className="product-detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      <div className="product-content">
        <div className="product-image-container">
          <img src={product.image_url || 'https://via.placeholder.com/400x300.png?text=No+Image'} alt={product.name} className="product-image" />
        </div>
        <div className="product-info">
          <h1 className="product-name">{product.name}</h1>
          <p className="product-description">{product.description || 'No description available.'}</p>
          <p className="product-price">Price: ${product.price ? parseFloat(product.price).toFixed(2) : 'N/A'}</p>
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