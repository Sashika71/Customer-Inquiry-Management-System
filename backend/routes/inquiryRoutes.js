
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      subject,
      message,
    } = req.body;

    if (!customer_name || !customer_email || !subject || !message) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const result = await req.app.locals.pool.query(
      `INSERT INTO inquiries
       (customer_name, customer_email, subject, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [customer_name, customer_email, subject, message]
    );

    return res.status(201).json({
      message: "Inquiry submitted successfully",
      inquiry: result.rows[0],
    });
  } catch (error) {
    console.error("Inquiry submission failed:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const result = await req.app.locals.pool.query(
      `SELECT * FROM inquiries
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      inquiries: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch inquiries:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;

    const result = await req.app.locals.pool.query(
      "SELECT * FROM inquiries WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      inquiry: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to fetch inquiry:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});


router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["New", "In Progress", "Resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const result = await req.app.locals.pool.query(
      `UPDATE inquiries
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found",
      });
    }

    return res.status(200).json({
      message: "Inquiry status updated successfully",
      inquiry: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update inquiry status:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;