import Product from "../Models/Product.js";
import Order from "../Models/Order.js";
import { uploadToCloudinary } from "../Config/cloudinary.js";

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    // Get all products from database (both active and inactive)
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products: products,
      message: "Products fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find product by ID (could be active or inactive)
    const product = await Product.findOne({ productID: productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product: product,
      message: "Product fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    console.log("📥 Creating new product with data:", req.body);
    console.log("📁 File received:", req.file);

    const {
      productID,
      pName,
      pDescription,
      pCategory,
      pPrice,
      pQuantity,
      status,
    } = req.body;

    // Validate required fields
    if (
      !productID ||
      !pName ||
      !pDescription ||
      !pCategory ||
      !pPrice ||
      !pQuantity
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate productID length
    if (productID.length < 3 || productID.length > 6) {
      return res.status(400).json({
        success: false,
        message: "Product ID must be between 3 and 6 characters",
      });
    }

    // Validate productID format (only letters and numbers)
    if (!/^[a-zA-Z0-9]+$/.test(productID)) {
      return res.status(400).json({
        success: false,
        message: "Product ID can only contain letters and numbers",
      });
    }

    // Validate price is greater than 0
    const priceValue = parseFloat(pPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    // Validate quantity is not negative and doesn't start with zero (except for "0")
    const quantityValue = parseInt(pQuantity);
    if (isNaN(quantityValue) || quantityValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be 0 or greater",
      });
    }

    // Check for leading zeros (except for "0" itself)
    if (pQuantity.startsWith("0") && pQuantity !== "0") {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot start with zero",
      });
    }

    // Validate category contains only letters, digits, and spaces
    if (!/^[a-zA-Z0-9\s]+$/.test(pCategory)) {
      return res.status(400).json({
        success: false,
        message: "Category can only contain letters, digits, and spaces",
      });
    }

    // Check if product with same ID already exists
    const existingProduct = await Product.findOne({ productID });
    if (existingProduct) {
      console.log("❌ Product with ID already exists:", productID);
      return res.status(409).json({
        success: false,
        message: "Product with this ID already exists",
      });
    }

    // Handle image upload if file is provided
    let imageUrl = ""; // Default to empty string
    if (req.file) {
      console.log("☁️ Uploading image to Cloudinary...");
      try {
        // Upload file to Cloudinary
        const uploadResult = await uploadToCloudinary(
          req.file,
          "petverse/products"
        );
        imageUrl = uploadResult.url;
        console.log("✅ Image uploaded successfully:", imageUrl);
      } catch (uploadError) {
        console.error("❌ Error uploading image to Cloudinary:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload product image",
          error: uploadError.message,
        });
      }
    }

    // Create new product
    const newProduct = new Product({
      productID,
      pName,
      pDescription,
      pCategory,
      pPrice: priceValue,
      pQuantity: quantityValue,
      pImage: imageUrl,
      status: status || "Active",
    });

    console.log("💾 Saving product to database...");
    // Save product to database
    const savedProduct = await newProduct.save();
    console.log("✅ Product saved successfully:", savedProduct._id);

    res.status(201).json({
      success: true,
      product: savedProduct,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    // Validate productID format if provided
    if (updateData.productID !== undefined) {
      if (updateData.productID.length < 3 || updateData.productID.length > 6) {
        return res.status(400).json({
          success: false,
          message: "Product ID must be between 3 and 6 characters",
        });
      }

      // Validate productID format (only letters and numbers)
      if (!/^[a-zA-Z0-9]+$/.test(updateData.productID)) {
        return res.status(400).json({
          success: false,
          message: "Product ID can only contain letters and numbers",
        });
      }
    }

    // Validate price if provided
    if (updateData.pPrice !== undefined) {
      const priceValue = parseFloat(updateData.pPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be greater than 0",
        });
      }
      updateData.pPrice = priceValue;
    }

    // Validate quantity if provided
    if (updateData.pQuantity !== undefined) {
      const quantityValue = parseInt(updateData.pQuantity);
      if (isNaN(quantityValue) || quantityValue < 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be 0 or greater",
        });
      }

      // Check for leading zeros (except for "0" itself)
      if (
        updateData.pQuantity.startsWith("0") &&
        updateData.pQuantity !== "0"
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity cannot start with zero",
        });
      }

      updateData.pQuantity = quantityValue;
    }

    // Validate category if provided
    if (
      updateData.pCategory !== undefined &&
      !/^[a-zA-Z0-9\s]+$/.test(updateData.pCategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Category can only contain letters, digits, and spaces",
      });
    }

    // Handle image upload if file is provided
    if (req.file) {
      // Upload file to Cloudinary
      const uploadResult = await uploadToCloudinary(
        req.file,
        "petverse/products"
      );
      updateData.pImage = uploadResult.url;
    }

    // Find and update product
    const updatedProduct = await Product.findOneAndUpdate(
      { productID: productId },
      updateData,
      { new: true } // Return updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find and delete product
    const deletedProduct = await Product.findOneAndDelete({
      productID: productId,
    });

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// Toggle product status (Active/Inactive)
export const toggleProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;

    // Find product
    const product = await Product.findOne({ productID: productId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Toggle status
    const newStatus = product.status === "Active" ? "Inactive" : "Active";

    // Update product status
    const updatedProduct = await Product.findOneAndUpdate(
      { productID: productId },
      { status: newStatus },
      { new: true }
    );

    res.status(200).json({
      success: true,
      product: updatedProduct,
      message: `Product ${newStatus.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Error toggling product status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle product status",
      error: error.message,
    });
  }
};

// Get best-selling products (only if product is in 2 or more orders)
export const getBestSellers = async (req, res) => {
  try {
    const bestSellers = await Order.aggregate([
      { $match: { paymentStatus: { $in: ["Paid", "success"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            productID: "$items.productID",
            orderID: "$_id", // count distinct orders
          },
          quantity: { $sum: "$items.pQuantity" },
        },
      },
      {
        $group: {
          _id: "$_id.productID", // group by product
          totalSold: { $sum: "$quantity" },
          orderCount: { $sum: 1 }, // number of distinct orders
        },
      },
      { $match: { orderCount: { $gte: 2 } } }, // only products in >=2 orders (changed from $gt to $gte)
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    const productIDs = bestSellers.map((p) => p._id.toString());
    const products = await Product.find({
      productID: { $in: productIDs },
    }).lean();

    const productsWithSales = products.map((p) => {
      const saleData = bestSellers.find(
        (b) => b._id.toString() === p.productID
      );
      return {
        ...p,
        totalSold: saleData?.totalSold || 0,
        orderCount: saleData?.orderCount || 0,
      };
    });

    res.status(200).json({
      success: true,
      products: productsWithSales,
      message: "Best sellers fetched successfully",
    });
  } catch (err) {
    console.error("BestSellers Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch best sellers",
      error: err.message,
    });
  }
};
