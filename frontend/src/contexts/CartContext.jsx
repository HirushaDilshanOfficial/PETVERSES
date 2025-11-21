import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth, isPetOwner } from "./AuthContext";

export const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingCart, setLoadingCart] = useState(false);
  const [adding, setAdding] = useState(false);

  // API base URL
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

  // Check authentication before cart operations
  const checkAuth = () => {
    if (!user) {
      toast.error("You must be logged in to perform cart operations!");
      return false;
    }
    
    if (!isPetOwner(user)) {
      toast.error("Only pet owners can perform cart operations!");
      return false;
    }
    return true;
  };

  // Fetch cart for logged-in user
  const getCart = async () => {
    // Don't fetch cart if user is not authenticated or not a pet owner
    if (!user && !authLoading) {
      setCart([]);
      setSubtotal(0);
      setTotal(0);
      return;
    }

    if (!user) return; // Wait for auth state to load
    
    // Only pet owners should have carts
    if (!isPetOwner(user)) {
      setCart([]);
      setSubtotal(0);
      setTotal(0);
      return;
    }

    setLoadingCart(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cart`, {
        withCredentials: true,
      });
      const data = res.data;
      console.log("Cart data fetched:", data); // Debug log
      // Ensure we're setting the cart state correctly
      setCart(Array.isArray(data.cart) ? data.cart : []);
      setSubtotal(data.subtotal || 0);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error fetching cart:", err);
      // Only show error if it's not a 401 (which is expected for non-logged in users)
      // Also don't show error for 403 (which happens when non-pet owners try to access cart)
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        toast.error("Failed to fetch cart");
      }
      setCart([]);
      setSubtotal(0);
      setTotal(0);
    } finally {
      setLoadingCart(false);
    }
  };

  // Add item to cart
  const addToCart = async (productID, quantity = 1) => {
    // Check if user is logged in as pet owner
    if (!checkAuth()) {
      return;
    }

    if (adding) return; // prevent multiple clicks
    setAdding(true);

    try {
      // First, check product stock
      const productResponse = await axios.get(`${API_BASE_URL}/products/${productID}`, {
        withCredentials: true,
      });
      
      const product = productResponse.data.product;
      if (!product) {
        toast.error("Product not found!");
        return;
      }
      
      if (product.pQuantity < quantity) {
        toast.error(`Only ${product.pQuantity} items available in stock!`);
        return;
      }

      const res = await axios.post(
        `${API_BASE_URL}/cart/add`,
        { productID, quantity },
        { withCredentials: true }
      );
      const data = res.data;
      console.log("Add to cart response:", data); // Debug log
      // Ensure we're setting the cart state correctly
      setCart(Array.isArray(data.cart) ? data.cart : []);
      setSubtotal(data.subtotal || 0);
      setTotal(data.total || 0);
      toast.success("Added to cart!");
      
      // Force a cart refresh to ensure consistency
      await getCart();
    } catch (err) {
      console.error("Error adding to cart:", err);
      if (err.response?.status === 401) {
        toast.error("You must be logged in to add items to cart!");
      } else if (err.response?.status === 400 && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to add to cart");
      }
    } finally {
      setAdding(false);
    }
  };

  // Update item quantity
  const updateCartItem = async (productId, quantity) => {
    // Check if user is logged in as pet owner
    if (!checkAuth()) {
      return;
    }

    try {
      const res = await axios.put(
        `${API_BASE_URL}/cart/${productId}`,
        { quantity },
        { withCredentials: true }
      );
      const data = res.data;
      setCart(Array.isArray(data.cart) ? data.cart : []);
      setSubtotal(data.subtotal || 0);
      setTotal(data.total || 0);
      toast.success("Cart updated!");
    } catch (err) {
      console.error("Error updating cart:", err);
      if (err.response?.status === 401) {
        toast.error("You must be logged in to update the cart!");
      } else {
        toast.error("Failed to update cart");
      }
    }
  };

  // Remove item from cart
  const removeCartItem = async (productId) => {
    // Check if user is logged in as pet owner
    if (!checkAuth()) {
      return;
    }

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/cart/${productId}`,
        { withCredentials: true }
      );
      const data = res.data;
      setCart(Array.isArray(data.cart) ? data.cart : []);
      setSubtotal(data.subtotal || 0);
      setTotal(data.total || 0);
      toast.success("Item removed from cart!");
    } catch (err) {
      console.error("Error removing item:", err);
      if (err.response?.status === 401) {
        toast.error("You must be logged in to remove items!");
      } else {
        toast.error("Failed to remove item");
      }
    }
  };

  // Clear cart
  const clearCart = async () => {
    // Check if user is logged in as pet owner
    if (!checkAuth()) {
      return;
    }

    try {
      const res = await axios.delete(
        `${API_BASE_URL}/cart/clear`,
        { withCredentials: true }
      );
      const data = res.data;
      setCart(Array.isArray(data.cart) ? data.cart : []);
      setSubtotal(data.subtotal || 0);
      setTotal(data.total || 0);
      toast.success("Cart cleared!");
    } catch (err) {
      console.error("Error clearing cart:", err);
      if (err.response?.status === 401) {
        toast.error("You must be logged in to clear the cart!");
      } else {
        toast.error("Failed to clear cart");
      }
    }
  };

  // Load cart when user state changes
  useEffect(() => {
    console.log("CartContext - User state changed:", user); // Debug log
    getCart();
  }, [user, authLoading]);

  return (
    <CartContext.Provider
      value={{
        cart,
        subtotal,
        total,
        loadingCart,
        adding,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
