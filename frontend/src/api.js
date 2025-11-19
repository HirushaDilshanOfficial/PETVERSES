import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"; // Changed from 5002 to 5003

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;

// Get all items in cart
export const getCart = async () => {
  const res = await axios.get(`${API_BASE_URL}/cart`, {
    withCredentials: true,
  });
  return res.data;
};

// Add item to cart
export const addToCart = async (productId, quantity) => {
  const res = await axios.post(
    `${API_BASE_URL}/cart/add`,
    { productId, quantity },
    { withCredentials: true }
  );
  return res.data;
};

// Update cart item
export const updateCartItem = async (productID, quantity) => {
  const res = await axios.put(
    `${API_BASE_URL}/cart/${productID}`,
    { quantity },
    { withCredentials: true }
  );
  return res.data;
};

// Remove item from cart
export const removeCartItem = async (productId) => {
  const res = await axios.delete(`${API_BASE_URL}/cart/${productId}`, {
    withCredentials: true,
  });
  return res.data;
};

// Clear entire cart
export const clearCart = async () => {
  const res = await axios.delete(`${API_BASE_URL}/cart/clear`, {
    withCredentials: true,
  });
  return res.data;
};

// Get service by ID
export const getServiceById = async (id) => {
  const res = await axios.get(`${API_BASE_URL}/services/${id}`);
  return res.data;
};

// Get all services
export const getServices = async () => {
  const res = await axios.get(`${API_BASE_URL}/services`);
  return res.data;
};

// Get all products
export const getProducts = async () => {
  const res = await axios.get(`${API_BASE_URL}/products`);
  return res.data;
};

// Get best-selling products
export const getBestSellers = async () => {
  const res = await axios.get(`${API_BASE_URL}/products/bestsellers`);
  return res.data;
};

// Get service provider analytics
export const getServiceProviderAnalytics = async () => {
  const res = await axios.get(`${API_BASE_URL}/dashboard/provider-analytics`, {
    withCredentials: true,
  });
  return res.data;
};
