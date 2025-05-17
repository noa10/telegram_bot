Below is a complete guide to updating the frontend UI/UX and backend logic for the Telegram Mini App based on the user's requests. Each requirement is addressed with specific changes to the existing codebase, ensuring clarity and functionality.

---

## 1. Enable User to Toggle Dark Mode for the Mini App

### Objective
Allow users to switch between light and dark modes within the Telegram Mini App.

### Approach
- Create a `ThemeContext` to manage theme state across the app.
- Add a toggle button in the `HomePage` header.
- Define CSS variables for light and dark themes, overriding Telegram's default theme when toggled.

### Implementation

#### Create `ThemeContext.js`
Create a new file at `frontend/src/context/ThemeContext.js`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

#### Update `App.js`
Wrap the app with `ThemeProvider` and adjust Telegram theme application:

```javascript
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TelegramProvider } from './context/TelegramContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import './App.css';

function App() {
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      // Apply Telegram theme as fallback, overridden by ThemeContext
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#222222');
      document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
      document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
      document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
    }
  }, []);

  return (
    <ThemeProvider>
      <TelegramProvider>
        <CartProvider>
          <Router>
            <div className="app-container">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:categoryName" element={<HomePage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </TelegramProvider>
    </ThemeProvider>
  );
}

export default App;
```

#### Update `App.css`
Define theme-specific styles:

```css
:root {
  --tg-theme-bg-color: #ffffff;
  --tg-theme-text-color: #222222;
  --tg-theme-hint-color: #999999;
  --tg-theme-link-color: #2481cc;
  --tg-theme-button-color: #2481cc;
  --tg-theme-button-text-color: #ffffff;
}

[data-theme="light"] {
  --tg-theme-bg-color: #ffffff;
  --tg-theme-text-color: #222222;
  --tg-theme-hint-color: #999999;
  --tg-theme-link-color: #2481cc;
  --tg-theme-button-color: #2481cc;
  --tg-theme-button-text-color: #ffffff;
}

[data-theme="dark"] {
  --tg-theme-bg-color: #222222;
  --tg-theme-text-color: #ffffff;
  --tg-theme-hint-color: #aaaaaa;
  --tg-theme-link-color: #66aaff;
  --tg-theme-button-color: #66aaff;
  --tg-theme-button-text-color: #000000;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--tg-theme-bg-color);
  color: var(--tg-theme-text-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ... rest of the existing styles ... */
```

#### Update `HomePage.js`
Add a toggle button in the header:

```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProducts } from '../services/api';
import { useTelegram } from '../context/TelegramContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { createErrorHandler } from '../utils/errorHandler';
import ProductCard from '../components/ProductCard';
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
  const { categoryName } = useParams();

  useEffect(() => {
    hideBackButton();
    if (totalItems > 0) {
      showMainButton('View Cart', () => navigate('/cart'));
    }
    // ... existing fetchProducts logic ...
  }, [hideBackButton, navigate, showMainButton, totalItems, categoryName]);

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) return <div className="error">{error}</div>;

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Shop</h1>
        <div>
          <button onClick={toggleTheme} style={{ marginRight: '10px' }}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          {totalItems > 0 && (
            <button className="cart-button" onClick={() => navigate('/cart')}>
              Cart ({totalItems})
            </button>
          )}
        </div>
      </header>
      {/* ... rest of the existing JSX ... */}
    </div>
  );
};

export default HomePage;
```

### Result
Users can now toggle between light and dark modes using a button in the header, with styles applied consistently across the app.

---

## 2. Enable User to Click the Card to Enter the Menu Item

### Objective
Make product cards clickable to navigate to the product detail page while keeping the "Add to Cart" button functional.

### Approach
- Wrap the `ProductCard` content in a `Link` from `react-router-dom`.
- Prevent the link navigation when clicking the "Add to Cart" button using event propagation.

### Implementation

#### Update `ProductCard.js`
```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image">
        <img src={product.image_url || 'https://via.placeholder.com/150'} alt={product.name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-price-action">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
```

#### Update `ProductCard.css`
Ensure the link styling doesn’t interfere:

```css
.product-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  background-color: #fff;
  transition: transform 0.2s ease-in-out;
  text-decoration: none; /* Remove link underline */
  color: inherit; /* Inherit text color */
}

/* ... rest of the existing styles ... */
```

### Result
Clicking anywhere on the product card navigates to the product detail page, except when clicking the "Add to Cart" button, which adds the item to the cart without navigation.

---

## 3. Add Menu Categories According to the Menu

### Objective
Ensure products are grouped or filterable by categories as defined in `Menu.txt`.

### Approach
- The existing `HomePage.js` already extracts categories dynamically from products and provides filtering.
- Verify that categories match those in `Menu.txt` ("Main", "Side", "Special Set", "Beverages", "Paste").

### Verification
- `Menu.txt` defines categories: "Main", "Side", "Special Set", "Beverages", "Paste".
- `seed-data.js` maps these categories to the `products` table.
- `HomePage.js` fetches products and extracts unique categories using:

