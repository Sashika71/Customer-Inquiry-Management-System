
const express = require("express");
const cors = require("cors");

const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.locals.pool = pool;

app.get("/", (req, res) => {
  res.send("Customer Inquiry Management System API is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/inquiries", inquiryRoutes);

module.exports = app;
