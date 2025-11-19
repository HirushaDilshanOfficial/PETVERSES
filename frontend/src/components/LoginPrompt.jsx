import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPrompt = ({ message = "Please log in to continue", onDismiss }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/signup");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Login Required</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogin}
            className="flex-1 bg-[#1E40AF] text-white px-4 py-2 rounded-md hover:bg-[#1E3FAF] transition"
          >
            Log In
          </button>
          <button
            onClick={handleSignup}
            className="flex-1 bg-[#F97316] text-white px-4 py-2 rounded-md hover:bg-[#F97316]/90 transition"
          >
            Sign Up
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt;