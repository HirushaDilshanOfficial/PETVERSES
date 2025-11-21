import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  { 
    rating: { 
      type: Number, 
      min: 1, 
      max: 5, 
      required: true 
    },

    feedback: { 
      type: String, 
      required: true,
    },

    userID: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    serviceID: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Service" 
    },

    productID: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product" 
    },

    image_url: { 
      type: String 
    }
  }, 
  { timestamps: true }
); 

// ✅ delete old model if it exists in cache
const Ratings = mongoose.models.Ratings || mongoose.model("Ratings", ratingSchema);

export default Ratings;
