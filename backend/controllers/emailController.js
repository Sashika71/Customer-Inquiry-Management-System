
const transporter = require("../config/mailer");

// Send a follow-up email to the customer of an inquiry.
async function sendInquiryEmail(req, res) {
  try {
    // Only authenticated staff members can send customer emails.
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;
    const body = req.body || {};

    // Validate the inquiry ID.
    if (
      typeof id !== "string" ||
      !/^[1-9]\d*$/.test(id) ||
      Number(id) > 2147483647
    ) {
      return res.status(400).json({
        message: "Invalid inquiry ID",
      });
    }

    // Validate the email subject and message provided by staff.
    const emailSubject =
      typeof body.subject === "string" ? body.subject.trim() : "";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!emailSubject || !message) {
      return res.status(400).json({
        message: "Email subject and message are required",
      });
    }

    if (emailSubject.length > 200 || message.length > 5000) {
      return res.status(400).json({
        message: "Subject must not exceed 200 characters and message must not exceed 5000 characters",
      });
    }

    // Find the inquiry and use its saved customer email address.
    const result = await req.app.locals.pool.query(
      `SELECT id, customer_name, customer_email, subject
       FROM inquiries
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found",
      });
    }

    const inquiry = result.rows[0];

    // Send the email through the configured Gmail account.
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: inquiry.customer_email,
      subject: emailSubject,
      text: `Hello ${inquiry.customer_name},\n\n${message}\n\nRegarding your inquiry: ${inquiry.subject}\nInquiry ID: ${inquiry.id}`,
    });

    return res.status(200).json({
      message: "Email sent successfully",
      inquiry_id: inquiry.id,
      recipient: inquiry.customer_email,
    });
  } catch (error) {
    // Keep technical details in the server log, not in the API response.
    console.error("Failed to send inquiry email:", error.message);

    return res.status(500).json({
      message: "Failed to send email. Please check the server configuration and try again.",
    });
  }
}


 // Send a resolution email to the customer.
async function sendResolutionEmail(req, res) {
  try {
    // Only staff members can send resolution emails.
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;
    const body = req.body || {};

    // Validate the inquiry ID.
    if (
      typeof id !== "string" ||
      !/^[1-9]\d*$/.test(id) ||
      Number(id) > 2147483647
    ) {
      return res.status(400).json({
        message: "Invalid inquiry ID",
      });
    }

    // Get the solution message written by staff.
    const solution =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!solution) {
      return res.status(400).json({
        message: "Resolution message is required",
      });
    }

    if (solution.length > 5000) {
      return res.status(400).json({
        message: "Resolution message must not exceed 5000 characters",
      });
    }

    // Find the inquiry and its customer email address.
    const result = await req.app.locals.pool.query(
      `SELECT id, customer_name, customer_email, subject, status
       FROM inquiries
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found",
      });
    }

    const inquiry = result.rows[0];

    // A resolution email can only be sent for a resolved inquiry.
    if (inquiry.status !== "Resolved") {
      return res.status(400).json({
        message: "Resolve the inquiry before sending a resolution email",
      });
    }

    // Send the staff-written solution using Gmail.
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: inquiry.customer_email,
      subject: `Your Inquiry Has Been Resolved - #${inquiry.id}`,
      text:
        `Hello ${inquiry.customer_name},\n\n` +
        `Your inquiry regarding "${inquiry.subject}" has been resolved.\n\n` +
        `Resolution:\n${solution}\n\n` +
        "Please let us know if you need any further assistance.",
    });

    return res.status(200).json({
      message: "Resolution email sent successfully",
      inquiry_id: inquiry.id,
      recipient: inquiry.customer_email,
    });
  } catch (error) {
    console.error("Failed to send resolution email:", error.message);

    return res.status(500).json({
      message: "Failed to send resolution email. Please try again.",
    });
  }
}






module.exports = { sendInquiryEmail,sendResolutionEmail, };



