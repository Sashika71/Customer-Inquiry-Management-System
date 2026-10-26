
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  getPossibleDuplicates,
  markInquiryAsDuplicate, 
} = require("../controllers/inquiryController");

const {
  sendInquiryEmail,
   sendResolutionEmail,
} = require("../controllers/emailController");

const router = express.Router();

// Public route: submit a new inquiry.
router.post("/", createInquiry);

// Staff-only route: list inquiries with search and status filtering.
router.get("/", authMiddleware, getAllInquiries);

// Staff-only route: send an email to the customer of an inquiry.
router.post("/:id/send-email", authMiddleware, sendInquiryEmail);

// Staff-only route: check possible duplicates for an inquiry.
router.get("/:id/possible-duplicates", authMiddleware, getPossibleDuplicates);

// Staff-only route: confirm and mark an inquiry as a duplicate.
router.patch("/:id/duplicate", authMiddleware, markInquiryAsDuplicate);

// Staff-only route: get one inquiry by ID.
router.get("/:id", authMiddleware, getInquiryById);

// Staff-only route: update inquiry status.
router.patch("/:id/status", authMiddleware, updateInquiryStatus);

// Staff-only route: email the customer with the resolution details.
router.post(
  "/:id/send-resolution-email",authMiddleware,sendResolutionEmail);

module.exports = router;
