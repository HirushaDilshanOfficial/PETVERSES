import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { CartContext } from "../contexts/CartContext";
import toast from "react-hot-toast";

const ProductDetailedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useContext(CartContext);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5009/api";

  // Fetch product and always show latest stock
  useEffect(() => {
    let canceled = false;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/products/${id}`);
        if (!canceled) {
          // Check if product is active
          if (res.data.product && res.data.product.status !== "Active") {
            // Product is inactive, show not found
            setProduct(null);
          } else {
            setProduct(res.data.product);
            // Set quantity to 1 if stock > 0, else 0
            setQuantity(res.data.product.pQuantity > 0 ? 1 : 0);
          }
        }
      } catch (error) {
        if (!canceled) {
          console.error("Error fetching product", error);
          toast.error(
            error.response?.status === 429
              ? "Too many requests! Try again in a moment."
              : "Failed to load product details"
          );
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      canceled = true;
    };
  }, [id]);

  // Check if product is out of stock
  const isOutOfStock = product && (Number(product.pQuantity) || 0) === 0;

  // Handle quantity changes
  const handleQuantityChange = (value) => {
    if (!product) return;

    if (isOutOfStock) {
      toast.error("This product is out of stock!");
      setQuantity(0);
      return;
    }

    if (value < 1) value = 1;
    if (value > product.pQuantity) {
      toast.error(`Cannot add more than ${product.pQuantity} items`);
      value = product.pQuantity;
    }
    setQuantity(value);
  };

  // Add to cart
  const addToCartHandler = async () => {
    if (!product || isOutOfStock) {
      toast.error("This product is out of stock!");
      return;
    }
    // Use the correct product ID property
    await addToCart(product.productID || product.id, quantity);
    toast.success("Added to cart!");
  };

  // Buy now
  const buyNowHandler = async () => {
    if (!product || isOutOfStock) {
      toast.error("This product is out of stock!");
      return;
    }
    // Use the correct product ID property
    await addToCart(product.productID || product.id, quantity);
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="text-center p-10 text-[#1E40AF] font-bold text-xl">
        Loading product...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center p-10 text-red-500 font-bold text-xl">
        Product not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex justify-center py-12 px-4">
      <div className="max-w-6xl w-full bg-white rounded-lg shadow-2xl overflow-hidden md:flex">
        {/* Product Image */}
        <div className="md:flex-shrink-0 md:w-1/2 p-6 flex flex-col items-center justify-center">
          <img
            src={product.pImage || "/src/assets/images/ND.jpeg"}
            alt={product.pName}
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-md"
          />
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-[#1E40AF]">{product.pName}</h1>
          
          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div className="mt-2">
              <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                OUT OF STOCK
              </span>
            </div>
          )}
          
          <p className="mt-4 text-2xl font-semibold text-[#F97316]">Rs. {product.pPrice}</p>
          <p className="text-gray-500 text-sm mb-4">
          Available stocks: {product.pQuantity ?? 0}
        </p>
          <p className="mt-6 text-gray-700 leading-relaxed">
            {product.pDescription || "No description available for this product."}
          </p>

          {/* Quantity Selector */}
          <div className="mt-8">
            <label htmlFor="quantity" className="block text-gray-700 font-medium">
              Quantity
            </label>
            <div className="flex items-center mt-2">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={isOutOfStock}
                className={`bg-gray-200 text-gray-800 px-3 py-1 rounded-l-md transition-colors ${
                  isOutOfStock ? "cursor-not-allowed opacity-50" : "hover:bg-gray-300"
                }`}
              >
                -
              </button>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="border border-gray-300 text-center w-16 h-10 appearance-none bg-white"
                min={1}
                max={product.pQuantity}
                disabled={isOutOfStock}
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={isOutOfStock}
                className={`bg-gray-200 text-gray-800 px-3 py-1 rounded-r-md transition-colors ${
                  isOutOfStock ? "cursor-not-allowed opacity-50" : "hover:bg-gray-300"
                }`}
              >
                +
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={addToCartHandler}
              disabled={isOutOfStock}
              className={`flex-1 py-3 px-6 rounded-md font-bold text-white transition-colors duration-300 ${
                isOutOfStock
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#1E40AF] hover:bg-[#F97316]"
              }`}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>

            <button
              onClick={buyNowHandler}
              disabled={isOutOfStock}
              className={`flex-1 py-3 px-6 rounded-md font-bold text-white transition-colors duration-300 ${
                isOutOfStock
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#1E40AF] hover:bg-[#F97316]"
              }`}
            >
              {isOutOfStock ? "Out of Stock" : "Buy Now"}
            </button>
            
            {/* View Reviews Button */}
            <button
              onClick={() => navigate(`/product/${product._id || id}/review`)}
              className="flex-1 py-3 px-6 rounded-md font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-300"
            >
              View Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailedPage;