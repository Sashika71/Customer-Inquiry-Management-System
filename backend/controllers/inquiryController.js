
async function createInquiry(req, res) {
  try {
    const body = req.body || {};

    const customer_name =
      typeof body.customer_name === "string"
        ? body.customer_name.trim()
        : "";

    const customer_email =
      typeof body.customer_email === "string"
        ? body.customer_email.trim()
        : "";

    const subject =
      typeof body.subject === "string"
        ? body.subject.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

   
    if (!customer_name || !customer_email || !subject || !message) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

   
    if (customer_name.length > 100) {
      return res.status(400).json({
        message: "Customer name must not exceed 100 characters",
      });
    }

    if (customer_email.length > 255) {
      return res.status(400).json({
        message: "Email must not exceed 255 characters",
      });
    }

    if (subject.length > 300) {
      return res.status(400).json({
        message: "Subject must not exceed 300 characters",
      });
    }

    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(customer_email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
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
}

async function getAllInquiries(req, res) {
  try {
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status.trim()
        : "";

    const allowedStatuses = ["New", "In Progress", "Resolved"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status filter",
      });
    }

    const result = await req.app.locals.pool.query(
      `SELECT *
       FROM inquiries
       WHERE ($1::text IS NULL OR status = $1)
         AND (
           $2::text IS NULL
           OR customer_name ILIKE '%' || $2 || '%'
           OR customer_email ILIKE '%' || $2 || '%'
           OR subject ILIKE '%' || $2 || '%'
         )
       ORDER BY created_at DESC`,
      [status || null, search || null]
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
}



async function getInquiryById(req, res) {
  try {
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;

    // Validate ID before querying PostgreSQL
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid inquiry ID",
      });
    }

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
}

async function updateInquiryStatus(req, res) {
  try {
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;
    const { status } = req.body || {};

    // Validate inquiry ID
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid inquiry ID",
      });
    }

    // Validate requested status
    const allowedStatuses = ["New", "In Progress", "Resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const pool = req.app.locals.pool;

    // Find the existing inquiry
    const existingResult = await pool.query(
      "SELECT * FROM inquiries WHERE id = $1",
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found",
      });
    }

    const currentStatus = existingResult.rows[0].status;

    // Define permitted status transitions
    const allowedTransitions = {
      New: ["In Progress", "Resolved"],
      "In Progress": ["Resolved"],
      Resolved: [],
    };

    if (currentStatus === status) {
      return res.status(400).json({
        message: "Inquiry already has this status",
      });
    }

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    // Update only if the status has not changed since it was checked
    const result = await pool.query(
      `UPDATE inquiries
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = $3
       RETURNING *`,
      [status, id, currentStatus]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        message:
          "Inquiry was updated by another request. Please refresh and try again.",
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
}


module.exports = {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
};
