import React from "react";
import { Link } from "react-router";

const ServiceCards = () => {
  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Grid with 2 cards per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Grooming Service */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <video
            className="w-full h-48 object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/grooming.mp4" type="video/mp4" />
          </video>
          <div className="p-5">
            <h2 className="text-xl font-bold">Grooming Service</h2>
            <p className="text-gray-600 mt-1">
              Add pet grooming services
            </p>
            <div className="grid grid-cols-2 gap-2 my-3">
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Bathing</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Haircuts</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Nail Trimming</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Ear Cleaning</span>
            </div>
            <Link to="/services/create?category=grooming" className="block w-full py-3 text-lg font-semibold text-center rounded-xl bg-blue-600 text-white hover:bg-orange-500 transition">
              Add Service
            </Link>
          </div>
        </div>

        {/* Boarding Service */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <video
            className="w-full h-48 object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/daycare.mp4" type="video/mp4" />
          </video>
          <div className="p-5">
            <h2 className="text-xl font-bold">Boarding Service</h2>
            <p className="text-gray-600 mt-1">
              Add pet boarding and daycare services
            </p>
            <div className="grid grid-cols-2 gap-2 my-3">
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Overnight Stay</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Daycare</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Play Areas</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">24/7 Supervision</span>
            </div>
            <Link to="/services/create?category=boarding" className="block w-full py-3 text-lg font-semibold text-center rounded-xl bg-blue-600 text-white hover:bg-orange-500 transition">
              Add Service
            </Link>
          </div>
        </div>

        {/* Training Service */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <video
            className="w-full h-48 object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/training.mp4" type="video/mp4" />
          </video>
          <div className="p-5">
            <h2 className="text-xl font-bold">Training Service</h2>
            <p className="text-gray-600 mt-1">
              Add pet training and behavior modification services
            </p>
            <div className="grid grid-cols-2 gap-2 my-3">
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Basic Commands</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Behavior Training</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Agility Training</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Puppy Classes</span>
            </div>
            <Link to="/services/create?category=training" className="block w-full py-3 text-lg font-semibold text-center rounded-xl bg-blue-600 text-white hover:bg-orange-500 transition">
              Add Service
            </Link>
          </div>
        </div>
        {/* Veterinary Service */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <video
            className="w-full h-48 object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/vet.mp4" type="video/mp4" />
          </video>
          <div className="p-5">
            <h2 className="text-xl font-bold">Veterinary Service</h2>
            <p className="text-gray-600 mt-1">
              Add veterinary care services
            </p>
            <div className="grid grid-cols-2 gap-2 my-3">
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Health Checkups</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Vaccinations</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Emergency Care</span>
              <span className="px-3 py-1 bg-gray-100 rounded-lg">Surgery</span>
            </div>
            <Link to="/services/create?category=veterinary" className="block w-full py-3 text-lg font-semibold text-center rounded-xl bg-blue-600 text-white hover:bg-orange-500 transition">
              Add Service
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServiceCards;