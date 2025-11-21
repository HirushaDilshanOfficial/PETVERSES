import User from "../Models/User.js";
import { getTransporter } from "../Utils/emailService.js";

// Send announcement to all service providers and customers
export const sendAnnouncement = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { subject, message, recipientType } = req.body;

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    // Get email transporter
    const transporter = getTransporter();

    // Check if email transporter is available
    if (!transporter) {
      console.error(
        "Email transporter is not available. Check environment variables."
      );
      return res.status(500).json({
        success: false,
        message:
          "Email service is not configured. Please contact system administrator.",
      });
    }

    // Log transporter verification status
    transporter.verify((error, success) => {
      if (error) {
        console.error("Email transporter verification failed:", error);
      } else {
        console.log("Email transporter verification successful");
      }
    });

    // Determine recipient filter based on type
    let userFilter = {
      role: { $in: ["petOwner", "serviceProvider"] },
      isActive: true,
    };

    if (recipientType === "serviceProviders") {
      userFilter.role = { $in: ["serviceProvider"] };
    } else if (recipientType === "customers") {
      userFilter.role = { $in: ["petOwner"] };
    }

    // Get recipients
    const recipients = await User.find(userFilter, "email fullName");

    if (recipients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No recipients found.",
      });
    }

    // Log recipient count
    console.log(`Sending announcement to ${recipients.length} recipients`);

    // Send emails with individual error handling
    const emailResults = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipient.email,
            subject: subject,
            text: `Dear ${recipient.fullName},\n\n${message}\n\nBest regards,\nPETVERSE Team`,
          };

          await transporter.sendMail(mailOptions);
          return { success: true, email: recipient.email };
        } catch (emailError) {
          console.error(
            `Failed to send email to ${recipient.email}:`,
            emailError
          );
          return {
            success: false,
            email: recipient.email,
            error: emailError.message,
          };
        }
      })
    );

    // Count successful and failed emails
    const successfulSends = emailResults.filter(
      (result) => result.success
    ).length;
    const failedSends = emailResults.filter((result) => !result.success);

    // Log results
    console.log(
      `Email sending completed: ${successfulSends} successful, ${failedSends.length} failed`
    );

    if (failedSends.length > 0) {
      console.warn(`${failedSends.length} emails failed to send:`);
      failedSends.forEach((failure) => {
        console.warn(`- ${failure.email}: ${failure.error}`);
      });
    }

    res.status(200).json({
      success: true,
      message: `Announcement sent successfully to ${successfulSends} users.`,
      data: {
        totalRecipients: recipients.length,
        successfulSends: successfulSends,
        failedSends: failedSends.length,
        failures: failedSends,
      },
    });
  } catch (error) {
    console.error("Error sending announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send announcement.",
      error: error.message,
    });
  }
};

export default {
  sendAnnouncement,
};
