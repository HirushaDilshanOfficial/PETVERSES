import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header"; // Import the Header component

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const navigate = useNavigate();

  const roles = [
    {
      id: "petOwner",
      title: "Pet Owner",
      description: "Find trusted service providers for your beloved pets",
      icon: "🐕",
      features: [
        "Book pet care services",
        "Find trusted professionals",
        "Manage your pet profiles",
        "Track service history",
      ],
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-400",
      selectedColor: "border-blue-500 bg-blue-100",
    },
    {
      id: "serviceProvider",
      title: "Service Provider",
      description: "Offer your professional pet care services to pet owners",
      icon: "👨‍⚕️",
      features: [
        "List your services",
        "Connect with pet owners",
        "Manage your schedule",
        "Build your reputation",
      ],
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      hoverColor: "hover:border-orange-400",
      selectedColor: "border-orange-500 bg-orange-100",
    },
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigate(`/signup/${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-4xl w-full space-y-8 mt-20">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl">🐾</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Join PETVERSE Community
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your role to get started with the perfect pet care experience
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`
                relative cursor-pointer rounded-xl border-2 p-8 transition-all duration-200 transform hover:scale-105
                ${
                  selectedRole === role.id
                    ? `${role.selectedColor} shadow-lg`
                    : `${role.bgColor} ${role.borderColor} ${role.hoverColor} hover:shadow-md`
                }
              `}
              onClick={() => handleRoleSelect(role.id)}
            >
              {/* Selection Indicator */}
              {selectedRole === role.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                </div>
              )}

              {/* Role Icon */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{role.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-600 text-lg">{role.description}</p>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                {role.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex-shrink-0">
                      <i className="fas fa-check-circle text-green-500 mr-3"></i>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Select Button */}
              <div className="mt-6">
                <div
                  className={`
                    w-full py-3 px-4 rounded-lg text-center font-medium transition-colors
                    ${
                      selectedRole === role.id
                        ? "bg-green-500 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {selectedRole === role.id ? (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Selected
                    </>
                  ) : (
                    "Select This Role"
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link
            to="/login"
            className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Login
          </Link>

          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue with{" "}
            {selectedRole === "petOwner"
              ? "Pet Owner"
              : selectedRole === "serviceProvider"
              ? "Service Provider"
              : "Selected Role"}
            <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2025 PETVERSE. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
