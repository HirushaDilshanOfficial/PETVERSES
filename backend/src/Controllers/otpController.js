// controllers/otpController.js
import { generateOtp, verifyOtp } from "../UOtpService.js";

export const sendOtp = async (req, res) => {
  try {

        console.log("📩 Incoming body:", req.body);

    const { resourceType, resourceID, email } = req.body;
    if (!resourceType || !resourceID || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await generateOtp(resourceType, resourceID, email);
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtpController = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { resourceType, resourceID, otp } = req.body;
    if (!resourceType || !resourceID || !otp) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // call your service
    const result = await verifyOtp(resourceType, resourceID, otp);
    console.log("Verifying OTP:", { resourceType, resourceID, otp });

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    
    return res.json({
      success: true,
      message: "OTP verified successfully",
      resourceType,
      resourceID, // this is your orderID if resourceType = "order"
      transactionID: result.transactionID || null,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};