// src/components/AdinHome.jsx
import React, { useState, useEffect } from "react";
import { FaTimes, FaTag, FaGift, FaStar } from "react-icons/fa";
import axios from "axios";

const AdinHome = () => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [advertisements, setAdvertisements] = useState([]);

  // Fetch published advertisements from backend
  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api"}/advertisements/published`
        );
        setAdvertisements(response.data);
      } catch (error) {
        console.error("Error fetching advertisements:", error);
        // Fallback to sample data if API call fails
        setAdvertisements([
          {
            _id: 1,
            title: "Premium Pet Food Sale",
            description: "Up to 30% off on premium pet food brands",
            imageUrl: "/pet-food-ad.jpg",
            discount: "30% OFF",
            type: "sale",
            backgroundColor: "bg-gradient-to-r from-orange-500 to-red-500",
            buttonText: "Shop Now",
            validUntil: "2025-10-15"
          },
          {
            _id: 2,
            title: "Free Health Checkup",
            description: "Book a grooming service and get a free basic health checkup",
            imageUrl: "/vet-checkup-ad.jpg",
            discount: "FREE",
            type: "offer",
            backgroundColor: "bg-gradient-to-r from-blue-600 to-purple-600",
            buttonText: "Book Now",
            validUntil: "2025-11-01"
          },
          {
            _id: 3,
            title: "New Pet Owner Bundle",
            description: "Complete starter pack for new pet parents",
            imageUrl: "/new-pet-bundle.jpg",
            discount: "25% OFF",
            type: "bundle",
            backgroundColor: "bg-gradient-to-r from-green-500 to-teal-500",
            buttonText: "Get Bundle",
            validUntil: "2025-12-01"
          }
        ]);
      }
    };

    fetchAdvertisements();
  }, []);

  // Auto-rotate ads every 5 seconds
  useEffect(() => {
    if (advertisements.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => 
        (prevIndex + 1) % advertisements.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [advertisements.length]);

  const handleAdClick = (ad) => {
    setSelectedAd(ad);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAd(null);
  };

  // If no advertisements, don't render the component
  if (advertisements.length === 0) {
    return null;
  }

  const currentAd = advertisements[currentAdIndex];

  // Function to generate background color based on ad properties
  const getBackgroundColor = (ad) => {
    // Use predefined colors for sample data or generate based on ad properties
    if (ad.backgroundColor) {
      return ad.backgroundColor;
    }
    
    // Generate color based on ad title or other properties
    const colors = [
      "bg-gradient-to-r from-orange-500 to-red-500",
      "bg-gradient-to-r from-blue-600 to-purple-600",
      "bg-gradient-to-r from-green-500 to-teal-500",
      "bg-gradient-to-r from-pink-500 to-rose-500",
      "bg-gradient-to-r from-indigo-500 to-blue-500"
    ];
    
    // Use ad ID or title to determine color
    const index = ad._id ? 
      (typeof ad._id === 'string' ? ad._id.charCodeAt(0) : ad._id) % colors.length :
      ad.id % colors.length;
      
    return colors[index];
  };

  // Function to get ad type based on title or description
  const getAdType = (ad) => {
    if (ad.type) return ad.type;
    
    const title = ad.title.toLowerCase();
    if (title.includes('sale') || title.includes('off') || title.includes('discount')) {
      return 'sale';
    } else if (title.includes('free') || title.includes('offer')) {
      return 'offer';
    } else if (title.includes('bundle') || title.includes('pack')) {
      return 'bundle';
    } else {
      return 'promotion';
    }
  };

  // Function to get discount text
  const getDiscountText = (ad) => {
    if (ad.discount) return ad.discount;
    
    // Try to extract discount from title or description
    const text = (ad.title + ' ' + ad.description).toLowerCase();
    if (text.includes('free')) return 'FREE';
    if (text.includes('off')) {
      const match = text.match(/(\d+)%/);
      if (match) return `${match[1]}% OFF`;
    }
    return 'SPECIAL';
  };

  return (
    <div className="py-16 px-6 bg-[#1C2A4A]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#F97316] mb-4">
            🎁 Special Offers & Deals
          </h2>
          <p className="text-gray-300 text-lg">
            Don't miss out on these amazing deals for your furry friends!
          </p>
        </div>

        {/* Main Advertisement Display */}
        <div className="relative">
          <div 
            className={`${getBackgroundColor(currentAd)} rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer`}
            onClick={() => handleAdClick(currentAd)}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left side - Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center text-white">
                <div className="flex items-center mb-4">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold">
                    {getAdType(currentAd).toUpperCase()}
                  </span>
                  <div className="ml-3 flex items-center">
                    <FaTag className="mr-1" />
                    <span className="font-bold text-xl">{getDiscountText(currentAd)}</span>
                  </div>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  {currentAd.title}
                </h3>
                
                <p className="text-lg mb-6 opacity-90">
                  {currentAd.description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <button className="bg-white text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
                    {currentAd.buttonText || "Learn More"}
                  </button>
                  <div className="text-sm opacity-75">
                    Valid until: {currentAd.validUntil ? new Date(currentAd.validUntil).toLocaleDateString() : "Limited Time"}
                  </div>
                </div>
              </div>

              {/* Right side - Image */}
              <div className="relative h-64 md:h-auto">
                <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                <img 
                  src={currentAd.imageUrl || "https://via.placeholder.com/400x300/F97316/FFFFFF?text=Pet+Advertisement"} 
                  alt={currentAd.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300/F97316/FFFFFF?text=Pet+Advertisement";
                  }}
                />
                {/* Floating discount badge */}
                <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-sm flex items-center">
                  <FaStar className="mr-1" />
                  {getDiscountText(currentAd)}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-6 space-x-2">
            {advertisements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentAdIndex 
                    ? 'bg-[#F97316] scale-125' 
                    : 'bg-gray-500 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        
      </div>

      {/* Modal for Ad Details */}
      {showModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="relative">
              <img 
                src={selectedAd.imageUrl || "https://via.placeholder.com/600x300/F97316/FFFFFF?text=Pet+Advertisement"} 
                alt={selectedAd.title}
                className="w-full h-64 object-cover rounded-t-2xl"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/600x300/F97316/FFFFFF?text=Pet+Advertisement";
                }}
              />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
              >
                <FaTimes />
              </button>
              <div className="absolute bottom-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full font-bold">
                {getDiscountText(selectedAd)}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {selectedAd.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedAd.description}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">Offer Details:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Valid until: {selectedAd.validUntil ? new Date(selectedAd.validUntil).toLocaleDateString() : "Limited Time"}</li>
                  <li>• Available for all registered users</li>
                  <li>• Terms and conditions apply</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 bg-[#F97316] text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all">
                  {selectedAd.buttonText || "Learn More"}
                </button>
                <button 
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdinHome;