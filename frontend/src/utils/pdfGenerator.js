import { jsPDF } from "jspdf";

const getImageBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Important for same-origin images
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/jpeg");
      resolve(dataURL);
    };
    img.onerror = function () {
      reject(new Error("Failed to load image at " + url));
    };
    img.src = url;
  });
};

export const generateServiceProviderReport = async (
  providerData,
  servicesData
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  //Load logo image from public folder
  const logoBase64 = await getImageBase64("/images/lol.jpeg");

  // Helper function to draw table manually
  const drawTable = (doc, startY, headers, data, options = {}) => {
    const {
      cellWidth = 40,
      cellHeight = 8,
      headerColor = [30, 64, 175],
      borderColor = [200, 200, 200],
      startX = 15,
    } = options;

    let currentY = startY;

    // Draw headers
    doc.setFillColor(...headerColor);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    let currentX = startX;
    headers.forEach((header, index) => {
      const width = Array.isArray(cellWidth) ? cellWidth[index] : cellWidth;
      doc.rect(currentX, currentY, width, cellHeight, "FD");
      doc.text(header, currentX + 2, currentY + 5.5);
      currentX += width;
    });

    currentY += cellHeight;

    // Draw data rows
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    data.forEach((row, rowIndex) => {
      currentX = startX;
      const fillColor = rowIndex % 2 === 0 ? [255, 255, 255] : [245, 245, 245];

      row.forEach((cell, cellIndex) => {
        const width = Array.isArray(cellWidth)
          ? cellWidth[cellIndex]
          : cellWidth;
        doc.setFillColor(...fillColor);
        doc.rect(currentX, currentY, width, cellHeight, "FD");
        doc.setDrawColor(...borderColor);
        doc.rect(currentX, currentY, width, cellHeight, "S");

        // Handle text wrapping for long content
        const text = String(cell);
        if (text.length > 15) {
          const splitText = doc.splitTextToSize(text, width - 4);
          doc.text(splitText[0], currentX + 2, currentY + 5.5);
        } else {
          doc.text(text, currentX + 2, currentY + 5.5);
        }

        currentX += width;
      });
      currentY += cellHeight;
    });

    return currentY;
  };

  // Header function
  const addHeader = (doc, pageNumber = 1) => {
    // Header background
    doc.setFillColor(30, 64, 175); // Blue background
    doc.rect(0, 0, pageWidth, 40, "F");
    
    // Updated to use a more professional logo
    doc.addImage(logoBase64, "JPEG", 15, 8, 24, 24);
    // doc.addImage("./src/assets/images/lol.jpeg", "JPEG", 15, 8, 24, 24);
    // doc.setFillColor(255, 255, 255);
    //doc.rect(15, 8, 24, 24, "F");
    // doc.setFontSize(10);
    // doc.setTextColor(30, 64, 175);
    //doc.setFont("helvetica", "bold");
    //doc.text("PET", 19, 18);
    //doc.text("LOGO", 18, 25);

    // Company name and title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("PETVERSE", 45, 18);

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Service Provider Report", 45, 26);

    // Contact info
    doc.setFontSize(8);
    doc.text("New Kandy Road, Malabe • Tel: 0912345673", 45, 32);
    doc.text("www.petverse.com • hello@petverse.com", 45, 36);

    // Generated date (right aligned)
    const reportDate = new Date();
    const dateString = "Generated on: " + reportDate.toLocaleDateString() + " at " + reportDate.toLocaleTimeString();
    doc.setFontSize(8);
    const dateWidth = doc.getTextWidth(dateString);
    doc.text(dateString, pageWidth - dateWidth - 15, 32);

    // Page number (right aligned)
    const pageText = "Page " + pageNumber;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, pageWidth - pageTextWidth - 15, 36);
  };

  // Footer function
  const addFooter = (doc) => {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont("helvetica", "normal");
    const footerText = "©️ 2025 PETVERSE. All rights reserved.";
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
  };

  // Add header and footer to first page
  addHeader(doc);
  addFooter(doc);

  let yPosition = 55; // Start below header

  // Service Provider Information Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("Service Provider Information", 15, yPosition);
  yPosition += 10;

  // Provider details table
  const providerInfo = [
    ["Name", providerData.name || "N/A"],
    ["Email", providerData.email || "N/A"],
    ["Phone", providerData.phone || "N/A"],
    ["Location", providerData.location || "N/A"],
    ["Join Date", providerData.joinDate || "N/A"],
    ["Verification Status", providerData.verificationStatus || "N/A"],
  ];

  yPosition =
    drawTable(doc, yPosition, ["Field", "Value"], providerInfo, {
      cellWidth: [60, 80],
      startX: 15,
    }) + 10;

  // Analytics Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("Analytics Summary", 15, yPosition);
  yPosition += 10;

  // Calculate availability: 100% if services exist, 0% if no services
  const calculatedAvailability =
    (providerData.metrics?.totalServices || 0) > 0 ? 100 : 0;

  const analyticsData = [
    ["Total Services", providerData.metrics?.totalServices || 0],
    [
      "Average Price",
      "Rs. " + (providerData.metrics?.avgPrice || 0).toFixed(2),
    ],
    ["Availability", calculatedAvailability + "%"],
  ];

  yPosition =
    drawTable(doc, yPosition, ["Metric", "Value"], analyticsData, {
      cellWidth: [60, 80],
      headerColor: [249, 115, 22],
      startX: 15,
    }) + 15;

  // Check if we need a new page for services
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    addHeader(doc, 2);
    addFooter(doc);
    yPosition = 55;
  }

  // Services Details Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 64, 175);
  doc.text("Services Details", 15, yPosition);
  yPosition += 10;

  if (servicesData && servicesData.length > 0) {
    // Prepare services data for table
    const servicesTableData = servicesData.map((service, index) => [
      String(index + 1),
      service.title || "N/A",
      service.category || "N/A",
      service.address || "N/A",
      service.packages && service.packages.length > 0
        ? service.packages.length + " packages"
        : "No packages",
      service.createdAt
        ? new Date(service.createdAt).toLocaleDateString()
        : "N/A",
    ]);

    yPosition =
      drawTable(
        doc,
        yPosition,
        [
          "#",
          "Service Title",
          "Category",
          "Location",
          "Packages",
          "Created Date",
        ],
        servicesTableData,
        {
          cellWidth: [15, 35, 25, 30, 25, 25],
          startX: 15,
        }
      ) + 15;

    // Package Details for each service
    servicesData.forEach((service, serviceIndex) => {
      if (service.packages && service.packages.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          addHeader(doc, doc.internal.getNumberOfPages());
          addFooter(doc);
          yPosition = 55;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 64, 175);
        doc.text(service.title + " - Package Details", 15, yPosition);
        yPosition += 10;

        const packageData = service.packages.map((pkg, index) => [
          String(index + 1),
          pkg.name || ("Package " + (index + 1)),
          "Rs. " + (pkg.price || 0).toFixed(2),
          pkg.duration || "N/A",
          pkg.services && pkg.services.length > 0
            ? pkg.services.join(", ")
            : "No services listed",
        ]);

        yPosition =
          drawTable(
            doc,
            yPosition,
            ["#", "Package Name", "Price", "Duration", "Included Services"],
            packageData,
            {
              cellWidth: [15, 35, 25, 25, 75],
              headerColor: [249, 115, 22],
              startX: 15,
            }
          ) + 10;
      }
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text("No services found for this provider.", 15, yPosition);
  }

  // Download the PDF
  const fileName = "service-provider-report-" +
    (providerData.name?.replace(/\s+/g, "-").toLowerCase() || "unknown") +
    "-" + new Date().toISOString().slice(0, 10) + ".pdf";
  doc.save(fileName);
};