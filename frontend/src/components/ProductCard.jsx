import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import LoginPrompt from "./LoginPrompt";
import { useAuth, isPetOwner } from "../contexts/AuthContext";

const ProductCard = ({ product, onAdd, isBestSeller }) => {
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  console.log("ProductCard received product:", product);
  
  // Check if product is out of stock
  const isOutOfStock = (Number(product?.pQuantity) || 0) === 0;
  
  // Handle add to cart click
  const handleAdd = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    // Check if user is logged in as pet owner
    if (!isPetOwner(user)) {
      setShowLoginPrompt(true);
      return;
    }

    if (!onAdd) {
      console.warn("onAdd function not provided");
      return;
    }

    // Pass the correct product ID to the addToCart function
    onAdd(product);
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-[#1E40AF]/20 relative">
        {/* Best Seller Badge */}
        {isBestSeller && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">
            🔥 Best Seller
          </span>
        )}
        
        <img
          src={product.pImage || product.image || "https://via.placeholder.com/150"}
          alt={product.pName || "Product"}
          className="w-full h-48 object-cover"
        />

        <div className="p-4">
          <h2 className="font-bold text-lg mb-2 text-[#1E40AF]">
            {product.pName || "Unnamed Product"}
          </h2>
          <p className="text-gray-600 text-sm mb-2">
            {product.pdescription || product.pDescription || "No description available"}
          </p>
          <p className="font-semibold text-[#F97316] mb-2">
            Rs. {product.pPrice ?? 0}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Available stocks: {product.pQuantity ?? 0}
          </p>
          
          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div className="mb-2">
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                OUT OF STOCK
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* View Product Button */}
            <Link
              to={`/products/${product.productID ?? product.id ?? ""}`}
              className="bg-[#1E40AF] text-white px-4 py-2 rounded-md hover:bg-[#F97316] transition text-center"
            >
              View Details
            </Link>

            {/* Add to Cart Button */}
            <button
              onClick={handleAdd}
              disabled={!isPetOwner(user) || isOutOfStock}
              title={isOutOfStock ? "This product is out of stock" : 
                     !isPetOwner(user) ? "Login as pet owner to add to cart" : "Add to Cart"}
              className={`px-4 py-2 rounded-md transition ${
                !isPetOwner(user) || isOutOfStock
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#1E40AF] text-white hover:bg-[#F97316]"
              }`}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPrompt 
          message="You need to be logged in as a pet owner to add items to your cart."
          onDismiss={() => setShowLoginPrompt(false)}
        />
      )}
    </>
  );
};

// Default props in case product or onAdd is not provided
ProductCard.defaultProps = {
  product: {},
  onAdd: null,
  isBestSeller: false,
};

export default ProductCard;