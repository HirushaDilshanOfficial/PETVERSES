import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import MiniCart from "./MiniCart";
import { useAuth, isPetOwner } from "../contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user, signout } = useAuth();

  const handleNavigate = (path) => {
    setLoading(true);
    setTimeout(() => {
      navigate(path);
      setLoading(false);
    }, 700);
  };

  const handleProfileClick = () => {
    if (!user) {
      handleNavigate("/login");
      return;
    }

    // Redirect based on user role - only pet owners should see profile icon
    if (isPetOwner(user)) {
      handleNavigate("/dashboard/pet-owner/profile");
    } else {
      // For other roles, redirect to login
      handleNavigate("/login");
    }
  };

  const handleLogout = async () => {
    try {
      await signout();
      handleNavigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-[#1E40AF] text-white px-6 py-4 flex justify-between items-center">
      <div className="flex items-center">
        <img src="/src/assets/images/lol.jpeg" alt="PetVerse Logo" className="h-12 w-12 mr-3" />
        <span className="font-bold text-xl">PETVERSE</span>
      </div>
      <ul className="flex space-x-6 font-semibold">
        {["Home", "About", "Services", "Products", "FAQ", "Contact Us"].map((link) => (
          <li key={link}>
            {link === "Services" ? (
              <button
                onClick={() => handleNavigate("/services")}
                className="px-4 py-2 rounded-full hover:bg-[#F97316] transition-all duration-300"
              >
                {link}
              </button>
            ) : link === "FAQ" ? (
              <button
                onClick={() => handleNavigate("/faq")}
                className="px-4 py-2 rounded-full hover:bg-[#F97316] transition-all duration-300"
              >
                {link}
              </button>
            ) : link === "About" ? (
              <button
                onClick={() => handleNavigate("/about")}
                className="px-4 py-2 rounded-full hover:bg-[#F97316] transition-all duration-300"
              >
                {link}
              </button>
            ) : link === "Products" ? (
              <button
                onClick={() => handleNavigate("/products")}
                className="px-4 py-2 rounded-full hover:bg-[#F97316] transition-all duration-300"
              >
                {link}
              </button>
            ) : link === "Contact Us" ? (
              <button
                onClick={() => handleNavigate("/contactus")}
                className="px-4 py-2 rounded-full hover:bg-[#F97316] transition-all duration-300"
              >
                {link}
              </button>
            ) : (
              <button
                onClick={() => handleNavigate("/")}
                className="px-4 py-2 rounded-full hover:bg-[#F97316] transition-all duration-300"
              >
                {link}
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center space-x-4">
        <MiniCart />
        {user && isPetOwner(user) ? (
          <div className="relative group">
            <button
              onClick={handleProfileClick}
              className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white text-[#1E40AF] font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              <FaUserCircle className="text-xl" />
              <span>Profile</span>
            </button>
            {/* Dropdown menu for logged-in pet owners */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
              <button
                onClick={handleProfileClick}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={() => handleNavigate("/login")}
              className="px-4 py-2 rounded-full bg-white text-[#1E40AF] font-semibold hover:bg-gray-200 transition-all duration-300"
            >
              Log In
            </button>
            <button
              onClick={() => handleNavigate("/signup")}
              className="px-4 py-2 rounded-full bg-[#F97316] text-white font-semibold hover:bg-[#ea580c] transition-all duration-300"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;