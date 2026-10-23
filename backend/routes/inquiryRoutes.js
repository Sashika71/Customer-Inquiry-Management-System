
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
} = require("../controllers/inquiryController");

const router = express.Router();


router.post("/", createInquiry);

router.get("/", authMiddleware, getAllInquiries);

router.get("/:id", authMiddleware, getInquiryById);


router.patch("/:id/status", authMiddleware, updateInquiryStatus);

module.exports = router;
