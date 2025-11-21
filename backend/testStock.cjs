const mongoose = require("mongoose");
require("dotenv").config();

// Product model
const productSchema = new mongoose.Schema(
  {
    productID: { type: String, required: true, unique: true, trim: true },
    pName: { type: String, required: true, trim: true },
    pDescription: { type: String, required: true },
    pCategory: { type: String, required: true, trim: true },
    pPrice: { type: Number, required: true, min: 0 },
    pQuantity: { type: Number, required: true, min: 0 },
    pImage: { type: String },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

// Test the stock calculation logic
async function testStockCalculation() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    console.log("Fetching all products...");
    const products = await Product.find();
    console.log(`Found ${products.length} products`);

    console.log("\nAll products with quantities:");
    products.forEach((product) => {
      console.log(
        `- ${product.pName}: ${product.pQuantity} (ID: ${product.productID})`
      );
    });

    // Calculate stock statistics
    const outOfStockProducts = products.filter(
      (product) => product.pQuantity === 0
    );

    const lowStockProducts = products.filter(
      (product) => product.pQuantity > 0 && product.pQuantity < 5
    );

    console.log(`\nOut of stock products (${outOfStockProducts.length}):`);
    outOfStockProducts.forEach((product) => {
      console.log(`- ${product.pName}: ${product.pQuantity}`);
    });

    console.log(`\nLow stock products (${lowStockProducts.length}):`);
    lowStockProducts.forEach((product) => {
      console.log(`- ${product.pName}: ${product.pQuantity}`);
    });

    console.log(`\nSummary:`);
    console.log(`- Out of stock count: ${outOfStockProducts.length}`);
    console.log(`- Low stock count: ${lowStockProducts.length}`);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
}

testStockCalculation();