```javascript
const uniqueCategories = [...new Set(data.map(product => product.category))];
```

Since the categories are seeded from `Menu.txt` and dynamically displayed, no additional changes are required.

### Result
Categories are already correctly implemented and match the menu, allowing users to filter products by category.

---

## 4. Add Option for User to Select Add-ons Categorized for Each Menu Item

### Objective
Allow users to select add-ons for products as specified in `Menu.txt`.

### Approach
- Update the database schema to store add-ons in the `products` table as a JSONB field.
- Modify `seed-data.js` to parse and assign add-ons from `Menu.txt`.
- Update `ProductDetailPage.js` to display and allow selection of add-ons.
- Update `CartContext.js` to handle items with add-ons.

### Implementation

#### Update `supabase-schema.sql`
Add an `addons` column to the `products` table:

```sql
ALTER TABLE products ADD COLUMN addons JSONB;
```

#### Update `seed-data.js`
Parse add-ons from `Menu.txt` and assign them to products:

```javascript
const addonGroups = {
  'Spicy level': ["Non Spicy", "Normal 🌶️", "Spicy 🌶️🌶️", "Extra Spicy 🌶️🌶️"],
  'Basil': ["Thai Holy Basil (Krapow) - Default", "Thai Basil (Selasih)", "No Basil"],
  'Weight': ["125g - Default", "250g"],
  'Packaging': ["Food Container (Photodegradable)", "Food Container (Plastic)"],
  'Beverages': ["Kickapoo", "Soya"]
};

const seedProducts = async () => {
  // ... existing code ...

  const formattedProducts = menuProducts.map(item => {
    const productCode = item.Id;
    let addons = {};

    if (['0001', '0002', '0003', '0004', '0005'].includes(productCode)) {
      addons['Spicy level'] = addonGroups['Spicy level'];
      addons['Basil'] = addonGroups['Basil'];
      addons['Weight'] = addonGroups['Weight'];
      addons['Packaging'] = addonGroups['Packaging'];
    }

    if (['0001', '0002'].includes(productCode)) {
      addons['Beverages'] = addonGroups['Beverages'];
    }

    return {
      name: item['Product Name'],
      description: item['Product Name'],
      price: item.Price,
      image_url: item['Image URL'],
      category: item.Category,
      product_code: item.Id,
      stock_quantity: 100,
      addons: Object.keys(addons).length > 0 ? addons : null
    };
  });

  const { data: insertedProducts, error: insertError } = await supabase
    .from('products')
    .insert(formattedProducts)
    .select();

  if (insertError) throw insertError;

  console.log(`${insertedProducts.length} products seeded successfully!`);
  // Remove seedAddons call since add-ons are now in products table
};

// Remove seedAddons function and its call
seedProducts()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
```

#### Update `CartContext.js`
Install `uuid` (`npm install uuid`) and modify to handle add-ons:

```javascript
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';

const cartReducer = (state, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const { product, quantity = 1, addons = {} } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.productId === product.id && JSON.stringify(item.addons) === JSON.stringify(addons)
      );

      if (existingItemIndex !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + quantity,
          totalAmount: state.totalAmount + (product.price * quantity),
        };
      } else {
        const newItem = {
          id: uuidv4(),
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          addons,
        };
        return {
          ...state,
          items: [...state.items, newItem],
          totalItems: state.totalItems + quantity,
          totalAmount: state.totalAmount + (product.price * quantity),
        };
      }
    }

    case REMOVE_FROM_CART: {
      const { itemId } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      if (!item) return state;
      return {
        ...state,
        items: state.items.filter(item => item.id !== itemId),
        totalItems: state.totalItems - item.quantity,
        totalAmount: state.totalAmount - (item.price * item.quantity),
      };
    }

    case UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return state;
      const item = state.items[itemIndex];
      const quantityDiff = quantity - item.quantity;

      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== itemId),
          totalItems: state.totalItems - item.quantity,
          totalAmount: state.totalAmount - (item.price * item.quantity),
        };
      }

      const updatedItems = [...state.items];
      updatedItems[itemIndex] = { ...item, quantity };
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems + quantityDiff,
        totalAmount: state.totalAmount + (item.price * quantityDiff),
      };
    }

    case CLEAR_CART:
      return initialState;

    default:
      return state;
  }
};

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const addToCart = (product, quantity = 1, addons = {}) => {
    dispatch({ type: ADD_TO_CART, payload: { product, quantity, addons } });
  };

  const removeFromCart = (itemId) => {
    dispatch({ type: REMOVE_FROM_CART, payload: { itemId } });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({ type: UPDATE_QUANTITY, payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CLEAR_CART });
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export default CartContext;
```

#### Update `ProductDetailPage.js`
Display and allow selection of add-ons:

