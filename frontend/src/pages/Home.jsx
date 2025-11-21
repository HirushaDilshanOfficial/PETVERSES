// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaw, FaUserCircle, FaGamepad } from "react-icons/fa";
import MiniCart from "../components/MiniCart";
import AdinHome from "../components/AdinHome";
import { useAuth, isPetOwner } from "../contexts/AuthContext";

const PawLoader = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <FaPaw className="text-[#F97316] w-16 h-16 animate-bounce" />
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user, signout } = useAuth();
  const [chatbotKey, setChatbotKey] = useState(0); // Force re-render key

  const clearChatbotData = () => {
    try {
      console.log('Clearing all chatbot data...');
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('chatling') || 
            key.toLowerCase().includes('chtl') || 
            key.includes('4714972479') ||
            key.startsWith('chatbot') ||
            key.includes('conversation') ||
            key.includes('chat_') ||
            key.includes('session') ||
            key.includes('widget')) {
          console.log('Removing localStorage key:', key);
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.toLowerCase().includes('chatling') || 
            key.toLowerCase().includes('chtl') || 
            key.includes('4714972479') ||
            key.startsWith('chatbot') ||
            key.includes('conversation') ||
            key.includes('chat_') ||
            key.includes('session') ||
            key.includes('widget')) {
          console.log('Removing sessionStorage key:', key);
          sessionStorage.removeItem(key);
        }
      });

      // Clear cookies
      const cookies = document.cookie.split(";");
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.toLowerCase().includes('chatling') || 
            name.toLowerCase().includes('chtl') ||
            name.includes('4714972479') ||
            name.startsWith('chatbot') ||
            name.includes('session') ||
            name.includes('widget')) {
          console.log('Clearing cookie:', name);
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
      });

      // Remove DOM elements
      document.querySelectorAll('*').forEach(el => {
        if (el.id && (el.id.toLowerCase().includes('chatling') || 
                     el.id.toLowerCase().includes('chtl') ||
                     el.id.includes('4714972479') ||
                     el.id.toLowerCase().includes('chatbot') ||
                     el.id.toLowerCase().includes('widget'))) {
          console.log('Removing element:', el.id);
          el.remove();
        }
      });

      // Clear window objects
      Object.keys(window).forEach(key => {
        if (key.toLowerCase().includes('chatling') ||
            key.toLowerCase().includes('chtl') ||
            key.toLowerCase().includes('chatbot') ||
            key.includes('4714972479')) {
          console.log('Clearing window object:', key);
          delete window[key];
        }
      });

      console.log('Chatbot data cleared');
    } catch (e) {
      console.error('Error clearing chatbot data:', e);
    }
  };

  const initializeChatbot = (userId) => {
    console.log('Initializing chatbot for user:', userId);
    
    // Clear first
    clearChatbotData();

    // Wait before initializing
    setTimeout(() => {
      try {
        // Set config with user-specific session
        if (!userId) {
          window.chtlConfig = { 
            chatbotId: "4714972479",
            sessionId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        } else {
          window.chtlConfig = {
            chatbotId: "4714972479",
            userId: userId,
            name: user.fullName || user.name || "",
            email: user.email || "",
            sessionId: `user_${userId}_${Date.now()}`,
            resetConversation: true,
            clearHistory: true
          };
        }

        console.log('Chatbot config:', window.chtlConfig);

        // Load script with unique URL
        const script = document.createElement("script");
        script.async = true;
        script.setAttribute("data-id", "4714972479");
        script.id = "chtl-script";
        script.src = `https://chatling.ai/js/embed.js?v=${Date.now()}&user=${userId || 'anon'}&session=${Date.now()}`;
        
        script.onload = () => {
          console.log('Chatbot loaded successfully');
          // Try additional reset methods after load
          setTimeout(() => {
            if (window.chatling) {
              if (typeof window.chatling.reset === 'function') {
                window.chatling.reset();
              }
              if (typeof window.chatling.clearHistory === 'function') {
                window.chatling.clearHistory();
              }
              if (typeof window.chatling.restart === 'function') {
                window.chatling.restart();
              }
            }
          }, 1000);
        };
        
        script.onerror = (e) => {
          console.error('Error loading chatbot:', e);
        };
        
        document.body.appendChild(script);
      } catch (e) {
        console.error('Error initializing chatbot:', e);
      }
    }, 800);
  };

  useEffect(() => {
    const currentUserId = user?.id || user?._id || null;
    
    console.log('User effect triggered:', { currentUserId, chatbotKey });
    
    // Initialize or reinitialize chatbot
    initializeChatbot(currentUserId);
    
    return () => {
      // Cleanup on unmount or before re-init
      clearChatbotData();
    };
  }, [user?.id, user?._id, chatbotKey]); // Depend on user ID and key

  // Separate effect to handle user changes
  useEffect(() => {
    const currentUserId = user?.id || user?._id || null;
    
    // Force chatbot reinitialize by changing key when user changes
    setChatbotKey(prev => prev + 1);
  }, [user?.id, user?._id]);

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
    <div className="bg-white min-h-screen font-sans text-gray-900 relative">
      {loading && <PawLoader />}

      {/* Navbar */}
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
      {/* Hero Video Section */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src="/src/assets/images/PVM.mp4"
          autoPlay
          loop
          muted
        />
      </section>

      {/* Welcome Section */}
      <section className="text-center py-8 px-6 bg-gray-50">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#F97316]">
          Welcome to PetVerse
        </h1>
        <p className="text-lg md:text-2xl mb-6 text-gray-700 italic">
          "Until one has loved an animal, a part of one's soul remains unawakened." <br />
          <br />
          – Anatole France - 
        </p>
      </section>

      {/* Advertisement Section */}
      <AdinHome />

      {/* Services Section */}
      <section id="services" className="py-16 px-6 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#F97316]">
          Our Services
        </h2>
        <div className="grid gap-10 md:grid-cols-4 max-w-6xl mx-auto">
          {/* Boarding & Daycare */}
          <div
            onClick={() => handleNavigate("/boarding")}
            className="relative bg-[#1E40AF] text-white rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform flex flex-col cursor-pointer"
          >
            <img src="/src/assets/images/NC3.jpg" alt="Boarding & Daycare" className="w-full h-48 object-cover" />
            <div className="p-6 text-center flex-1">
              <h3 className="text-xl font-semibold mb-4 flex items-center justify-center space-x-2">
                <FaPaw className="text-[#F97316] w-5 h-5 animate-bounce" />
                <span>Boarding & Daycare</span>
              </h3>
              <p>Safe and comfortable care for your pets while you're away.</p>
            </div>
          </div>

          {/* Grooming */}
          <div
            onClick={() => handleNavigate("/grooming")}
            className="relative bg-[#F97316] text-white rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform flex flex-col cursor-pointer"
          >
            <img src="/src/assets/images/pg1.jpg" alt="Grooming" className="w-full h-48 object-cover" />
            <div className="p-6 text-center flex-1">
              <h3 className="text-xl font-semibold mb-4 flex items-center justify-center space-x-2">
                <FaPaw className="text-[#1E40AF] w-5 h-5 animate-bounce" />
                <span>Grooming</span>
              </h3>
              <p>Professional grooming services to keep your pets looking their best.</p>
            </div>
          </div>

          {/* Training */}
          <div
            onClick={() => handleNavigate("/training")}
            className="relative bg-[#1E40AF] text-white rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform flex flex-col cursor-pointer"
          >
            <img src="/src/assets/images/pt1.jpg" alt="Training" className="w-full h-48 object-cover" />
            <div className="p-6 text-center flex-1">
              <h3 className="text-xl font-semibold mb-4 flex items-center justify-center space-x-2">
                <FaPaw className="text-[#F97316] w-5 h-5 animate-bounce" />
                <span>Training</span>
              </h3>
              <p>Effective training sessions for better behavior and obedience.</p>
            </div>
          </div>

          {/* Veterinary */}
          <div
            onClick={() => handleNavigate("/veterinary")}
            className="relative bg-[#F97316] text-white rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform flex flex-col cursor-pointer"
          >
            <img src="/src/assets/images/pv1.jpeg" alt="Veterinary" className="w-full h-48 object-cover" />
            <div className="p-6 text-center flex-1">
              <h3 className="text-xl font-semibold mb-4 flex items-center justify-center space-x-2">
                <FaPaw className="text-[#1E40AF] w-5 h-5 animate-bounce" />
                <span>Veterinary</span>
              </h3>
              <p>Experienced vets providing routine checkups and medical care.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shop With Us Section */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <h2 className="text-4xl font-bold text-[#F97316] mb-6">
          Shop With Us for Your Pet
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Explore our wide range of pet products and give your furry friend the best care!
        </p>
        <button
          onClick={() => handleNavigate("/products")}
          className="px-8 py-3 rounded-full bg-[#1E40AF] text-white font-semibold hover:bg-[#F97316] transition-all duration-300"
        >
          Shop Now
        </button>
      </section>

      {/* Fun Game Section */}
      <section className="py-20 px-6 bg-white text-center">
        <h2 className="text-4xl font-bold text-[#F97316] mb-8">
          Play Our Fun Game!
        </h2>
        <button
          onClick={() => handleNavigate("/game")}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <FaGamepad className="inline-block mr-2" />
          Play Our Fun Game!
        </button>
      </section>

      {/* Pet Stories Section */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <h2 className="text-4xl font-bold text-[#F97316] mb-10">
          Happy Tails: Pet Stories
        </h2>
        <p className="text-lg text-gray-600 mb-12">
          See how PetVerse has helped pet parents and their furry friends.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Story 1 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 transition-transform border">
            <img
              src="/src/assets/images//PO.jpg"
              alt="Buddy the Dog"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900">Buddy's Journey</h3>
            <p className="text-gray-600 mt-2">
              "Thanks to PetVerse's veterinary care, Buddy recovered quickly from an illness.
              Their platform made booking super easy!"
            </p>
            <span className="block mt-3 text-sm text-gray-500">– Sarah M.</span>
          </div>

          {/* Story 2 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 transition-transform border">
            <img
              src="/src/assets/images//PC3.jpg"
              alt="Luna the Cat"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900">Luna's Grooming</h3>
            <p className="text-gray-600 mt-2">
              "Luna looked absolutely gorgeous after her grooming session.
              Booking through PetVerse was a breeze!"
            </p>
            <span className="block mt-3 text-sm text-gray-500">– Daniel R.</span>
          </div>

          {/* Story 3 */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 transition-transform border">
            <img
              src="/src/assets/images/PP2.jpg"
              alt="Coco the Parrot"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900">Coco's Checkup</h3>
            <p className="text-gray-600 mt-2">
              "Coco, my parrot, got the best veterinary care.
              PetVerse's loyalty program even gave me reward points for booking!"
            </p>
            <span className="block mt-3 text-sm text-gray-500">– Ayesha K.</span>
          </div>
        </div>
      </section>

      {/* New Puppy / Kitten Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
          {/* New Puppy */}
          <div
            onClick={() => handleNavigate("/new-puppy")}
            className="relative rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <img src="/src/assets/images/ND.jpeg" alt="New Puppy" className="w-full h-64 md:h-96 object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
              <h3
                className="text-white text-4xl md:text-5xl text-center font-bold"
                style={{ fontFamily: "'Pacifico', cursive" }}
              >
                New Puppy?
              </h3>
              <p className="text-white text-xl md:text-2xl text-center font-bold mt-2 px-4">
                Get everything they need right here
              </p>
            </div>
          </div>

          {/* New Kitten */}
          <div
            onClick={() => handleNavigate("/new-kitten")}
            className="relative rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            <img src="/src/assets/images/NC3.jpg" alt="New Kitten" className="w-full h-64 md:h-96 object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
              <h3
                className="text-white text-4xl md:text-5xl text-center font-bold"
                style={{ fontFamily: "'Pacifico', cursive" }}
              >
                New Kitten?
              </h3>
              <p className="text-white text-xl md:text-2xl text-center font-bold mt-2 px-4">
                Get everything they need right here
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-16 px-6 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold text-[#F97316] mb-10">
          Why Choose PetVerse?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Happy Clients */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 transition-transform border">
            <h3 className="text-4xl font-extrabold text-gray-900 mb-2">350+</h3>
            <p className="text-gray-600 text-base">Happy Clients</p>
          </div>

          {/* Experience */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 transition-transform border">
            <h3 className="text-4xl font-extrabold text-gray-900 mb-2">5+</h3>
            <p className="text-gray-600 text-base">Years Experience</p>
          </div>

          {/* Happy Pets */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:scale-105 transition-transform border">
            <h3 className="text-4xl font-extrabold text-gray-900 mb-2">235+</h3>
            <p className="text-gray-600 text-base">Happy Pets</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-10 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">PetVerse</h3>
            <p>
              Caring for your pets with love and professionalism. We provide grooming,
              boarding, training, and veterinary care.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#services" className="hover:text-white">Services</a></li>
              <li><a href="#about" className="hover:text-white">About Us</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
              <li><a href="#packages" className="hover:text-white">View Packages</a></li>
              <li>
                <button 
                  onClick={() => handleNavigate("/terms")} 
                  className="text-left w-full hover:text-white"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigate("/policy")} 
                  className="text-left w-full hover:text-white"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
            <p>Email: support@petverse.com</p>
            <p>Phone: +94 77 123 4567</p>
            <p>Address: Colombo, Sri Lanka</p>
          </div>
        </div>

        <div className="text-center border-t border-gray-600 mt-10 pt-6 text-sm text-gray-400">
          ©️ {new Date().getFullYear()} PetVerse All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;