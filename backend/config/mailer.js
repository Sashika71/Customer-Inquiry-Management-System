
const nodemailer = require("nodemailer");

// Create a transporter to send emails through Gmail.
const transporter = nodemailer.createTransport({
  service: "gmail",

  // Read Gmail credentials securely from the backend .env file.
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Export the transporter so controllers can send emails.
module.exports = transporter;
