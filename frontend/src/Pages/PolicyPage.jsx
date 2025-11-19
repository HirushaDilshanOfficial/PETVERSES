// src/pages/PolicyPage.jsx
import React from "react";

const PolicyPage = () => {
  const policy = {
    title: "Privacy, Refund & Cancellation Policy",
    lastUpdated: "September 24, 2025",
    sections: [
      {
        heading: "Privacy Policy",
        content: [
          {
            subheading: "Information We Collect",
            text: [
              "Personal Information: name, email, phone number, billing/shipping address.",
              "Pet Information: pet’s name, age, breed, medical history (as provided by you).",
              "Payment Information: processed through secure third-party gateways; PetVerse does not store sensitive card details.",
              "Usage Information: device type, browser, IP address, and activity on our Platform."
            ]
          },
          {
            subheading: "How We Use Your Information",
            text: [
              "To manage bookings, services, and purchases.",
              "To send confirmations, reminders, and service/product updates.",
              "To improve our offerings and user experience.",
              "To process payments and handle refunds.",
              "For legal, compliance, and security purposes."
            ]
          },
          {
            subheading: "Sharing of Information",
            text: [
              "Service Providers & Vendors: veterinarians, groomers, trainers, and product suppliers (to complete your booking/order).",
              "Third-Party Services: payment processors, logistics, and analytics partners.",
              "Legal Authorities: when required by law or to protect user safety.",
              "We do not sell or rent your personal information to third parties."
            ]
          },
          {
            subheading: "Data Security",
            text: [
              "We apply encryption, secure servers, and restricted access to protect your data. No system is 100% secure."
            ]
          },
          {
            subheading: "Your Rights",
            text: [
              "Access, update, or correct your data.",
              "Request account or data deletion (subject to legal obligations).",
              "Opt out of promotional messages."
            ]
          },
          {
            subheading: "Cookies",
            text: [
              "We use cookies to enhance browsing, analyze traffic, and personalize content. Some features may not work if cookies are disabled."
            ]
          },
          {
            subheading: "Children’s Privacy",
            text: [
              "PetVerse is not directed to children under 13. We do not knowingly collect their data without parental consent."
            ]
          }
        ]
      },
      {
        heading: "Refund & Cancellation Policy",
        content: [
          {
            subheading: "Service Bookings (Veterinary, Grooming, Boarding, Training)",
            text: [
              "Customer Cancellations: Full refund if canceled at least 5 hours before the scheduled time; Service provider specific cancellation terms apply for prepaid services.",
              "Rescheduling: Allowed subject to availability of the service provider.",
              "Provider Cancellations: If a provider cancels, you may reschedule or request a full refund."
            ]
          },
          {
            subheading: "Product Purchases (Online Store)",
            text: [
              "Returns: Accepted within 10 days if products are unused, unopened, and in original packaging.",
              "Non-Returnable Items: Perishable goods (food, medicine), grooming products, and personalized items.",
              "Refunds: Issued within 10 business days to the original payment method after inspection.",
              "Damaged/Defective Items: Must be reported within 48 hours of delivery with proof (photo/video)."
            ]
          },
          {
            subheading: "Payments",
            text: [
              "Refunds are processed using the original payment method.",
              "Any transaction/processing fees may be deducted unless the refund is due to our error."
            ]
          }
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
        {policy?.title || "Policy"}
      </h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "50px", fontSize: "16px" }}>
        <strong>Last Updated:</strong> {policy?.lastUpdated || "-"}
      </p>

      {policy?.sections?.map((section, idx) => (
        <div key={idx} style={{ marginBottom: "40px" }}>
          <h2 style={{
            borderBottom: "2px solid #ddd",
            paddingBottom: "8px",
            color: "#0B3D91", // Highlight heading
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
                  color: "#1E4DB7", // Highlight subheading
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

export default PolicyPage;