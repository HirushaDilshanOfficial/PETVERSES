import crypto from "crypto";
import { sendOtpEmail } from "./emailService.js";

// Generic in-memory OTP store
// Structure: { resourceType: { resourceID: { otp, expires } } }
export const otpStore = {};

export const generateOtp = async (resourceType, resourceID, email) => {
  const otp = crypto.randomInt(100000, 999999).toString();

  if (!otpStore[resourceType]) otpStore[resourceType] = {};
  otpStore[resourceType][resourceID] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  };

  await sendOtpEmail(email, otp);
  return otp;
};

export const verifyOtp = (resourceType, resourceID, otp) => {
  const record = otpStore[resourceType]?.[resourceID];
  if (!record) return { valid: false, message: "OTP not found or expired" };
  if (Date.now() > record.expires) {
    delete otpStore[resourceType][resourceID];
    return { valid: false, message: "OTP expired" };
  }
  if (record.otp !== otp) return { valid: false, message: "Invalid OTP" };
  delete otpStore[resourceType][resourceID]; // remove after verification
  return { valid: true };
};