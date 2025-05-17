import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

// Actions
const ADD_TO_CART = 'ADD_TO_CART';
const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
const CLEAR_CART = 'CLEAR_CART';

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const { product, quantity = 1, addons = {} } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.productId === product.id && JSON.stringify(item.addons) === JSON.stringify(addons)
      );

      if (existingItemIndex !== -1) {
        // Item already exists, update quantity
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
        // Add new item
        const newItem = {
          id: uuidv4(),
          productId: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          description: product.description,
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
      const itemToRemove = state.items.find(item => item.id === itemId);

      if (!itemToRemove) return state;

      return {
        ...state,
        items: state.items.filter(item => item.id !== itemId),
        totalItems: state.totalItems - itemToRemove.quantity,
        totalAmount: state.totalAmount - (itemToRemove.price * itemToRemove.quantity),
      };
    }

    case UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);

      if (existingItemIndex === -1) return state;

      const item = state.items[existingItemIndex];
      const quantityDiff = quantity - item.quantity;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return {
          ...state,
          items: state.items.filter(item => item.id !== itemId),
          totalItems: state.totalItems - item.quantity,
          totalAmount: state.totalAmount - (item.price * item.quantity),
        };
      }

      // Update quantity
      const updatedItems = [...state.items];
      updatedItems[existingItemIndex] = {
        ...item,
        quantity,
      };

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

// Create context
const CartContext = createContext(null);

// Context provider
export const CartProvider = ({ children }) => {
  // Load cart from localStorage if available
  const loadCartFromStorage = () => {
    try {
      const storedCart = localStorage.getItem('cart');
      return storedCart ? JSON.parse(storedCart) : initialState;
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return initialState;
    }
  };

  const [state, dispatch] = useReducer(cartReducer, loadCartFromStorage());

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  // Actions
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

  // Context value
  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