```javascript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState({});
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }
      try {
        const productData = await getProduct(id);
        setProduct(productData);
        if (!productData) {
          setError('Product not found.');
        } else if (productData.addons) {
          const defaultAddons = {};
          Object.keys(productData.addons).forEach(group => {
            const options = productData.addons[group];
            defaultAddons[group] = options.find(opt => opt.includes('Default')) || options[0];
          });
          setSelectedAddons(defaultAddons);
        }
      } catch (err) {
        setError(`Failed to load product: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1, selectedAddons);
      console.log(`Product ${product.name} added to cart with add-ons:`, selectedAddons);
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
          {product.addons && (
            <div className="addons-section">
              <h2>Customize Your Order</h2>
              {Object.keys(product.addons).map(group => (
                <div key={group} className="addon-group">
                  <label>{group}</label>
                  <select
                    value={selectedAddons[group] || ''}
                    onChange={(e) => setSelectedAddons(prev => ({ ...prev, [group]: e.target.value }))}
                  >
                    {product.addons[group].map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
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
```

#### Update `ProductDetailPage.css`
Add styles for add-ons:

```css
.addons-section {
  margin-bottom: 20px;
}

.addons-section h2 {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.addon-group {
  margin-bottom: 15px;
}

.addon-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.addon-group select {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 1em;
}

/* ... rest of the existing styles ... */
```

#### Update `CartItem.js`
Display add-ons:

```javascript
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
```

#### Update `CartItem.css`
Style the add-ons display:

```css
.cart-item-addons {
  font-size: 12px;
  color: #888;
}

.cart-item-addons p {
  margin: 2px 0;
}

/* ... rest of the existing styles ... */
```

#### Update `CheckoutPage.js` and `OrdersPage.js`
Display add-ons in the order summary:

**`CheckoutPage.js`**:
```javascript
<div className="order-items">
  {items.map(item => (
    <div key={item.id} className="order-item">
      <div className="item-info">
        <span className="item-name">{item.name}</span>
        <span className="item-quantity">x{item.quantity}</span>
        {item.addons && Object.keys(item.addons).length > 0 && (
          <div>
            {Object.entries(item.addons).map(([group, option]) => (
              <p key={group}>{group}: {option}</p>
            ))}
          </div>
        )}
      </div>
      <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  ))}
</div>
```

**`OrdersPage.js`**:
```javascript
<div className="order-items">
  {order.products.map(item => (
    <div key={item.id} className="order-item">
      <div className="item-info">
        <span className="item-name">{item.name}</span>
        <span className="item-quantity">x{item.quantity}</span>
        {item.addons && Object.keys(item.addons).length > 0 && (
          <div>
            {Object.entries(item.addons).map(([group, option]) => (
              <p key={group}>{group}: {option}</p>
            ))}
          </div>
        )}
      </div>
      <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  ))}
</div>
```

### Result
Users can now select add-ons for applicable products (IDs 0001-0005 as per `Menu.txt`), which are stored with the product and reflected in the cart and orders.

---

## 5. Resize the Menu/Orders Cards to Show 2 Menu Cards per Row

### Objective
Display two product cards per row on the homepage.

### Approach
- Adjust the CSS grid in `HomePage.css` to enforce two columns on wider screens.

### Implementation

#### Update `HomePage.css`
```css
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

@media (min-width: 600px) {
  .products-grid {
    grid-template-columns: repeat(2, minmax(280px, 1fr));
  }
}

@media (max-width: 600px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}

/* ... rest of the existing styles ... */
```

### Note
- For the orders page, the current layout uses flexbox with a column direction. Assuming the request refers primarily to menu (product) cards, no changes are made to `OrdersPage.css`. If two columns are desired for orders, similar grid adjustments can be applied.

### Result
Product cards on the homepage now display two per row on screens wider than 600px, reverting to one per row on narrower screens for responsiveness.

---

## Summary of Changes

1. **Dark Mode Toggling**:
   - Added `ThemeContext.js` and integrated it into `App.js`.
   - Updated `App.css` with theme-specific variables.
   - Added a toggle button in `HomePage.js`.

2. **Clickable Product Cards**:
   - Wrapped `ProductCard.js` content in a `Link` with event propagation stopped for the "Add to Cart" button.

3. **Menu Categories**:
   - Verified existing implementation matches `Menu.txt` categories; no changes needed.

4. **Add-ons Selection**:
   - Added `addons` JSONB column to `products` in `supabase-schema.sql`.
   - Updated `seed-data.js` to include add-ons per product.
   - Modified `ProductDetailPage.js` to display and select add-ons.
   - Updated `CartContext.js` to handle items with add-ons using UUIDs.
   - Enhanced `CartItem.js`, `CheckoutPage.js`, and `OrdersPage.js` to show add-ons.

5. **Card Resizing**:
   - Adjusted `HomePage.css` to display two product cards per row on wider screens.

These updates enhance the app’s usability and customization options while maintaining a responsive design. After implementing these changes, reseed the database (`node seed-data.js`) to apply the new `addons` structure.