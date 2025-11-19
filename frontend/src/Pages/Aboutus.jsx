import React from "react";
import Header from "../components/Header";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-base-200 ">
        <Header/>
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Side - Image */}
        <div className="flex-1">
          <img
            src="/src/assets/images/about-pets.jpg"
            alt="About PetVerse"
            className="rounded-2xl shadow-lg w-full"
          />
        </div>

        {/* Right Side - Content */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-blue-900">About PetVerse</h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            PetVerse is an all-in-one platform that connects <strong>pet owners </strong> 
            with trusted <strong>service providers</strong>.  
            From grooming and veterinary care to training, boarding, and daily pet needs. 
            PetVerse makes pet care easier, safer, and more reliable.
          </p>

          <p className="mt-4 text-gray-600 leading-relaxed">
            We ensure that pet owners can easily explore available services, 
            compare packages, check availability, and choose the best care for their beloved pets.  
            Our mission is to build a community where every pet receives the love and care it deserves.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;