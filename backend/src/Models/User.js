import mongoose from "mongoose";

// User Schema for all user types (Admin, Service Provider, Pet Owner)
const userSchema = new mongoose.Schema(
  {
    // Basic user information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    // Firebase Authentication UID
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    // User role - determines access level
    role: {
      type: String,
      enum: ["admin", "serviceProvider", "petOwner"],
      required: true,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Service Provider specific fields
    address: {
      type: String,
      required: function () {
        return this.role === "serviceProvider";
      },
    },
    nicNumber: {
      type: String,
      required: function () {
        return this.role === "serviceProvider";
      },
      unique: true,
      sparse: true, // allows null values but enforces uniqueness when present
    },

    // Document URLs for Service Providers (stored in Cloudinary)
    documents: {
      nicFrontPhoto: {
        type: String, // Cloudinary URL
        // Not required during registration, uploaded separately
      },
      nicBackPhoto: {
        type: String, // Cloudinary URL
        // Not required during registration, uploaded separately
      },
      facePhoto: {
        type: String, // Cloudinary URL
        // Not required during registration, uploaded separately
      },
      businessDocuments: [
        {
          fileName: String,
          fileUrl: String, // Cloudinary URL
          uploadDate: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // Verification status for Service Providers
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      isRejected: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to admin who verified
      },
      rejectionReason: String,
    },

    // Profile information
    profilePicture: {
      type: String, // Cloudinary URL
    },

    // Additional metadata
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    lastLogin: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Index for better query performance
// Note: email and firebaseUid already have indexes due to unique: true
userSchema.index({ role: 1 });
userSchema.index({ "verification.isVerified": 1 });

// Pre-save middleware to update the updatedAt field
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to check if user is verified (for service providers)
userSchema.methods.isVerifiedServiceProvider = function () {
  return this.role === "serviceProvider" && this.verification.isVerified;
};

// Static method to find unverified service providers
userSchema.statics.findUnverifiedServiceProviders = function () {
  return this.find({
    role: "serviceProvider",
    "verification.isVerified": false,
  });
};

// Static method to create a new user with role validation
userSchema.statics.createUser = async function (userData) {
  const validRoles = ["admin", "serviceProvider", "petOwner"];

  if (!validRoles.includes(userData.role)) {
    throw new Error("Invalid user role");
  }

  // Create new user
  const user = new this(userData);
  return await user.save();
};

// Virtual for full document count (for service providers)
userSchema.virtual("totalDocuments").get(function () {
  if (this.role === "serviceProvider" && this.documents) {
    let count = 0;
    if (this.documents.nicFrontPhoto) count++;
    if (this.documents.nicBackPhoto) count++;
    if (this.documents.facePhoto) count++;
    if (this.documents.businessDocuments)
      count += this.documents.businessDocuments.length;
    return count;
  }
  return 0;
});

// Transform output to remove sensitive information
userSchema.methods.toJSON = function () {
  const user = this.toObject();

  // Remove sensitive fields from response
  delete user.__v;

  return user;
};

const User = mongoose.model("User", userSchema);

export default User;