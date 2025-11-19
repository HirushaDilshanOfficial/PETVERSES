import nodemailer from "nodemailer";

// Nodemailer setup - Initialize as null
let transporter = null;

// Function to initialize transporter when needed
const initializeTransporter = () => {
  // Only create transporter if it doesn't exist and env vars are available
  if (!transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER, // your_email@gmail.com
          pass: process.env.EMAIL_PASS, // app password
        },
      });

      // Verify transporter configuration
      transporter.verify((error, success) => {
        if (error) {
          console.error("Email transporter verification failed:", error);
        } else {
          console.log("Email transporter is ready to send emails");
        }
      });
    } catch (err) {
      console.error("Failed to create email transporter:", err);
      transporter = null;
    }
  }
  return transporter;
};

// Initialize transporter immediately
initializeTransporter();

// Send OTP email
export const sendOtpEmail = async (email, otp) => {
  // Ensure transporter is initialized
  const currentTransporter = initializeTransporter();

  // If transporter is not available, skip sending email
  if (!currentTransporter) {
    console.warn("Email transporter not available, skipping email send");
    return;
  }

  try {
    await currentTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Payment",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    // Don't throw the error to prevent order creation failure
    // Just log it and continue
  }
};

// Send appointment approval email
export const sendAppointmentApprovalEmail = async (email, appointment) => {
  // Ensure transporter is initialized
  const currentTransporter = initializeTransporter();

  // If transporter is not available, skip sending email
  if (!currentTransporter) {
    console.warn("Email transporter not available, skipping email send");
    return;
  }

  try {
    await currentTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Appointment Approved - PETVERSE",
      text: `Your appointment for ${appointment.pet_name} has been approved!\n\nDetails:\nPackage: ${appointment.package}\nDate: ${appointment.date}\nTime: ${appointment.time}\n\nThank you for choosing PETVERSE!`,
    });
  } catch (err) {
    console.error("Failed to send appointment approval email:", err);
    // Just log it and continue
  }
};

// Send appointment rejection email
export const sendAppointmentRejectionEmail = async (
  email,
  appointment,
  reason
) => {
  // Ensure transporter is initialized
  const currentTransporter = initializeTransporter();

  // If transporter is not available, skip sending email
  if (!currentTransporter) {
    console.warn("Email transporter not available, skipping email send");
    return;
  }

  try {
    await currentTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Appointment Rejected - PETVERSE",
      text: `We're sorry, but your appointment for ${appointment.pet_name} has been rejected.\n\nReason: ${reason}\n\nPackage: ${appointment.package}\nDate: ${appointment.date}\nTime: ${appointment.time}\n\nPlease contact us for more information.`,
    });
  } catch (err) {
    console.error("Failed to send appointment rejection email:", err);
    // Just log it and continue
  }
};

// Send KYC approval email
export const sendKYCApprovalEmail = async (email, fullName) => {
  // Ensure transporter is initialized
  const currentTransporter = initializeTransporter();

  // If transporter is not available, skip sending email
  if (!currentTransporter) {
    console.warn("Email transporter not available, skipping email send");
    return;
  }

  try {
    await currentTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "KYC Approved - PETVERSE",
      text: `Dear ${fullName},\n\nCongratulations! Your KYC verification has been approved.\n\nYou can now fully access all service provider features on PETVERSE.\n\nBest regards,\nThe PETVERSE Team`,
    });
  } catch (err) {
    console.error("Failed to send KYC approval email:", err);
    // Just log it and continue
  }
};

// Send KYC rejection email
export const sendKYCRejectionEmail = async (email, fullName, reason) => {
  // Ensure transporter is initialized
  const currentTransporter = initializeTransporter();

  // If transporter is not available, skip sending email
  if (!currentTransporter) {
    console.warn("Email transporter not available, skipping email send");
    return;
  }

  try {
    await currentTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "KYC Rejected - PETVERSE",
      text: `Dear ${fullName},\n\nWe're sorry to inform you that your KYC verification has been rejected.\n\nReason: ${reason}\n\nPlease review the information you provided and resubmit your documents.\n\nBest regards,\nThe PETVERSE Team`,
    });
  } catch (err) {
    console.error("Failed to send KYC rejection email:", err);
    // Just log it and continue
  }
};

// Export transporter getter function
export const getTransporter = () => {
  return initializeTransporter();
};

export default {
  sendOtpEmail,
  sendAppointmentApprovalEmail,
  sendAppointmentRejectionEmail,
  sendKYCApprovalEmail,
  sendKYCRejectionEmail,
  getTransporter,
};
