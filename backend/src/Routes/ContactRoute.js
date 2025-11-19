import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // Basic validation
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email, and message are required" });
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const USER = process.env.EMAIL_USER;
    const PASS = process.env.EMAIL_PASS;

    if (!USER || !PASS || !ADMIN_EMAIL) {
      return res.status(500).json({
        success: false,
        message: "Email credentials not configured (set EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL)",
      });
    }

    // Choose transport: Ethereal (dev) or Gmail SMTP (prod)
    let transporter;
    if (process.env.EMAIL_TRANSPORT === "ethereal") {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: USER,
          pass: PASS, // MUST be a Gmail App Password
        },
      });
    }

    // Compose and send
    const info = await transporter.sendMail({
      from: `Petverse Contact <${USER}>`, // authenticated sender
      to: ADMIN_EMAIL, // admin recipient
      replyTo: `${name} <${email}>`, // replies go to the user
      subject: subject && subject.trim() ? `[Contact] ${subject.trim()}` : "New Contact Message",
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><b>Name:</b> ${name}</p>
             <p><b>Email:</b> ${email}</p>
             <p><b>Subject:</b> ${subject || "(none)"}</p>
             <p><b>Message:</b></p>
             <p>${String(message).replace(/\n/g, "<br/>")}</p>`,
    });

    // Ethereal preview URL (dev only)
    const previewUrl = process.env.EMAIL_TRANSPORT === "ethereal" ? nodemailer.getTestMessageUrl(info) : undefined;

    return res.status(200).json({ success: true, message: "Message sent successfully!", previewUrl });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, message: error?.message || "Failed to send message" });
  }
});

export default router;
