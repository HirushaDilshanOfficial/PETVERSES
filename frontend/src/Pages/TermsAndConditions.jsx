// src/pages/TermsPage.jsx
import React from "react";

const TermsAndConditionsPage = () => {
  const terms = {
    title: "Terms and Conditions",
    lastUpdated: "September 24, 2025",
    sections: [
      {
        heading: "About PetVerse",
        content: [
          {
            text: [
              "PetVerse is an online platform in the pet wellness and care industry, offering both service-based and commerce-based solutions. Through PetVerse, users can:"
            ]
          },
          {
            subheading: "Services",
            text: [
              "Book veterinary consultations, grooming session, trainig session for your beloved pets.",
              "Schedule grooming, boarding and training services.",
              "Shop for pet products, including food, grooming supplies, accessories, toys, and healthcare items."
            ]
          },
          {
            text: [
              "PetVerse connects users with trusted service providers and vendors but does not directly deliver veterinary or grooming services unless otherwise specified."
            ]
          }
        ,
      {
        subheading: "Eligibility",
        
            text: [
              "Be at least 18 years old or the age of majority in your jurisdiction.",
              "Provide accurate and up-to-date account information.",
              "Use the Platform only for lawful purposes and in accordance with these Terms."
            ]
      },
      {
        subheading: "User Accounts",

            text: [
              "You are responsible for maintaining the confidentiality of your account credentials.",
              "You agree not to share your account or use another person’s account without permission.",
              "PetVerse reserves the right to suspend or terminate accounts if misuse or fraudulent activity is detected."
            ]
 
      },
      {
        subheading: "Services and Bookings",

            text: [
              "PetVerse provides a platform to connect pet owners with independent service providers (e.g., veterinarians, groomers, trainers).",
              "Booking confirmations, cancellations, and rescheduling are subject to each provider’s availability and policies.",
              "PetVerse is not liable for the quality, safety, or outcome of services delivered by third-party providers."
            ]

      },
      {
        subheading: "Online Store Purchases",

            text: [
              "All product prices are displayed in Rs. and are subject to change without prior notice.",
              "Orders are subject to availability. In case a product is unavailable after ordering, PetVerse will notify you and issue a refund if applicable.",
              "Shipping, delivery timelines, and return/refund policies will be provided at checkout or in a separate policy."
            ]

      },
      {
        subheading: "Payments",

            text: [
              "Payments for products and services must be made through the Platform’s approved payment methods.",
              "Users are responsible for providing accurate billing and payment information.",
              "Any applicable taxes, fees, or charges will be added to the final amount."
            ]
      },
      {
        subheading: "Cancellations and Refunds",
            text: [
              "Cancellations and refunds for services (e.g., grooming, boarding, training) depend on the policies of the individual service provider.",
              "For products, PetVerse’s return and refund policy applies (details provided separately).",
              "PetVerse reserves the right to refuse refunds if misuse, fraud, or policy violations are detected."
            ]
      },
      {
        subheading: "User Responsibilities",
            text: [
              "Provide accurate information about your pet(s).",
              "Ensure that your pet is healthy and fit for the chosen services.",
              "Respect service providers’ rules, schedules, and policies.",
              "Not use the Platform for unlawful, harmful, or fraudulent activities."
            ]
      },
      {
        subheading: "Intellectual Property",
            text: [
              "All content on PetVerse, including logos, designs, text, graphics, and software, is the property of PetVerse and protected under intellectual property laws.",
              "You may not copy, reproduce, or distribute Platform content without prior written consent."
            ]
      },
      {
        subheading: "Limitation of Liability",
            text: [
              "PetVerse provides the Platform “as is” and makes no warranties about uninterrupted or error-free access.",
              "PetVerse is not responsible for the quality of services/products offered by independent providers or vendors.",
              "To the fullest extent permitted by law, PetVerse shall not be liable for damages arising from the use of the Platform."
            ]
      },
      {
        subheading: "Privacy",

            text: [
              "Your use of PetVerse is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal data."
            ]
      },
      {
        subheading: "Termination",
            text: [
              "PetVerse may suspend or terminate your account if you violate these Terms, engage in fraudulent activities, or misuse the Platform."
            ]
      },
      {
        subheading: "Changes to Terms",
            text: [
              "PetVerse reserves the right to update these Terms at any time. Updates will be posted on the Platform, and continued use after updates constitutes acceptance of the revised Terms."
            ]
      },
      ]
      },
      {
        heading: "Contact Us",
        content: [
          {
            text: [
              "Email: mailtopetverse@gmail.com",
              "Phone: +94 770515569",
              "Address: New Kandy Road, Malabe, Sri Lanka"
            ]
          }
        ]
      }
    ]
  };

  return (
    <div style={{
      backgroundColor: "#ffffff",
      color: "#333",
      fontFamily: "Arial, sans-serif",
      padding: "40px 60px",
      width: "100%",
      minHeight: "100vh",
      boxSizing: "border-box"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "10px", fontSize: "32px", color: "#111" }}>
        {terms?.title || "Terms"}
      </h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "50px", fontSize: "16px" }}>
        <strong>Last Updated:</strong> {terms?.lastUpdated || "-"}
      </p>

      {terms?.sections?.map((section, idx) => (
        <div key={idx} style={{ marginBottom: "40px" }}>
          <h2 style={{
            borderBottom: "2px solid #ddd",
            paddingBottom: "8px",
            color: "#0B3D91",
            fontSize: "24px",
            fontWeight: "600"
          }}>
            {section.heading || ""}
          </h2>

          {section.content?.map((item, i) => (
            <div key={i} style={{ marginLeft: "20px", marginTop: "20px" }}>
              {item.subheading && (
                <h3 style={{
                  marginBottom: "12px",
                  color: "#1E4DB7",
                  fontSize: "20px",
                  fontWeight: "500"
                }}>
                  {item.subheading}
                </h3>
              )}
              {item.text && (
                <ul style={{ lineHeight: "1.8", marginLeft: "20px", fontSize: "16px" }}>
                  {item.text.map((line, j) => (
                    <li key={j} style={{ marginBottom: "8px" }}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TermsAndConditionsPage;