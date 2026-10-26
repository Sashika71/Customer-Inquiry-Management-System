
// Check whether an ID is a valid PostgreSQL INTEGER ID.
function isValidInquiryId(id) {
  return (
    typeof id === "string" &&
    /^[1-9]\d*$/.test(id) &&
    Number(id) <= 2147483647
  );
}

// Normalize text before comparing inquiry subjects and messages.
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Calculate Jaccard similarity between two pieces of text.
// The result ranges from 0 (no shared words) to 1 (same word set).
function calculateSimilarity(text1, text2) {
  const words1 = new Set(normalizeText(text1).split(" ").filter(Boolean));
  const words2 = new Set(normalizeText(text2).split(" ").filter(Boolean));

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  const commonWords = [...words1].filter((word) => words2.has(word));
  const totalUniqueWords = new Set([...words1, ...words2]).size;

  return commonWords.length / totalUniqueWords;
}

// Determine whether an existing inquiry is a possible duplicate.
// Email must match, and either the subject or message must be sufficiently similar.
function findDuplicateMatch(newInquiry, existingInquiry) {
  const sameEmail =
    newInquiry.customer_email.trim().toLowerCase() ===
    existingInquiry.customer_email.trim().toLowerCase();

  if (!sameEmail) {
    return null;
  }

  const subjectSimilarity = calculateSimilarity(
    newInquiry.subject,
    existingInquiry.subject
  );

  const messageSimilarity = calculateSimilarity(
    newInquiry.message,
    existingInquiry.message
  );

  // Exact normalized subject is a strong match.
  const exactSubject =
    normalizeText(newInquiry.subject) ===
    normalizeText(existingInquiry.subject);

  // A similarity threshold helps catch small wording differences.
  const similarMessage = messageSimilarity >= 0.5;
  const similarSubject = subjectSimilarity >= 0.5;

  if (exactSubject || similarMessage || similarSubject) {
    return {
      id: existingInquiry.id,
      customer_name: existingInquiry.customer_name,
      customer_email: existingInquiry.customer_email,
      subject: existingInquiry.subject,
      message: existingInquiry.message,
      status: existingInquiry.status,
      created_at: existingInquiry.created_at,
      subject_similarity: Number(subjectSimilarity.toFixed(2)),
      message_similarity: Number(messageSimilarity.toFixed(2)),
    };
  }

  return null;
}

// Create a new customer inquiry.
// Duplicate detection does not automatically mark the inquiry as a duplicate.
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
      typeof body.subject === "string" ? body.subject.trim() : "";

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    // Ensure all required fields are provided.
    if (!customer_name || !customer_email || !subject || !message) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Validate maximum field lengths against the database schema.
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

    if (subject.length > 200) {
      return res.status(400).json({
        message: "Subject must not exceed 200 characters",
      });
    }

    // Perform basic email format validation.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(customer_email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    // Save the inquiry first. Duplicate decisions are left to staff.
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

// Return inquiries matching search text and/or status.
// Only authenticated staff members may access this list.
async function getAllInquiries(req, res) {
  try {
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const status =
      typeof req.query.status === "string" ? req.query.status.trim() : "";

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
           OR message ILIKE '%' || $2 || '%'
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

// Return one inquiry by ID.
// Only staff members may view individual inquiry details.
async function getInquiryById(req, res) {
  try {
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;

    if (!isValidInquiryId(id)) {
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

// Update an inquiry's status while enforcing allowed transitions.
async function updateInquiryStatus(req, res) {
  try {
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;
    const { status } = req.body || {};

    if (!isValidInquiryId(id)) {
      return res.status(400).json({
        message: "Invalid inquiry ID",
      });
    }

    const allowedStatuses = ["New", "In Progress", "Resolved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const pool = req.app.locals.pool;

    // Read the current status before deciding whether the transition is allowed.
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

    // Update only if the status has not changed since it was checked.
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

// Find possible duplicates for an inquiry.
// This endpoint is staff-only and does not mark anything automatically.
async function getPossibleDuplicates(req, res) {
  try {
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;

    if (!isValidInquiryId(id)) {
      return res.status(400).json({
        message: "Invalid inquiry ID",
      });
    }

    const pool = req.app.locals.pool;

    // Find the inquiry that staff wants to check.
    const inquiryResult = await pool.query(
      "SELECT * FROM inquiries WHERE id = $1",
      [id]
    );

    if (inquiryResult.rows.length === 0) {
      return res.status(404).json({
        message: "Inquiry not found",
      });
    }

    const inquiry = inquiryResult.rows[0];

    // Compare only inquiries from the same email address.
    const candidatesResult = await pool.query(
      `SELECT *
       FROM inquiries
       WHERE LOWER(TRIM(customer_email)) = LOWER(TRIM($1))
         AND id <> $2
       ORDER BY created_at DESC
       LIMIT 200`,
      [inquiry.customer_email, id]
    );

    // Use the helper to rank and return potential matches.
    const possibleDuplicates = candidatesResult.rows
      .map((candidate) => findDuplicateMatch(inquiry, candidate))
      .filter(Boolean)
      .sort(
        (a, b) =>
          Math.max(b.subject_similarity, b.message_similarity) -
          Math.max(a.subject_similarity, a.message_similarity)
      );

    return res.status(200).json({
      inquiry_id: inquiry.id,
      possibleDuplicates,
      message:
        "These are possible matches only. Staff must review before marking an inquiry as a duplicate.",
    });
  } catch (error) {
    console.error("Failed to find possible duplicates:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

// Mark an inquiry as a duplicate only after staff confirms the match.
async function markInquiryAsDuplicate(req, res) {
  try {
    if (req.user?.role !== "staff") {
      return res.status(403).json({
        message: "Access denied. Staff only.",
      });
    }

    const { id } = req.params;
    const { duplicate_of_id } = req.body || {};

    if (
      !isValidInquiryId(id) ||
      !isValidInquiryId(String(duplicate_of_id ?? ""))
    ) {
      return res.status(400).json({
        message: "Invalid inquiry ID",
      });
    }

    if (Number(id) === Number(duplicate_of_id)) {
      return res.status(400).json({
        message: "An inquiry cannot be a duplicate of itself",
      });
    }

    const pool = req.app.locals.pool;

    // Verify that both inquiries exist.
    const result = await pool.query(
      `SELECT id, is_duplicate
       FROM inquiries
       WHERE id = ANY($1::integer[])`,
      [[Number(id), Number(duplicate_of_id)]]
    );

    if (result.rows.length !== 2) {
      return res.status(404).json({
        message: "Inquiry or original inquiry not found",
      });
    }

    const inquiry = result.rows.find((row) => row.id === Number(id));

    if (inquiry.is_duplicate) {
      return res.status(409).json({
        message: "This inquiry is already marked as a duplicate",
      });
    }

    // Save the staff-confirmed duplicate relationship.
    const updateResult = await pool.query(
      `UPDATE inquiries
       SET is_duplicate = TRUE,
           duplicate_of_id = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [Number(duplicate_of_id), Number(id)]
    );

    return res.status(200).json({
      message: "Inquiry marked as a duplicate successfully",
      inquiry: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Failed to mark inquiry as duplicate:", error.message);

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
  getPossibleDuplicates,
  markInquiryAsDuplicate,
};
